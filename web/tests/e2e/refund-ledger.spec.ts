import { expect, test } from "@playwright/test";

import type { LibraryItem, Order } from "@/lib/repositories/interfaces";
import type { PointLot, PointTransaction } from "@/lib/points/types";

import { QA_ORDER_ID, readRepositoryData, seedBrowserState } from "./test-state";

test("관리자 환불이 포인트 원장과 보관함을 한 번만 되돌린다", async ({ page }) => {
  await seedBrowserState(page, {
    role: "admin",
    paidOrder: true,
    library: true,
    refundLedger: true,
  });
  await page.goto("/admin/orders");

  await page.getByRole("button", { name: "환불" }).click();
  const dialog = page.getByRole("dialog", { name: "환불 처리 확인" });
  await dialog.getByLabel("환불 사유").selectOption("duplicate");
  await dialog.getByRole("button", { name: "환불 처리" }).click();

  await expect(page.getByText("환불 처리되었습니다 (데모)")).toBeVisible();
  await expect(page.getByRole("button", { name: "환불" })).toHaveCount(0);

  const orders = await readRepositoryData<Order[]>(page, "ss.mock.orders");
  const library = await readRepositoryData<LibraryItem[]>(page, "ss.mock.library");
  const lotsByUser = await readRepositoryData<Record<string, PointLot[]>>(
    page,
    "ss.mock.point-lots",
  );
  const transactions = await readRepositoryData<PointTransaction[]>(
    page,
    "ss.mock.point-transactions",
  );

  expect(orders.find((order) => order.id === QA_ORDER_ID)).toMatchObject({
    status: "refunded",
    refundReason: "duplicate",
  });
  expect(library).toEqual([]);
  expect(lotsByUser["demo-user"]).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "lot-qa-paid",
        bucket: "paid",
        remaining: 1_000,
        expiresAt: "2099-12-31T14:59:59.000Z",
      }),
      expect.objectContaining({
        id: "lot-qa-bonus",
        bucket: "bonus",
        remaining: 500,
        expiresAt: "2098-12-31T14:59:59.000Z",
      }),
      expect.objectContaining({ id: "lot-qa-earned", remaining: 0 }),
    ]),
  );

  const refunds = transactions.filter(
    (transaction) => transaction.type === "refund" && transaction.referenceId === QA_ORDER_ID,
  );
  expect(refunds).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        amount: 500,
        bucket: "bonus",
        lotId: "lot-qa-bonus",
        reversalOf: "tx-qa-spend-bonus",
      }),
      expect.objectContaining({
        amount: 100,
        bucket: "paid",
        lotId: "lot-qa-paid",
        reversalOf: "tx-qa-spend-paid",
      }),
      expect.objectContaining({
        amount: -41,
        bucket: "bonus",
        lotId: "lot-qa-earned",
        reversalOf: "tx-qa-earn",
      }),
    ]),
  );
  expect(refunds).toHaveLength(3);
});
