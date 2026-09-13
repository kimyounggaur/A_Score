export type Money = number;

export interface PriceInfo {
  listPrice: Money;
  salePrice?: Money | null;
  saleEndsAt?: string | null;
}

export function isFree(price: PriceInfo): boolean {
  return price.listPrice === 0;
}

export function isOnSale(price: PriceInfo, now: Date = new Date()): boolean {
  if (price.salePrice == null || price.listPrice <= 0) return false;
  if (price.salePrice >= price.listPrice || price.salePrice < 0) return false;
  if (price.saleEndsAt && new Date(price.saleEndsAt).getTime() <= now.getTime()) return false;
  return true;
}

export function effectivePrice(price: PriceInfo, now: Date = new Date()): Money {
  return isOnSale(price, now) ? (price.salePrice as Money) : price.listPrice;
}

/** 과장 표시를 막기 위해 할인율의 소수점 이하는 버린다. */
export function discountRate(price: PriceInfo, now: Date = new Date()): number {
  if (!isOnSale(price, now)) return 0;
  return Math.floor((1 - (price.salePrice as Money) / price.listPrice) * 100);
}

export function sumPayable(items: readonly PriceInfo[], now: Date = new Date()): Money {
  return items.reduce((total, item) => total + effectivePrice(item, now), 0);
}

export function sumList(items: readonly PriceInfo[]): Money {
  return items.reduce((total, item) => total + item.listPrice, 0);
}

/** 정가와 실제 판매가의 차액. 음수 입력에도 할인액은 0 아래로 내려가지 않는다. */
export function savingsAmount(listAmount: Money, payableAmount: Money): Money {
  return Math.max(0, listAmount - payableAmount);
}

/** 포인트 적용 뒤 PG가 실제로 승인할 현금 금액. */
export function cashAfterPoints(payableAmount: Money, pointsUsed: number): Money {
  return Math.max(0, payableAmount - Math.max(0, pointsUsed));
}

/** 결제 완료 주문의 실제 현금 매출만 합산한다. */
export function sumPaidRevenue(orders: readonly { status: string; cashPaid: Money }[]): Money {
  return orders.reduce(
    (total, order) => (order.status === "paid" ? total + order.cashPaid : total),
    0,
  );
}

/** 사용할 포인트를 정수, 0 이상, 보유 잔액 이하, 결제액 이하로 보정한다. */
export function clampPoints(requested: unknown, balance: number, payable: Money): number {
  const parsed = Math.floor(Number(requested));
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(parsed, Math.max(0, Math.floor(balance)), Math.max(0, Math.floor(payable)));
}

export function maxUsablePoints(balance: number, payable: Money): number {
  return clampPoints(Number.MAX_SAFE_INTEGER, balance, payable);
}

export function bonusRatePercent(paidPoints: number, bonusPoints: number): number {
  return paidPoints > 0 ? Math.round((Math.max(0, bonusPoints) / paidPoints) * 100) : 0;
}

/** 현금으로 실제 결제한 금액에 대해서만 포인트를 적립한다. */
export function earnPoints(cashPaid: Money, ratePercent: number): number {
  if (cashPaid <= 0 || ratePercent <= 0) return 0;
  return Math.floor((cashPaid * ratePercent) / 100);
}

export function formatWon(amount: Money): string {
  return `₩${new Intl.NumberFormat("ko-KR").format(amount)}`;
}
