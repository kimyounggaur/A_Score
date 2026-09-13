import { describe, expect, it } from "vitest";

import { allocateSpend } from "@/lib/points/allocate";
import {
  applyAllocations,
  balanceByBucket,
  earliestUsableExpiry,
  expiringWithin,
  sumRemaining,
  usableLots,
} from "@/lib/points/ledger";
import type { PointLot } from "@/lib/points/types";

const now = new Date("2026-09-13T00:00:00Z");
const lots: PointLot[] = [
  {
    id: "paid-later",
    bucket: "paid",
    remaining: 500,
    expiresAt: "2026-12-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "paid-soon",
    bucket: "paid",
    remaining: 300,
    expiresAt: "2026-10-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "bonus-soon",
    bucket: "bonus",
    remaining: 200,
    expiresAt: "2026-10-01T00:00:00Z",
    createdAt: "2026-08-01T00:00:00Z",
  },
  {
    id: "expired",
    bucket: "bonus",
    remaining: 999,
    expiresAt: "2026-09-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

describe("point allocation", () => {
  it("uses soonest expiry, bonus first on ties, then older lots", () => {
    expect(allocateSpend(lots, 600, now)).toEqual([
      { lotId: "bonus-soon", amount: 200 },
      { lotId: "paid-soon", amount: 300 },
      { lotId: "paid-later", amount: 100 },
    ]);
  });

  it("throws the stable insufficient balance code", () => {
    expect(() => allocateSpend(lots, 1_001, now)).toThrow("INSUFFICIENT_POINTS");
  });

  it("splits the balance by paid and bonus buckets and excludes expired lots", () => {
    expect(balanceByBucket(lots, now)).toEqual({ paid: 800, bonus: 200, total: 1_000 });
  });

  it("finds only usable points expiring within the requested period", () => {
    expect(expiringWithin(lots, 30, now).map((lot) => lot.id)).toEqual(["paid-soon", "bonus-soon"]);
  });

  it("applies allocations without mutating input lots", () => {
    const updated = applyAllocations(lots, [{ lotId: "paid-soon", amount: 100 }]);
    expect(updated.find((lot) => lot.id === "paid-soon")?.remaining).toBe(200);
    expect(lots.find((lot) => lot.id === "paid-soon")?.remaining).toBe(300);
  });

  it("summarizes usable lots and expiry without UI arithmetic", () => {
    expect(sumRemaining(expiringWithin(lots, 30, now))).toBe(500);
    expect(earliestUsableExpiry(lots, "paid", now)).toBe("2026-10-01T00:00:00Z");
    expect(usableLots(lots, now).map((lot) => lot.id)).toEqual([
      "paid-soon",
      "bonus-soon",
      "paid-later",
    ]);
  });
});
