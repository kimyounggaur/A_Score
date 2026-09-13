import type { Order } from "@/lib/repositories/interfaces";

export interface PaymentRequestResult {
  paymentKey: string;
  redirectUrl: string;
}

export interface PaymentConfirmation {
  paymentKey: string;
  orderId: string;
  amount: number;
  approvedAt: string;
  status: "approved";
}

export interface PaymentRequestOptions {
  /** Stage B 실패 화면을 재현할 때 `/checkout?mockFail=1`에서 전달한다. */
  mockFail?: boolean;
}

export interface PaymentGateway {
  /** PG에는 포인트 차감 뒤 실제 현금 승인액인 order.cashPaid만 전달한다. */
  requestPayment(order: Order, options?: PaymentRequestOptions): Promise<PaymentRequestResult>;
  confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<PaymentConfirmation>;
}

export class PaymentGatewayError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PaymentGatewayError";
  }
}
