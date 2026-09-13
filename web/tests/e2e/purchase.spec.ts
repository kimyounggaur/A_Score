import { expect, test, type Page } from "@playwright/test";

import { readRepositoryData, seedBrowserState, signInWithEmail } from "./test-state";

type PointTransaction = {
  amount: number;
  type: string;
  referenceId: string;
};

type LibraryItem = {
  productId: number;
  orderId: string;
};

function parseWon(text: string | null): number {
  return Number((text ?? "").replace(/[^0-9]/g, ""));
}

async function addCurrentProductToCart(page: Page) {
  const cartButton = page.getByRole("button", {
    name: /^(장바구니에 담기|이미 장바구니에 담김)$/,
  });
  await expect(cartButton).toBeVisible();
  await cartButton.click();
}

test.describe("B8 구매 흐름", () => {
  test("보유 상품만 담겼다면 중복 결제 대신 보관함으로 안내해요", async ({ page }) => {
    await seedBrowserState(page, {
      role: "user",
      cart: [{ productId: 1001, type: "score" }],
      library: true,
    });

    await page.goto("/cart");
    await expect(page.getByText("밤편지", { exact: true })).toBeVisible();
    await expect(page.getByText("이미 보관함에 있어요", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "보관함에서 보기" })).toHaveAttribute(
      "href",
      "/me/library",
    );
    await expect(
      page.getByText("총 결제액", { exact: true }).locator("..").locator("dd"),
    ).toHaveText("₩0");
    await expect(page.locator('a[href^="/checkout"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "결제 가능한 새 상품이 없어요" })).toBeDisabled();
  });

  test("보유 상품과 새 상품이 섞이면 새 상품만 합계와 결제 URL에 남겨요", async ({ page }) => {
    await seedBrowserState(page, {
      role: "user",
      cart: [
        { productId: 1001, type: "score" },
        { productId: 1010, type: "score" },
      ],
      library: true,
    });

    await page.goto("/cart");
    await expect(page.getByText("이미 보관함에 있어요", { exact: true })).toBeVisible();
    await expect(
      page.getByText("총 결제액", { exact: true }).locator("..").locator("dd"),
    ).toHaveText("₩1,900");
    const checkoutLink = page.getByRole("link", { name: "1개 상품 결제하기" });
    await expect(checkoutLink).toHaveAttribute("href", "/checkout?items=1010");
    await expect(page.locator('a[href^="/checkout"]')).toHaveCount(1);
  });

  test("보관함 조회에 실패하면 중복 결제를 막고 다시 확인할 수 있어요", async ({ page }) => {
    await seedBrowserState(page, {
      role: "user",
      cart: [{ productId: 1001, type: "score" }],
    });
    await page.addInitScript(() => {
      const nativeGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function getItem(key: string) {
        if (key === "ss.mock.library") throw new Error("QA library read failure");
        return nativeGetItem.call(this, key);
      };
    });

    await page.goto("/cart");
    const alert = page.locator("#cart-ownership-status");
    await expect(alert).toHaveAttribute("role", "alert");
    await expect(alert).toContainText("보관함의 구매 내역을 확인하지 못했어요");
    await expect(page.locator('a[href^="/checkout"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "보유 상품 확인이 필요해요" })).toBeDisabled();

    const retry = page.getByRole("button", { name: "보유 여부 다시 확인" });
    await expect(retry).toBeVisible();
    await retry.click();
    await expect(alert).toBeVisible();
  });

  test("비로그인부터 색깔악보·밴드세트 결제, 포인트 보정, 멱등 확정, 보관함까지 이어져요", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto("/scores/1010");
    await page.getByRole("button", { name: "구매하기" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fcheckout%3Fitems%3D1010$/);
    await page.getByLabel("이메일").fill("member@example.com");
    await page.getByRole("button", { name: "이메일로 로그인" }).click();
    await expect(page).toHaveURL(/\/checkout\?items=1010$/);
    await expect(page.getByRole("heading", { level: 1, name: "주문 확인" })).toBeVisible();
    await expect(page.getByText("Ditto", { exact: true })).toBeVisible();

    await page.goto("/points/charge");
    await page.getByRole("radio", { name: /30,000P/ }).click();
    await page.getByRole("button", { name: "₩30,000 모의 결제" }).click();
    await expect(page.getByRole("heading", { name: "모의 충전이 반영됐어요" })).toBeVisible();
    await expect(page.getByText("총 잔액 33,000P")).toBeVisible();

    await page.goto("/scores/1010");
    await addCurrentProductToCart(page);
    await page.goto("/band-sets/3001");
    await addCurrentProductToCart(page);

    await page.goto("/cart");
    await expect(page.getByText("Ditto", { exact: true })).toBeVisible();
    await expect(page.getByText("사건의 지평선 밴드세트", { exact: true })).toBeVisible();
    const cartTotal = page.getByText("총 결제액", { exact: true }).locator("..").locator("dd");
    await expect(cartTotal).toBeVisible();
    expect(parseWon(await cartTotal.textContent())).toBeGreaterThan(0);

    await page.getByRole("link", { name: "2개 상품 결제하기" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "주문 확인" })).toBeVisible();
    await expect(page.getByText("사용 가능 33,000P")).toBeVisible();

    const pointInput = page.getByLabel("사용할 포인트");
    await pointInput.fill("999999");
    await expect(pointInput).toHaveValue("14800");
    await expect(page.getByRole("status")).toContainText("최대 14,800P까지 쓸 수 있어요.");
    await expect(
      page.getByText("결제 금액", { exact: true }).locator("..").locator("dd"),
    ).toHaveText("₩0");

    await page.getByRole("checkbox", { name: /디지털 콘텐츠 제공이 시작된 뒤/ }).check();
    await page.getByRole("button", { name: "포인트로 결제" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "결제가 완료됐어요" })).toBeVisible();
    const successUrl = page.url();
    const successParams = new URL(successUrl).searchParams;
    const orderId = successParams.get("orderId");
    expect(orderId).toBeTruthy();
    expect(successParams.get("amount")).toBe("0");
    expect(successParams.get("paymentKey")).toBeNull();

    const transactionsBefore = await readRepositoryData<PointTransaction[]>(
      page,
      "ss.mock.point-transactions",
    );
    const libraryBefore = await readRepositoryData<LibraryItem[]>(page, "ss.mock.library");
    const orderSpends = transactionsBefore.filter(
      (transaction) => transaction.type === "spend" && transaction.referenceId === orderId,
    );
    expect(orderSpends.length).toBeGreaterThan(0);
    expect(
      orderSpends.reduce((sum, transaction) => sum + Math.abs(transaction.amount ?? 0), 0),
    ).toBe(14_800);
    expect(
      libraryBefore
        .filter((item) => item.orderId === orderId)
        .map((item) => item.productId)
        .sort(),
    ).toEqual([1010, 3001]);

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "결제가 완료됐어요" })).toBeVisible();
    const transactionsAfter = await readRepositoryData<PointTransaction[]>(
      page,
      "ss.mock.point-transactions",
    );
    const libraryAfter = await readRepositoryData<LibraryItem[]>(page, "ss.mock.library");
    expect(transactionsAfter).toHaveLength(transactionsBefore.length);
    expect(libraryAfter).toHaveLength(libraryBefore.length);

    await page.getByRole("link", { name: "보관함에서 보기" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "보관함" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ditto", exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "사건의 지평선 밴드세트", exact: true }),
    ).toBeVisible();
  });

  test("환불정책에 동의하기 전에는 결제를 확정할 수 없어요", async ({ page }) => {
    await signInWithEmail(page, "/checkout?items=1001");
    await expect(page.getByRole("heading", { level: 1, name: "주문 확인" })).toBeVisible();
    await expect(page.getByRole("button", { name: "₩1,990 결제하기" })).toBeDisabled();
  });

  test("mockFail=1은 실패 원인과 다시 시도할 다음 행동을 보여줘요", async ({ page }) => {
    await signInWithEmail(page, "/checkout?items=1001&mockFail=1");
    await expect(page.getByRole("heading", { level: 1, name: "주문 확인" })).toBeVisible();
    await page.getByRole("checkbox", { name: /디지털 콘텐츠 제공이 시작된 뒤/ }).check();
    await page.getByRole("button", { name: "₩1,990 결제하기" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "결제를 완료하지 못했어요" }),
    ).toBeVisible();
    await expect(
      page.getByText("모의 결제에 실패했어요. 결제 수단을 확인하고 다시 시도해 주세요."),
    ).toBeVisible();
    await expect(page.getByText("오류 코드: MOCK_PAYMENT_FAILED")).toBeVisible();
    await expect(page.getByRole("link", { name: "다시 시도" })).toHaveAttribute("href", "/cart");
    await expect(page.getByRole("link", { name: "악보 둘러보기" })).toHaveAttribute(
      "href",
      "/scores",
    );
  });
});
