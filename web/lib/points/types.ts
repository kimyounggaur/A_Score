export type PointBucket = "paid" | "bonus";
export type PointTransactionType = "charge" | "bonus" | "earn" | "spend" | "expire" | "refund";

export interface PointLot {
  id: string;
  bucket: PointBucket;
  remaining: number;
  expiresAt: string;
  createdAt: string;
}

export type Lot = PointLot;

export interface PointAllocation {
  lotId: string;
  amount: number;
}

export type Allocation = PointAllocation;

export interface PointTransaction {
  id: string;
  userId: string;
  type: PointTransactionType;
  bucket: PointBucket | null;
  amount: number;
  referenceId: string | null;
  /** 거래가 증감시킨 lot. 구버전 브라우저 문서와의 호환을 위해 선택값이다. */
  lotId?: string | null;
  /** 환불 역분개가 취소하는 원거래 id. */
  reversalOf?: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface PointBalance {
  paid: number;
  bonus: number;
  total: number;
}
