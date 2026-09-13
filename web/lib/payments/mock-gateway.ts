import type {
  PaymentConfirmation,
  PaymentGateway,
  PaymentRequestResult,
  PaymentRequestOptions,
} from "@/lib/payments/gateway";
import { PaymentGatewayError } from "@/lib/payments/gateway";
import type { Order } from "@/lib/repositories/interfaces";

export interface MockPaymentGatewayOptions {
  delayMs?: number;
  shouldFail?: boolean | ((orderId: string) => boolean);
  now?: () => Date;
}

export class MockPaymentGateway implements PaymentGateway {
  private sequence = 0;

  constructor(private readonly options: MockPaymentGatewayOptions = {}) {}

  private async delay(): Promise<void> {
    const delayMs = this.options.delayMs ?? 120;
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private fails(orderId: string): boolean {
    return typeof this.options.shouldFail === "function"
      ? this.options.shouldFail(orderId)
      : Boolean(this.options.shouldFail);
  }

  async requestPayment(
    order: Order,
    requestOptions: PaymentRequestOptions = {},
  ): Promise<PaymentRequestResult> {
    await this.delay();
    if (!Number.isSafeInteger(order.cashPaid) || order.cashPaid <= 0) {
      throw new PaymentGatewayError(
        "PAYMENT_NOT_REQUIRED",
        "현금 결제가 없는 주문은 결제 게이트웨이를 호출하지 않아요.",
      );
    }
    if (requestOptions.mockFail || this.fails(order.id)) {
      throw new PaymentGatewayError(
        "MOCK_PAYMENT_FAILED",
        "모의 결제에 실패했어요. 결제 수단을 확인하고 다시 시도해 주세요.",
      );
    }
    this.sequence += 1;
    // orderId와 금액을 키에 담아 새로고침 후 새 gateway 인스턴스에서도 검증할 수 있게 한다.
    // 실서비스 서명이 아니라 Stage B용 계약이며, 최종 금액 검증은 OrderRepository가 담당한다.
    const paymentKey = `mock:${encodeURIComponent(order.id)}:${order.cashPaid}:${this.sequence}`;
    const search = new URLSearchParams({
      orderId: order.id,
      paymentKey,
      amount: String(order.cashPaid),
    });
    return { paymentKey, redirectUrl: `/checkout/success?${search.toString()}` };
  }

  async confirmPayment(
    paymentKey: string,
    orderId: string,
    amount: number,
  ): Promise<PaymentConfirmation> {
    await this.delay();
    const [prefix, encodedOrderId, encodedAmount] = paymentKey.split(":");
    const keyOrderId = encodedOrderId ? decodeURIComponent(encodedOrderId) : "";
    const keyAmount = Number(encodedAmount);
    if (
      prefix !== "mock" ||
      keyOrderId !== orderId ||
      !Number.isSafeInteger(keyAmount) ||
      keyAmount <= 0
    ) {
      throw new PaymentGatewayError(
        "PAYMENT_NOT_FOUND",
        "결제 정보를 찾을 수 없어요. 주문 내역을 확인해 주세요.",
      );
    }
    if (keyAmount !== amount) {
      throw new PaymentGatewayError(
        "AMOUNT_MISMATCH",
        "결제 금액이 주문 금액과 달라 승인할 수 없어요.",
      );
    }
    return {
      paymentKey,
      orderId,
      amount,
      approvedAt: (this.options.now?.() ?? new Date()).toISOString(),
      status: "approved",
    };
  }
}

export const mockPaymentGateway = new MockPaymentGateway();
