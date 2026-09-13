import type { PointAllocation, PointLot } from "@/lib/points/types";

/** 사용 순서: 만료 임박 순 → 같은 만료일이면 무상 → 같은 버킷이면 오래된 순. */
export function allocateSpend(
  lots: readonly PointLot[],
  amount: number,
  now: Date = new Date(),
): PointAllocation[] {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer");
  }

  const usable = lots
    .filter((lot) => lot.remaining > 0 && new Date(lot.expiresAt).getTime() > now.getTime())
    .toSorted(
      (a, b) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime() ||
        (a.bucket === b.bucket ? 0 : a.bucket === "bonus" ? -1 : 1) ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const total = usable.reduce((sum, lot) => sum + lot.remaining, 0);
  if (total < amount) throw new Error("INSUFFICIENT_POINTS");

  const allocations: PointAllocation[] = [];
  let remaining = amount;
  for (const lot of usable) {
    if (remaining === 0) break;
    const allocated = Math.min(lot.remaining, remaining);
    allocations.push({ lotId: lot.id, amount: allocated });
    remaining -= allocated;
  }
  return allocations;
}
