export const EARN_RATE_PERCENT = 3;
export const PAID_EXPIRY_MONTHS = 12;
export const BONUS_EXPIRY_MONTHS = 6;

export const POINT_PACKAGES = [
  { id: "point-5000", price: 5_000, paidPoints: 5_000, bonusPoints: 0 },
  { id: "point-10000", price: 10_000, paidPoints: 10_000, bonusPoints: 500 },
  { id: "point-30000", price: 30_000, paidPoints: 30_000, bonusPoints: 3_000 },
  { id: "point-50000", price: 50_000, paidPoints: 50_000, bonusPoints: 7_500 },
] as const;

export type PointPackageId = (typeof POINT_PACKAGES)[number]["id"];

export function getPointPackage(id: string) {
  return POINT_PACKAGES.find((pointPackage) => pointPackage.id === id) ?? null;
}
