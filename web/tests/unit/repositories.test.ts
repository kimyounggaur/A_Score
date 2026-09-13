import { describe, expect, it } from "vitest";

import { INSTRUMENT_ID, PRODUCT_TYPE } from "@/lib/catalog/taxonomy";
import type { BundleProduct, CatalogProduct } from "@/lib/catalog/types";
import { effectivePrice } from "@/lib/pricing";
import { RepositoryError } from "@/lib/repositories/interfaces";
import { createMockRepositories } from "@/lib/repositories/mock";
import { createMemoryStorage, MOCK_STORAGE_KEYS } from "@/lib/repositories/mock/storage";

const fixedNow = new Date("2026-09-13T00:00:00Z");

function setup() {
  return createMockRepositories({ storage: createMemoryStorage(), now: () => fixedNow });
}

describe("mock repositories", () => {
  it("starts a new user with zero points and an empty library", async () => {
    const repositories = setup();
    await expect(repositories.points.getBalance("new-user")).resolves.toEqual({
      paid: 0,
      bonus: 0,
      total: 0,
    });
    await expect(repositories.library.listLibrary("new-user")).resolves.toEqual([]);
  });

  it("returns empty private data on the server without browser storage", async () => {
    const repositories = createMockRepositories({ storage: null, now: () => fixedNow });
    await expect(repositories.user.getSession()).resolves.toBeNull();
    await expect(repositories.library.listLibrary("demo-user")).resolves.toEqual([]);
    await expect(repositories.points.getBalance("demo-user")).resolves.toEqual({
      paid: 0,
      bonus: 0,
      total: 0,
    });
  });

  it("excludes pending products and zero-result instrument facets", async () => {
    const repositories = setup();
    const pendingProduct = await repositories.admin.getProduct(1029);
    const result = await repositories.catalog.listProducts();
    const pendingSearch = await repositories.catalog.listProducts({ q: "바순 소나타 1악장" });

    expect(pendingProduct).toMatchObject({ status: "published", licenseStatus: "pending" });
    expect(result.items.every((product) => product.licenseStatus === "cleared")).toBe(true);
    expect(result.facets.instruments[INSTRUMENT_ID.BASSOON]).toBeUndefined();
    expect(pendingSearch.total).toBe(0);
    await expect(repositories.catalog.getProduct(1029)).resolves.toBeNull();
  });

  it("rejects a published bundle unless every item is a purchasable score", async () => {
    const repositories = setup();
    const source = await repositories.admin.getProduct(2001);
    expect(source?.type).toBe(PRODUCT_TYPE.BUNDLE);
    const bundle = source as BundleProduct;
    const unavailableItemIds = [1029, 1033, 3001, 999_999];

    await expect(
      repositories.admin.createProduct({
        ...bundle,
        id: 4001,
        title: "무결성 오류 악보집",
        itemIds: unavailableItemIds,
        itemCount: unavailableItemIds.length,
      }),
    ).rejects.toMatchObject<Partial<RepositoryError>>({
      code: "BUNDLE_ITEMS_UNAVAILABLE",
      details: { itemIds: unavailableItemIds },
    });

    await expect(
      repositories.admin.createProduct({
        ...bundle,
        id: 4001,
        title: "검토 중 악보집",
        status: "draft",
        itemIds: [999_999],
        itemCount: 1,
      }),
    ).resolves.toMatchObject({ id: 4001, status: "draft" });
  });

  it.each([
    {
      reason: "hidden",
      memberId: 1001,
      change: { status: "hidden" as const },
    },
    {
      reason: "not cleared",
      memberId: 1002,
      change: { status: "draft" as const, licenseStatus: "blocked" as const },
    },
  ])(
    "quarantines a published bundle when a member becomes $reason",
    async ({ memberId, change }) => {
      const repositories = setup();
      const member = await repositories.admin.getProduct(memberId);
      expect(member).not.toBeNull();

      await repositories.admin.updateProduct(memberId, { ...member!, ...change });

      await expect(repositories.admin.getProduct(2001)).resolves.toMatchObject({
        status: "hidden",
      });
      await expect(repositories.catalog.getProduct(2001)).resolves.toBeNull();
      await expect(repositories.catalog.getBundleItems(2001)).resolves.toEqual([]);
    },
  );

  it("quarantines a published bundle when a member is deleted", async () => {
    const repositories = setup();

    await repositories.admin.removeProduct(1003);

    await expect(repositories.admin.getProduct(1003)).resolves.toBeNull();
    await expect(repositories.admin.getProduct(2001)).resolves.toMatchObject({ status: "hidden" });
    await expect(repositories.catalog.getProduct(2001)).resolves.toBeNull();
  });

  it("refuses an incomplete bundle at catalog and order boundaries even for stale storage", async () => {
    const storage = createMemoryStorage();
    const repositories = createMockRepositories({ storage, now: () => fixedNow });
    const products = await repositories.admin.listProducts();
    const staleProducts = products.map((product) =>
      product.id === 1001 ? { ...product, status: "hidden" as const } : product,
    ) as CatalogProduct[];
    storage.setItem(
      `ss.mock.${MOCK_STORAGE_KEYS.products}`,
      JSON.stringify({ version: 1, data: staleProducts }),
    );

    await expect(repositories.catalog.getProduct(2001)).resolves.toBeNull();
    await expect(repositories.catalog.getBundleItems(2001)).resolves.toEqual([]);
    await expect(
      repositories.catalog.listProducts({ q: "인디 기타 베스트 악보집" }),
    ).resolves.toMatchObject({ total: 0, items: [] });
    await expect(
      repositories.orders.createOrder({
        userId: "demo-user",
        items: [{ productId: 2001, type: PRODUCT_TYPE.BUNDLE }],
        clientAmount: 18_000,
        pointsToUse: 0,
        paymentMethod: "card",
      }),
    ).rejects.toMatchObject<Partial<RepositoryError>>({ code: "PRODUCT_UNAVAILABLE" });
  });

  it("calculates a non-zero total for a color score and band set", async () => {
    const repositories = setup();
    const colorScore = await repositories.catalog.getProduct(1010);
    const bandSet = await repositories.catalog.getProduct(3001);
    expect(colorScore).not.toBeNull();
    expect(bandSet).not.toBeNull();
    const amount = [colorScore, bandSet].reduce(
      (sum, product) => sum + (product ? effectivePrice(product, fixedNow) : 0),
      0,
    );
    expect(amount).toBeGreaterThan(0);
  });

  it("rejects a client-tampered order amount", async () => {
    const repositories = setup();
    await expect(
      repositories.orders.createOrder({
        userId: "demo-user",
        items: [{ productId: 1010, type: PRODUCT_TYPE.SCORE }],
        clientAmount: 1,
        pointsToUse: 0,
        paymentMethod: "card",
      }),
    ).rejects.toMatchObject<Partial<RepositoryError>>({ code: "AMOUNT_MISMATCH" });
  });

  it("finalizes twice with only one point spend, earn, and library grant", async () => {
    const repositories = setup();
    await repositories.points.charge("demo-user", "point-5000");
    const product = await repositories.catalog.getProduct(1004);
    expect(product).not.toBeNull();
    const amount = product ? effectivePrice(product, fixedNow) : 0;
    const order = await repositories.orders.createOrder({
      userId: "demo-user",
      items: [{ productId: 1004, type: PRODUCT_TYPE.SCORE }],
      clientAmount: amount,
      pointsToUse: 1_000,
      paymentMethod: "card",
    });

    const first = await repositories.orders.finalizeOrder(order.id, "payment-ref-1");
    const balanceAfterFirst = await repositories.points.getBalance("demo-user");
    const second = await repositories.orders.finalizeOrder(order.id, "payment-ref-1");
    const balanceAfterSecond = await repositories.points.getBalance("demo-user");
    const library = await repositories.library.listLibrary("demo-user");
    const history = await repositories.points.listHistory("demo-user");

    expect(first.status).toBe("paid");
    expect(second).toEqual(first);
    expect(balanceAfterSecond).toEqual(balanceAfterFirst);
    expect(library.filter((item) => item.orderId === order.id)).toHaveLength(1);
    expect(
      history.filter((item) => item.type === "spend" && item.referenceId === order.id),
    ).toHaveLength(1);
    expect(
      history.filter((item) => item.type === "earn" && item.referenceId === order.id),
    ).toHaveLength(1);
  });

  it("refunds each spent point to its original bucket and expiry and reverses earned points once", async () => {
    const repositories = setup();
    const charge = await repositories.points.charge("demo-user", "point-10000");
    const product = await repositories.catalog.getProduct(1004);
    expect(product).not.toBeNull();
    const amount = product ? effectivePrice(product, fixedNow) : 0;
    const order = await repositories.orders.createOrder({
      userId: "demo-user",
      items: [{ productId: 1004, type: PRODUCT_TYPE.SCORE }],
      clientAmount: amount,
      pointsToUse: 600,
      paymentMethod: "card",
    });
    const paid = await repositories.orders.finalizeOrder(order.id, "payment-ref-refund");

    expect(paid).toMatchObject({ status: "paid", pointsUsed: 600, earnedPoints: 39 });
    expect(await repositories.points.getBalance("demo-user")).toEqual({
      paid: 9_900,
      bonus: 39,
      total: 9_939,
    });
    expect(await repositories.library.hasPurchased("demo-user", 1004)).toBe(true);

    const request = {
      orderId: order.id,
      reason: "duplicate" as const,
      restorePoints: true,
    };
    const pointRefund = {
      orderId: order.id,
      pointsUsed: paid.pointsUsed,
      earnedPoints: paid.earnedPoints,
      restoreSpentPoints: true,
    };
    await expect(repositories.points.refundOrder("demo-user", pointRefund)).resolves.toMatchObject({
      restoredPoints: 600,
      reversedEarnedPoints: 39,
    });
    const historyAfterPointRefund = await repositories.points.listHistory("demo-user");
    await expect(repositories.points.refundOrder("demo-user", pointRefund)).resolves.toMatchObject({
      restoredPoints: 0,
      reversedEarnedPoints: 0,
    });
    await expect(repositories.points.listHistory("demo-user")).resolves.toEqual(
      historyAfterPointRefund,
    );
    await expect(repositories.orders.getOrder(order.id)).resolves.toMatchObject({ status: "paid" });
    await expect(repositories.library.hasPurchased("demo-user", 1004)).resolves.toBe(true);

    const firstRefund = await repositories.admin.refundOrder(request);
    const lotsAfterFirst = await repositories.points.getLots("demo-user");
    const historyAfterFirst = await repositories.points.listHistory("demo-user");
    const libraryAfterFirst = await repositories.library.listLibrary("demo-user");

    expect(firstRefund.status).toBe("refunded");
    expect(await repositories.points.getBalance("demo-user")).toEqual({
      paid: 10_000,
      bonus: 500,
      total: 10_500,
    });
    expect(lotsAfterFirst.find((lot) => lot.id === charge.paidLot.id)).toMatchObject({
      bucket: "paid",
      remaining: 10_000,
      expiresAt: charge.paidLot.expiresAt,
    });
    expect(lotsAfterFirst.find((lot) => lot.id === charge.bonusLot?.id)).toMatchObject({
      bucket: "bonus",
      remaining: 500,
      expiresAt: charge.bonusLot?.expiresAt,
    });
    expect(libraryAfterFirst).toEqual([]);

    const spendTransactions = historyAfterFirst.filter(
      (transaction) => transaction.type === "spend" && transaction.referenceId === order.id,
    );
    const earnTransaction = historyAfterFirst.find(
      (transaction) => transaction.type === "earn" && transaction.referenceId === order.id,
    );
    const refundTransactions = historyAfterFirst.filter(
      (transaction) => transaction.type === "refund" && transaction.referenceId === order.id,
    );
    expect(spendTransactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bucket: "bonus",
          amount: -500,
          lotId: charge.bonusLot?.id,
          expiresAt: charge.bonusLot?.expiresAt,
        }),
        expect.objectContaining({
          bucket: "paid",
          amount: -100,
          lotId: charge.paidLot.id,
          expiresAt: charge.paidLot.expiresAt,
        }),
      ]),
    );
    expect(refundTransactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bucket: "bonus", amount: 500 }),
        expect.objectContaining({ bucket: "paid", amount: 100 }),
        expect.objectContaining({ bucket: "bonus", amount: -39 }),
      ]),
    );
    expect(
      refundTransactions.every((transaction) =>
        [...spendTransactions, earnTransaction].some(
          (source) => source?.id === transaction.reversalOf,
        ),
      ),
    ).toBe(true);

    await expect(repositories.admin.refundOrder(request)).resolves.toEqual(firstRefund);
    await expect(repositories.points.getLots("demo-user")).resolves.toEqual(lotsAfterFirst);
    await expect(repositories.points.listHistory("demo-user")).resolves.toEqual(historyAfterFirst);
    await expect(repositories.library.listLibrary("demo-user")).resolves.toEqual(libraryAfterFirst);
  });

  it("reverses purchase earnings even when spent points are not restored", async () => {
    const repositories = setup();
    await repositories.points.charge("demo-user", "point-5000");
    const product = await repositories.catalog.getProduct(1004);
    expect(product).not.toBeNull();
    const amount = product ? effectivePrice(product, fixedNow) : 0;
    const order = await repositories.orders.createOrder({
      userId: "demo-user",
      items: [{ productId: 1004, type: PRODUCT_TYPE.SCORE }],
      clientAmount: amount,
      pointsToUse: 100,
      paymentMethod: "card",
    });
    await repositories.orders.finalizeOrder(order.id, "payment-ref-no-restore");

    await repositories.admin.refundOrder({
      orderId: order.id,
      reason: "change-of-mind",
      restorePoints: false,
    });

    await expect(repositories.points.getBalance("demo-user")).resolves.toEqual({
      paid: 4_900,
      bonus: 0,
      total: 4_900,
    });
    const refundTransactions = (await repositories.points.listHistory("demo-user")).filter(
      (transaction) => transaction.type === "refund" && transaction.referenceId === order.id,
    );
    expect(refundTransactions).toEqual([expect.objectContaining({ bucket: "bonus", amount: -54 })]);
  });

  it("hides a product instead of deleting it when only refunded order history remains", async () => {
    const repositories = setup();
    const product = await repositories.catalog.getProduct(1001);
    expect(product).not.toBeNull();
    const amount = product ? effectivePrice(product, fixedNow) : 0;
    const order = await repositories.orders.createOrder({
      userId: "demo-user",
      items: [{ productId: 1001, type: PRODUCT_TYPE.SCORE }],
      clientAmount: amount,
      pointsToUse: 0,
      paymentMethod: "card",
    });
    await repositories.orders.finalizeOrder(order.id, "payment-ref-refunded-history");
    await repositories.admin.refundOrder({
      orderId: order.id,
      reason: "duplicate",
      restorePoints: true,
    });

    await repositories.admin.removeProduct(1001);

    await expect(repositories.admin.getProduct(1001)).resolves.toMatchObject({
      id: 1001,
      status: "hidden",
    });
  });

  it("rejects a second purchase for a product that is already in the library", async () => {
    const repositories = setup();
    const product = await repositories.catalog.getProduct(1004);
    expect(product).not.toBeNull();
    const amount = product ? effectivePrice(product, fixedNow) : 0;
    const firstOrder = await repositories.orders.createOrder({
      userId: "demo-user",
      items: [{ productId: 1004, type: PRODUCT_TYPE.SCORE }],
      clientAmount: amount,
      pointsToUse: 0,
      paymentMethod: "card",
    });
    await repositories.orders.finalizeOrder(firstOrder.id, "payment-ref-owned");

    await expect(
      repositories.orders.createOrder({
        userId: "demo-user",
        items: [{ productId: 1004, type: PRODUCT_TYPE.SCORE }],
        clientAmount: amount,
        pointsToUse: 0,
        paymentMethod: "card",
      }),
    ).rejects.toMatchObject<Partial<RepositoryError>>({ code: "ALREADY_OWNED" });
  });

  it("invalidates an active session and blocks sign-in until a suspended user is recovered", async () => {
    const repositories = setup();
    await repositories.user.signInDemo("email");
    const member = (await repositories.admin.listUsers()).find((user) => user.id === "demo-user");
    expect(member).toBeDefined();

    await repositories.admin.upsertUser({ ...member!, suspended: true });

    await expect(repositories.user.getSession()).resolves.toBeNull();
    await expect(repositories.user.signInDemo("email")).rejects.toMatchObject<
      Partial<RepositoryError>
    >({ code: "USER_SUSPENDED" });

    await repositories.admin.upsertUser({ ...member!, suspended: false });
    await expect(repositories.user.signInDemo("email")).resolves.toMatchObject({
      id: "demo-user",
      suspended: false,
    });
  });

  it("checks suspension both when an order is created and when payment is finalized", async () => {
    const repositories = setup();
    const product = await repositories.catalog.getProduct(1004);
    const member = (await repositories.admin.listUsers()).find((user) => user.id === "demo-user");
    expect(product).not.toBeNull();
    expect(member).toBeDefined();
    const amount = product ? effectivePrice(product, fixedNow) : 0;
    const pendingOrder = await repositories.orders.createOrder({
      userId: "demo-user",
      items: [{ productId: 1004, type: PRODUCT_TYPE.SCORE }],
      clientAmount: amount,
      pointsToUse: 0,
      paymentMethod: "card",
    });

    await repositories.admin.upsertUser({ ...member!, suspended: true });

    await expect(
      repositories.orders.createOrder({
        userId: "demo-user",
        items: [{ productId: 1001, type: PRODUCT_TYPE.SCORE }],
        clientAmount: 1_990,
        pointsToUse: 0,
        paymentMethod: "card",
      }),
    ).rejects.toMatchObject<Partial<RepositoryError>>({ code: "USER_SUSPENDED" });
    await expect(
      repositories.orders.finalizeOrder(pendingOrder.id, "payment-ref-after-suspension"),
    ).rejects.toMatchObject<Partial<RepositoryError>>({ code: "USER_SUSPENDED" });
    await expect(repositories.orders.getOrder(pendingOrder.id)).resolves.toMatchObject({
      status: "pending",
    });

    await repositories.admin.upsertUser({ ...member!, suspended: false });
    await expect(
      repositories.orders.finalizeOrder(pendingOrder.id, "payment-ref-after-recovery"),
    ).resolves.toMatchObject({ status: "paid" });
  });

  it("uses administrator point settings in subsequent transactions", async () => {
    const repositories = setup();
    await repositories.admin.updateSettings({
      siteName: "ScoreStore",
      earnRatePercent: 10,
      paidExpiryMonths: 1,
      bonusExpiryMonths: 2,
      pointChargeEnabled: true,
    });
    const charge = await repositories.points.charge("demo-user", "point-5000");
    expect(charge.paidLot.expiresAt).toBe("2026-10-13T00:00:00.000Z");

    const product = await repositories.catalog.getProduct(1004);
    expect(product).not.toBeNull();
    const amount = product ? effectivePrice(product, fixedNow) : 0;
    const order = await repositories.orders.createOrder({
      userId: "demo-user",
      items: [{ productId: 1004, type: PRODUCT_TYPE.SCORE }],
      clientAmount: amount,
      pointsToUse: 0,
      paymentMethod: "card",
    });
    expect(order.earnedPoints).toBe(Math.floor(amount * 0.1));
  });

  it("rejects unusable administrator settings at the repository boundary", async () => {
    const repositories = setup();
    const valid = {
      siteName: "ScoreStore",
      earnRatePercent: 5,
      paidExpiryMonths: 60,
      bonusExpiryMonths: 12,
      pointChargeEnabled: true,
    };

    await expect(
      repositories.admin.updateSettings({ ...valid, siteName: " " }),
    ).rejects.toMatchObject<Partial<RepositoryError>>({ code: "INVALID_SITE_NAME" });
    await expect(
      repositories.admin.updateSettings({ ...valid, paidExpiryMonths: 0 }),
    ).rejects.toMatchObject<Partial<RepositoryError>>({ code: "INVALID_PAID_EXPIRY" });
    await expect(
      repositories.admin.updateSettings({ ...valid, bonusExpiryMonths: 1.5 }),
    ).rejects.toMatchObject<Partial<RepositoryError>>({ code: "INVALID_BONUS_EXPIRY" });
  });
});
