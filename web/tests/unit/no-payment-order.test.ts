import { describe, expect, it } from "vitest";

import { PRODUCT_TYPE } from "@/lib/catalog/taxonomy";
import { effectivePrice } from "@/lib/pricing";
import type { PointTransaction } from "@/lib/points/types";
import type { RepositoryError } from "@/lib/repositories/interfaces";
import { createMockRepositories } from "@/lib/repositories/mock";
import { createMemoryStorage } from "@/lib/repositories/mock/storage";

const now = new Date("2026-09-13T00:00:00Z");

function setup() {
  return createMockRepositories({ storage: createMemoryStorage(), now: () => now });
}

describe("orders without a cash payment", () => {
  it("finalizes a full-point order idempotently without a PG reference", async () => {
    const repositories = setup();
    await repositories.points.charge("demo-user", "point-5000");
    const product = await repositories.catalog.getProduct(1004);
    expect(product).not.toBeNull();
    const amount = effectivePrice(product!, now);
    const order = await repositories.orders.createOrder({
      userId: "demo-user",
      items: [{ productId: product!.id, type: PRODUCT_TYPE.SCORE }],
      clientAmount: amount,
      pointsToUse: amount,
      paymentMethod: "points",
    });

    const first = await repositories.orders.finalizeNoPaymentOrder(order.id);
    const historyAfterFirst = await repositories.points.listHistory("demo-user");
    const second = await repositories.orders.finalizeNoPaymentOrder(order.id);
    const historyAfterSecond = await repositories.points.listHistory("demo-user");

    expect(first).toMatchObject({
      status: "paid",
      cashPaid: 0,
      earnedPoints: 0,
      paymentRef: `no-payment:${order.id}`,
    });
    expect(second).toEqual(first);
    expect(historyAfterSecond).toEqual(historyAfterFirst);
    expect(
      historyAfterSecond.filter(
        (transaction: PointTransaction) =>
          transaction.type === "spend" && transaction.referenceId === order.id,
      ),
    ).toHaveLength(1);
    await expect(repositories.library.hasPurchased("demo-user", product!.id)).resolves.toBe(true);
  });

  it("requires PG approval for an order with a positive cash balance", async () => {
    const repositories = setup();
    const product = await repositories.catalog.getProduct(1004);
    expect(product).not.toBeNull();
    const amount = effectivePrice(product!, now);
    const order = await repositories.orders.createOrder({
      userId: "demo-user",
      items: [{ productId: product!.id, type: PRODUCT_TYPE.SCORE }],
      clientAmount: amount,
      pointsToUse: 0,
      paymentMethod: "card",
    });

    await expect(repositories.orders.finalizeNoPaymentOrder(order.id)).rejects.toMatchObject<
      Partial<RepositoryError>
    >({ code: "PAYMENT_REQUIRED" });
  });
});
