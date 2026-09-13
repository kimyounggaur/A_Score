import { describe, expect, it } from "vitest";

import { MockPaymentGateway } from "@/lib/payments/mock-gateway";
import type { Order } from "@/lib/repositories/interfaces";

const order: Order = {
  id: "order-refresh-safe",
  orderNo: "20260913-000001",
  userId: "demo-user",
  items: [],
  status: "pending",
  listAmount: 2_400,
  totalAmount: 2_400,
  pointsUsed: 1_000,
  cashPaid: 1_400,
  earnedPoints: 42,
  paymentMethod: "card",
  paymentRef: null,
  createdAt: "2026-09-13T00:00:00Z",
  finalizedAt: null,
  failureCode: null,
  refundReason: null,
};

describe("mock payment gateway", () => {
  it("confirms after a refresh with a new gateway instance", async () => {
    const firstGateway = new MockPaymentGateway({ delayMs: 0 });
    const request = await firstGateway.requestPayment(order);
    const refreshedGateway = new MockPaymentGateway({
      delayMs: 0,
      now: () => new Date("2026-09-13T00:01:00Z"),
    });
    expect(
      new URL(request.redirectUrl, "https://scorestore.invalid").searchParams.get("amount"),
    ).toBe("1400");
    await expect(
      refreshedGateway.confirmPayment(request.paymentKey, order.id, order.cashPaid),
    ).resolves.toMatchObject({ orderId: order.id, amount: 1_400, status: "approved" });
  });

  it("rejects a forged amount", async () => {
    const gateway = new MockPaymentGateway({ delayMs: 0 });
    const request = await gateway.requestPayment(order);
    await expect(gateway.confirmPayment(request.paymentKey, order.id, 1)).rejects.toMatchObject({
      code: "AMOUNT_MISMATCH",
    });
  });

  it("exposes an explicit mockFail option for the query-string scenario", async () => {
    const gateway = new MockPaymentGateway({ delayMs: 0 });
    await expect(gateway.requestPayment(order, { mockFail: true })).rejects.toMatchObject({
      code: "MOCK_PAYMENT_FAILED",
    });
  });

  it("does not send a zero-cash order to the payment gateway", async () => {
    const gateway = new MockPaymentGateway({ delayMs: 0 });
    await expect(
      gateway.requestPayment({
        ...order,
        pointsUsed: order.totalAmount,
        cashPaid: 0,
        earnedPoints: 0,
        paymentMethod: "points",
      }),
    ).rejects.toMatchObject({ code: "PAYMENT_NOT_REQUIRED" });
  });
});
