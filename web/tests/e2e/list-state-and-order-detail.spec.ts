import { expect, test } from "@playwright/test";

import { QA_ORDER_ID, QA_ORDER_NO, seedBrowserState } from "./test-state";

async function expectQuery(
  page: import("@playwright/test").Page,
  expected: Record<string, string | null>,
) {
  await expect
    .poll(() => {
      const query = new URL(page.url()).searchParams;
      return Object.fromEntries(Object.keys(expected).map((key) => [key, query.get(key)]));
    })
    .toEqual(expected);
}

test.describe("관리 목록 URL 상태와 주문 상세", () => {
  test("상품 필터는 replace, 페이지는 push로 복원", async ({ page }) => {
    await seedBrowserState(page, { role: "admin" });
    await page.goto("/admin/products");

    await page.getByLabel("정렬").selectOption("title");
    await expect(page).toHaveURL(/\/admin\/products\?sort=title$/);
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page).toHaveURL(/sort=title&page=2|page=2&sort=title/);

    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/products\?sort=title$/);
    await expect(page.getByLabel("정렬")).toHaveValue("title");
    await page.reload();
    await expect(page.getByLabel("정렬")).toHaveValue("title");
  });

  test("상품 등록·수정·삭제 dialog를 URL에서 복원하고 뒤로가기로 닫음", async ({ page }) => {
    await seedBrowserState(page, { role: "admin" });
    await page.goto("/admin/products?sort=title&dialog=create");

    await expect(page.getByRole("dialog", { name: "상품 등록" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("dialog", { name: "상품 등록" })).toBeVisible();
    await page
      .getByRole("dialog", { name: "상품 등록" })
      .getByRole("button", { name: "취소" })
      .click();
    await expectQuery(page, { sort: "title", dialog: null, product: null });

    const editButton = page.locator("tbody tr").first().getByRole("button", { name: /수정/ });
    await editButton.click();
    await expectQuery(page, { sort: "title", dialog: "edit" });
    const editedProductId = new URL(page.url()).searchParams.get("product");
    expect(editedProductId).toMatch(/^\d+$/);
    await expect(page.getByRole("dialog", { name: "상품 수정" })).toBeVisible();

    await page.goBack();
    await expectQuery(page, { sort: "title", dialog: null, product: null });
    await expect(page.getByRole("dialog", { name: "상품 수정" })).toBeHidden();
    await page.goForward();
    await expectQuery(page, { sort: "title", dialog: "edit", product: editedProductId });
    await expect(page.getByRole("dialog", { name: "상품 수정" })).toBeVisible();

    await page.goto("/admin/products?q=밤편지&dialog=delete&product=1001");
    await expect(page.getByRole("dialog", { name: "상품을 삭제합니까?" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("dialog", { name: "상품을 삭제합니까?" })).toBeVisible();
  });

  test("잘못된 상품 dialog query만 제거하고 목록 필터를 보존", async ({ page }) => {
    await seedBrowserState(page, { role: "admin" });
    await page.goto("/admin/products?status=draft&sort=sales&dialog=edit&product=not-a-number");

    await expectQuery(page, {
      status: "draft",
      sort: "sales",
      dialog: null,
      product: null,
    });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("모든 주문에 상세가 있고 환불은 결제 완료 주문의 별도 액션", async ({ page }) => {
    await seedBrowserState(page, { role: "admin", paidOrder: true });
    await page.goto("/admin/orders");

    await page.getByRole("button", { name: "상세" }).click();
    const dialog = page.getByRole("dialog", { name: "주문 상세" });
    await expect(dialog).toContainText(QA_ORDER_NO);
    await expect(dialog).toContainText("밤편지");
    await expect(dialog).toContainText("카드");
    await expect(dialog).toContainText("결제 완료");
    await expect(dialog).toContainText("₩1,990");
    await expect(dialog).toContainText("0P");
    await dialog.getByRole("button", { name: "닫기" }).click();

    await expect(page.getByRole("button", { name: "환불" })).toHaveCount(1);
  });

  test("주문 상세·환불 dialog와 행 액션 이름을 URL에서 복원", async ({ page }) => {
    await seedBrowserState(page, { role: "admin", paidOrder: true });
    await page.goto(
      `/admin/orders?status=paid&dialog=detail&order=${encodeURIComponent(QA_ORDER_ID)}`,
    );

    const detailDialog = page.getByRole("dialog", { name: "주문 상세" });
    await expect(detailDialog).toContainText(QA_ORDER_NO);
    await page.reload();
    await expect(detailDialog).toBeVisible();
    await detailDialog.getByRole("button", { name: "닫기" }).click();
    await expectQuery(page, { status: "paid", dialog: null, order: null });

    await expect(page.getByRole("button", { name: `${QA_ORDER_NO} 주문 상세` })).toBeVisible();
    const refundButton = page.getByRole("button", { name: `${QA_ORDER_NO} 주문 환불` });
    await expect(refundButton).toBeVisible();
    await refundButton.click();
    await expectQuery(page, { status: "paid", dialog: "refund", order: QA_ORDER_ID });
    await expect(page.getByRole("dialog", { name: "환불 처리 확인" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("dialog", { name: "환불 처리 확인" })).toBeVisible();

    await page.goBack();
    await expectQuery(page, { status: "paid", dialog: null, order: null });
    await expect(page.getByRole("dialog", { name: "환불 처리 확인" })).toBeHidden();
  });

  test("잘못된 주문 dialog query만 제거하고 목록 정렬을 보존", async ({ page }) => {
    await seedBrowserState(page, { role: "admin", paidOrder: true });
    await page.goto("/admin/orders?sort=oldest&dialog=refund&order=missing-order");

    await expectQuery(page, { sort: "oldest", dialog: null, order: null });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("회원의 검증된 필터·정렬을 새로고침해도 복원", async ({ page }) => {
    await seedBrowserState(page, { role: "admin" });
    await page.goto("/admin/users?role=admin&status=active&sort=name&page=invalid");
    await expect(page.getByLabel("역할 필터")).toHaveValue("admin");
    await expect(page.getByLabel("회원 상태")).toHaveValue("active");
    await expect(page.getByLabel("회원 정렬")).toHaveValue("name");
    await page.reload();
    await expect(page.getByLabel("회원 정렬")).toHaveValue("name");
  });

  test("회원 정지·복구 dialog를 URL에서 복원하고 행 액션에 회원명을 제공", async ({ page }) => {
    await seedBrowserState(page, { role: "admin" });
    await page.goto("/admin/users?role=user&dialog=suspend&user=demo-user");

    const suspendDialog = page.getByRole("dialog", { name: "회원 이용을 정지합니까?" });
    await expect(suspendDialog).toContainText("김연주");
    await page.reload();
    await expect(suspendDialog).toBeVisible();
    await suspendDialog.getByRole("button", { name: "취소" }).click();
    await expectQuery(page, { role: "user", dialog: null, user: null });

    const suspendButton = page.getByRole("button", { name: "김연주 회원 정지" });
    await expect(suspendButton).toBeVisible();
    await suspendButton.click();
    await expectQuery(page, { role: "user", dialog: "suspend", user: "demo-user" });
    await page.getByRole("dialog").getByRole("button", { name: "확인" }).click();
    await expectQuery(page, { role: "user", dialog: null, user: null });

    const restoreButton = page.getByRole("button", { name: "김연주 회원 복구" });
    await expect(restoreButton).toBeVisible();
    await restoreButton.click();
    await expectQuery(page, { role: "user", dialog: "restore", user: "demo-user" });
    await page.reload();
    await expect(page.getByRole("dialog", { name: "회원 이용 정지를 해제합니까?" })).toBeVisible();
  });

  test("회원 상태와 맞지 않는 dialog query만 제거하고 목록 정렬을 보존", async ({ page }) => {
    await seedBrowserState(page, { role: "admin" });
    await page.goto("/admin/users?sort=name&dialog=restore&user=demo-user");

    await expectQuery(page, { sort: "name", dialog: null, user: null });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("포인트의 검증된 필터·정렬을 새로고침해도 복원", async ({ page }) => {
    await seedBrowserState(page, { role: "user", points: 5_000 });
    await page.goto("/me/points?filter=earn&sort=oldest&page=invalid");
    await expect(page.getByRole("button", { name: "적립" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByLabel("포인트 내역 정렬")).toHaveValue("oldest");
    await page.reload();
    await expect(page.getByLabel("포인트 내역 정렬")).toHaveValue("oldest");
  });
});
