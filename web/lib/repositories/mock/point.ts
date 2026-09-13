import { BONUS_EXPIRY_MONTHS, getPointPackage, PAID_EXPIRY_MONTHS } from "@/lib/config/points";
import { allocateSpend } from "@/lib/points/allocate";
import { applyAllocations, balanceByBucket } from "@/lib/points/ledger";
import type {
  PointAllocation,
  PointBucket,
  PointLot,
  PointTransaction,
  PointTransactionType,
} from "@/lib/points/types";
import type {
  PointChargeResult,
  PointOrderRefund,
  PointOrderRefundResult,
  PointRepository,
} from "@/lib/repositories/interfaces";
import { RepositoryError } from "@/lib/repositories/interfaces";
import {
  createMockId,
  MOCK_STORAGE_KEYS,
  type VersionedMockStorage,
} from "@/lib/repositories/mock/storage";

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export class MockPointRepository implements PointRepository {
  constructor(
    private readonly store: VersionedMockStorage,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private readLotsByUser(): Record<string, PointLot[]> {
    if (!this.store.available) return {};
    return this.store.read<Record<string, PointLot[]>>(MOCK_STORAGE_KEYS.pointLots, {});
  }

  private readTransactions(): PointTransaction[] {
    if (!this.store.available) return [];
    return this.store.read<PointTransaction[]>(MOCK_STORAGE_KEYS.pointTransactions, []);
  }

  private readPointSettings() {
    return this.store.read(MOCK_STORAGE_KEYS.settings, {
      paidExpiryMonths: PAID_EXPIRY_MONTHS,
      bonusExpiryMonths: BONUS_EXPIRY_MONTHS,
      pointChargeEnabled: true,
    });
  }

  private appendTransaction(transaction: PointTransaction): void {
    this.store.write(MOCK_STORAGE_KEYS.pointTransactions, [
      ...this.readTransactions(),
      transaction,
    ]);
  }

  private createLot(
    userId: string,
    bucket: PointBucket,
    amount: number,
    expiryMonths: number,
    type: PointTransactionType,
    referenceId: string,
  ): PointLot {
    const now = this.now();
    const lot: PointLot = {
      id: createMockId(`lot-${bucket}`, now),
      bucket,
      remaining: amount,
      expiresAt: addMonths(now, expiryMonths).toISOString(),
      createdAt: now.toISOString(),
    };
    const lotsByUser = this.readLotsByUser();
    lotsByUser[userId] = [...(lotsByUser[userId] ?? []), lot];
    this.store.write(MOCK_STORAGE_KEYS.pointLots, lotsByUser);
    this.appendTransaction({
      id: createMockId("point-tx", now),
      userId,
      type,
      bucket,
      amount,
      referenceId,
      lotId: lot.id,
      reversalOf: null,
      createdAt: now.toISOString(),
      expiresAt: lot.expiresAt,
    });
    return lot;
  }

  async getLots(userId: string): Promise<PointLot[]> {
    return this.readLotsByUser()[userId] ?? [];
  }

  async getBalance(userId: string) {
    return balanceByBucket(await this.getLots(userId), this.now());
  }

  async charge(userId: string, packageId: string): Promise<PointChargeResult> {
    const settings = this.readPointSettings();
    if (!settings.pointChargeEnabled) {
      throw new RepositoryError(
        "POINT_CHARGE_DISABLED",
        "포인트 충전은 현재 준비 중이에요. 포인트 내역에서 다시 확인해 주세요.",
      );
    }
    const pointPackage = getPointPackage(packageId);
    if (!pointPackage) {
      throw new RepositoryError("POINT_PACKAGE_NOT_FOUND", "포인트 상품을 찾을 수 없어요.");
    }
    const paidLot = this.createLot(
      userId,
      "paid",
      pointPackage.paidPoints,
      settings.paidExpiryMonths,
      "charge",
      packageId,
    );
    const bonusLot =
      pointPackage.bonusPoints > 0
        ? this.createLot(
            userId,
            "bonus",
            pointPackage.bonusPoints,
            settings.bonusExpiryMonths,
            "bonus",
            packageId,
          )
        : null;
    return { paidLot, bonusLot, balance: await this.getBalance(userId) };
  }

  async spend(userId: string, amount: number, orderId: string): Promise<PointAllocation[]> {
    if (amount === 0) return [];
    const prior = this.readTransactions().some(
      (transaction) =>
        transaction.userId === userId &&
        transaction.type === "spend" &&
        transaction.referenceId === orderId,
    );
    if (prior) return [];

    const lots = await this.getLots(userId);
    let allocations: PointAllocation[];
    try {
      allocations = allocateSpend(lots, amount, this.now());
    } catch (error) {
      if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
        throw new RepositoryError("INSUFFICIENT_POINTS", "사용할 수 있는 포인트가 부족해요.");
      }
      throw error;
    }
    const lotsByUser = this.readLotsByUser();
    lotsByUser[userId] = applyAllocations(lots, allocations);
    this.store.write(MOCK_STORAGE_KEYS.pointLots, lotsByUser);

    const now = this.now();
    for (const allocation of allocations) {
      const lot = lots.find((candidate) => candidate.id === allocation.lotId);
      this.appendTransaction({
        id: createMockId("point-tx", now),
        userId,
        type: "spend",
        bucket: lot?.bucket ?? null,
        amount: -allocation.amount,
        referenceId: orderId,
        lotId: lot?.id ?? allocation.lotId,
        reversalOf: null,
        createdAt: now.toISOString(),
        expiresAt: lot?.expiresAt ?? null,
      });
    }
    return allocations;
  }

  async earn(userId: string, amount: number, orderId: string): Promise<PointLot | null> {
    if (amount <= 0) return null;
    const prior = this.readTransactions().some(
      (transaction) =>
        transaction.userId === userId &&
        transaction.type === "earn" &&
        transaction.referenceId === orderId,
    );
    if (prior) return null;
    return this.createLot(
      userId,
      "bonus",
      amount,
      this.readPointSettings().bonusExpiryMonths,
      "earn",
      orderId,
    );
  }

  async refundOrder(userId: string, refund: PointOrderRefund): Promise<PointOrderRefundResult> {
    const allTransactions = this.readTransactions();
    const sourceTransactions = allTransactions.filter(
      (transaction) => transaction.userId === userId && transaction.referenceId === refund.orderId,
    );
    const spendTransactions = sourceTransactions.filter(
      (transaction) => transaction.type === "spend" && transaction.amount < 0,
    );
    const earnTransactions = sourceTransactions.filter(
      (transaction) => transaction.type === "earn" && transaction.amount > 0,
    );
    const spentTotal = spendTransactions.reduce(
      (total, transaction) => total - transaction.amount,
      0,
    );
    const earnedTotal = earnTransactions.reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );

    if (spentTotal !== refund.pointsUsed || earnedTotal !== refund.earnedPoints) {
      throw new RepositoryError(
        "POINT_LEDGER_MISMATCH",
        "주문과 포인트 원장이 일치하지 않아 환불을 중단했습니다.",
        {
          orderId: refund.orderId,
          expectedPointsUsed: refund.pointsUsed,
          ledgerPointsUsed: spentTotal,
          expectedEarnedPoints: refund.earnedPoints,
          ledgerEarnedPoints: earnedTotal,
        },
      );
    }

    const now = this.now();
    const nowIso = now.toISOString();
    const settings = this.readPointSettings();
    const lotsByUser = this.readLotsByUser();
    const lots = (lotsByUser[userId] ?? []).map((lot) => ({ ...lot }));
    const reversals = allTransactions.filter(
      (transaction) =>
        transaction.userId === userId &&
        transaction.type === "refund" &&
        transaction.referenceId === refund.orderId,
    );
    const nextTransactions: PointTransaction[] = [];
    let restoredPoints = 0;
    let reversedEarnedPoints = 0;

    if (refund.restoreSpentPoints) {
      for (const spend of spendTransactions) {
        const alreadyRestored = reversals
          .filter((transaction) => transaction.reversalOf === spend.id && transaction.amount > 0)
          .reduce((total, transaction) => total + transaction.amount, 0);
        const amount = -spend.amount - alreadyRestored;
        if (amount <= 0) continue;
        if (!spend.bucket) {
          throw new RepositoryError(
            "POINT_LEDGER_MISMATCH",
            "사용 포인트의 버킷 정보가 없어 환불을 중단했습니다.",
            { orderId: refund.orderId, transactionId: spend.id },
          );
        }

        let lot = spend.lotId ? lots.find((candidate) => candidate.id === spend.lotId) : undefined;
        if (lot && lot.bucket !== spend.bucket) {
          throw new RepositoryError(
            "POINT_LEDGER_MISMATCH",
            "사용 포인트 lot의 버킷 정보가 일치하지 않아 환불을 중단했습니다.",
            { orderId: refund.orderId, transactionId: spend.id },
          );
        }
        if (!lot) {
          const expiryMonths =
            spend.bucket === "paid" ? settings.paidExpiryMonths : settings.bonusExpiryMonths;
          lot = {
            id: spend.lotId ?? createMockId(`refund-${spend.bucket}`, now),
            bucket: spend.bucket,
            remaining: 0,
            expiresAt: spend.expiresAt ?? addMonths(now, expiryMonths).toISOString(),
            createdAt: nowIso,
          };
          lots.push(lot);
        }
        lot.remaining += amount;
        restoredPoints += amount;
        nextTransactions.push({
          id: createMockId("point-tx", now),
          userId,
          type: "refund",
          bucket: spend.bucket,
          amount,
          referenceId: refund.orderId,
          lotId: lot.id,
          reversalOf: spend.id,
          createdAt: nowIso,
          expiresAt: lot.expiresAt,
        });
      }
    }

    for (const earn of earnTransactions) {
      const alreadyReversed = reversals
        .filter((transaction) => transaction.reversalOf === earn.id && transaction.amount < 0)
        .reduce((total, transaction) => total - transaction.amount, 0);
      let amount = earn.amount - alreadyReversed;
      if (amount <= 0) continue;

      const preferredLot = earn.lotId
        ? lots.find((candidate) => candidate.id === earn.lotId)
        : undefined;
      if (preferredLot && preferredLot.bucket !== "bonus") {
        throw new RepositoryError(
          "POINT_LEDGER_MISMATCH",
          "구매 적립 포인트 lot의 버킷 정보가 일치하지 않아 환불을 중단했습니다.",
          { orderId: refund.orderId, transactionId: earn.id },
        );
      }
      const candidates = [
        ...(preferredLot ? [preferredLot] : []),
        ...lots
          .filter(
            (lot) =>
              lot !== preferredLot &&
              lot.bucket === "bonus" &&
              lot.remaining > 0 &&
              Date.parse(lot.expiresAt) > now.getTime(),
          )
          .toSorted((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt)),
      ];
      const available = candidates.reduce((total, lot) => total + Math.max(0, lot.remaining), 0);
      if (available < amount) {
        throw new RepositoryError(
          "EARNED_POINTS_ALREADY_SPENT",
          "구매 적립 포인트 잔액이 부족해 자동 역분개할 수 없습니다.",
          { orderId: refund.orderId, required: amount, available },
        );
      }

      for (const lot of candidates) {
        if (amount === 0) break;
        const deducted = Math.min(Math.max(0, lot.remaining), amount);
        if (deducted === 0) continue;
        lot.remaining -= deducted;
        amount -= deducted;
        reversedEarnedPoints += deducted;
        nextTransactions.push({
          id: createMockId("point-tx", now),
          userId,
          type: "refund",
          bucket: "bonus",
          amount: -deducted,
          referenceId: refund.orderId,
          lotId: lot.id,
          reversalOf: earn.id,
          createdAt: nowIso,
          expiresAt: lot.expiresAt,
        });
      }
    }

    if (nextTransactions.length > 0) {
      lotsByUser[userId] = lots;
      this.store.write(MOCK_STORAGE_KEYS.pointLots, lotsByUser);
      this.store.write(MOCK_STORAGE_KEYS.pointTransactions, [
        ...allTransactions,
        ...nextTransactions,
      ]);
    }

    return {
      restoredPoints,
      reversedEarnedPoints,
      balance: balanceByBucket(lots, now),
    };
  }

  async listHistory(userId: string): Promise<PointTransaction[]> {
    return this.readTransactions()
      .filter((transaction) => transaction.userId === userId)
      .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
}
