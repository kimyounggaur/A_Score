import type { PointBalance, PointLot } from "@/lib/points/types";

function isUsable(lot: PointLot, now: Date): boolean {
  return lot.remaining > 0 && new Date(lot.expiresAt).getTime() > now.getTime();
}

export function balanceByBucket(lots: readonly PointLot[], now: Date = new Date()): PointBalance {
  const balance = lots.reduce(
    (current, lot) => {
      if (isUsable(lot, now)) current[lot.bucket] += lot.remaining;
      return current;
    },
    { paid: 0, bonus: 0 },
  );
  return { ...balance, total: balance.paid + balance.bonus };
}

export function balanceOf(lots: readonly PointLot[], now: Date = new Date()): number {
  return balanceByBucket(lots, now).total;
}

export function expiringWithin(
  lots: readonly PointLot[],
  days: number,
  now: Date = new Date(),
): PointLot[] {
  if (!Number.isFinite(days) || days < 0) return [];
  const until = now.getTime() + days * 24 * 60 * 60 * 1_000;
  return lots
    .filter((lot) => {
      const expiry = new Date(lot.expiresAt).getTime();
      return isUsable(lot, now) && expiry <= until;
    })
    .toSorted((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
}

export function sumRemaining(lots: readonly PointLot[]): number {
  return lots.reduce((total, lot) => total + Math.max(0, lot.remaining), 0);
}

export function earliestUsableExpiry(
  lots: readonly PointLot[],
  bucket: PointLot["bucket"],
  now: Date = new Date(),
): string | null {
  return (
    lots
      .filter((lot) => lot.bucket === bucket && isUsable(lot, now))
      .toSorted((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt))[0]?.expiresAt ?? null
  );
}

export function usableLots(lots: readonly PointLot[], now: Date = new Date()): PointLot[] {
  return lots
    .filter((lot) => isUsable(lot, now))
    .toSorted((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));
}

export function applyAllocations(
  lots: readonly PointLot[],
  allocations: readonly { lotId: string; amount: number }[],
): PointLot[] {
  const spendByLot = new Map(
    allocations.map((allocation) => [allocation.lotId, allocation.amount]),
  );
  return lots.map((lot) => {
    const spend = spendByLot.get(lot.id) ?? 0;
    if (spend > lot.remaining) throw new Error("POINT_ALLOCATION_EXCEEDS_LOT");
    return spend === 0 ? { ...lot } : { ...lot, remaining: lot.remaining - spend };
  });
}
