import { describe, expect, it } from "vitest";

import { MockDemoDataRepository } from "@/lib/repositories/mock/demo-data";
import { createMockRepositories } from "@/lib/repositories/mock";
import {
  createMemoryStorage,
  MOCK_STORAGE_KEYS,
  VersionedMockStorage,
} from "@/lib/repositories/mock/storage";
import type { Order } from "@/lib/repositories/interfaces";
import type { PointLot } from "@/lib/points/types";

describe("development demo data", () => {
  it("seeds deterministic refund-ready lots and orders without duplicates", () => {
    const store = new VersionedMockStorage(createMemoryStorage());
    const repository = new MockDemoDataRepository(store);

    expect(repository.seed()).toEqual({ lots: 3, orders: 2 });
    expect(repository.seed()).toEqual({ lots: 3, orders: 2 });

    const lots = store.read<Record<string, PointLot[]>>(MOCK_STORAGE_KEYS.pointLots, {});
    const orders = store.read<Order[]>(MOCK_STORAGE_KEYS.orders, []);
    expect(lots["demo-user"]).toHaveLength(3);
    expect(lots["demo-user"]?.map((lot) => lot.bucket).sort()).toEqual(["bonus", "bonus", "paid"]);
    expect(orders).toHaveLength(2);
    expect(orders.map((order) => order.status).sort()).toEqual(["canceled", "paid"]);
  });

  it("resets only the injected fixtures", () => {
    const store = new VersionedMockStorage(createMemoryStorage());
    const repository = new MockDemoDataRepository(store);
    store.write<Order[]>(MOCK_STORAGE_KEYS.orders, [
      {
        id: "customer-order",
        orderNo: "20260913-000001",
        userId: "someone-else",
        items: [],
        status: "canceled",
        listAmount: 0,
        totalAmount: 0,
        pointsUsed: 0,
        cashPaid: 0,
        earnedPoints: 0,
        paymentMethod: "free",
        paymentRef: null,
        createdAt: "2026-09-13T00:00:00.000Z",
        finalizedAt: null,
        failureCode: null,
        refundReason: null,
      },
    ]);

    repository.seed();
    repository.reset();

    expect(store.read<Order[]>(MOCK_STORAGE_KEYS.orders, []).map((order) => order.id)).toEqual([
      "customer-order",
    ]);
    expect(
      store.read<Record<string, PointLot[]>>(MOCK_STORAGE_KEYS.pointLots, {})["demo-user"],
    ).toEqual([]);
  });

  it("seeds a paid order with a complete refundable point ledger", async () => {
    const storage = createMemoryStorage();
    const store = new VersionedMockStorage(storage);
    const demoData = new MockDemoDataRepository(store);
    const repositories = createMockRepositories({
      storage,
      now: () => new Date("2026-09-13T00:00:00.000Z"),
    });
    demoData.seed();

    await expect(repositories.points.getBalance("demo-user")).resolves.toEqual({
      paid: 8_000,
      bonus: 1_250,
      total: 9_250,
    });
    await repositories.admin.refundOrder({
      orderId: "demo-seed-order-paid",
      reason: "duplicate",
      restorePoints: true,
    });

    await expect(repositories.points.getBalance("demo-user")).resolves.toEqual({
      paid: 8_300,
      bonus: 1_200,
      total: 9_500,
    });
    await expect(repositories.library.listLibrary("demo-user")).resolves.toEqual([]);
  });
});
