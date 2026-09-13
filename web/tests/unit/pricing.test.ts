import { describe, expect, it } from "vitest";

import { formatOrderNo } from "@/lib/format";
import {
  bonusRatePercent,
  cashAfterPoints,
  clampPoints,
  discountRate,
  earnPoints,
  effectivePrice,
  formatWon,
  maxUsablePoints,
  savingsAmount,
  sumPaidRevenue,
} from "@/lib/pricing";

const now = new Date("2026-09-13T00:00:00Z");

describe("pricing", () => {
  it.each([
    [2_900, 1_990, 31],
    [2_400, 1_900, 20],
    [24_000, 18_000, 25],
    [2_900, 2_400, 17],
    [0, null, 0],
  ])("calculates a conservative discount rate", (listPrice, salePrice, expected) => {
    expect(discountRate({ listPrice, salePrice }, now)).toBe(expected);
  });

  it("does not apply an expired sale", () => {
    const price = {
      listPrice: 2_400,
      salePrice: 1_900,
      saleEndsAt: "2026-09-12T23:59:59Z",
    };
    expect(discountRate(price, now)).toBe(0);
    expect(effectivePrice(price, now)).toBe(2_400);
  });

  it.each([
    ["9000", 12_300, 2_400, 2_400],
    ["-5", 12_300, 2_400, 0],
    ["12.7", 10, 2_400, 10],
    ["abc", 12_300, 2_400, 0],
  ])("clamps requested points", (requested, balance, payable, expected) => {
    expect(clampPoints(requested, balance, payable)).toBe(expected);
  });

  it.each([
    [2_400, 3, 72],
    [1_990, 3, 59],
    [0, 3, 0],
  ])("earns points only from cash", (cash, rate, expected) => {
    expect(earnPoints(cash, rate)).toBe(expected);
  });

  it("formats integer won amounts with the Korean locale", () => {
    expect(formatWon(12_900)).toBe("₩12,900");
  });

  it("keeps checkout, savings, bonus, and revenue calculations in pure helpers", () => {
    expect(savingsAmount(12_000, 9_000)).toBe(3_000);
    expect(cashAfterPoints(9_000, 2_500)).toBe(6_500);
    expect(maxUsablePoints(10_000, 9_000)).toBe(9_000);
    expect(bonusRatePercent(10_000, 1_000)).toBe(10);
    expect(
      sumPaidRevenue([
        { status: "paid", cashPaid: 6_500 },
        { status: "refunded", cashPaid: 9_000 },
      ]),
    ).toBe(6_500);
  });

  it("formats order numbers from the Asia/Seoul calendar date", () => {
    expect(formatOrderNo(new Date("2026-09-12T16:00:00Z"), 42)).toBe("20260913-000042");
  });
});
