import { expect, test, type Locator } from "@playwright/test";

import { QA_ORDER_ID, seedBrowserState } from "./test-state";

async function expectMinimumTouchTarget(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, "touch target should have a rendered box").not.toBeNull();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
}

test.describe("44px touch targets", () => {
  test("store text links keep a minimum 44px target", async ({ page }) => {
    await seedBrowserState(page, {
      role: "user",
      cart: [{ productId: 1001, type: "score" }],
      paidOrder: true,
      library: true,
    });

    await page.goto("/scores/1001");
    await expectMinimumTouchTarget(page.getByRole("link", { name: /^편곡 / }));
    await expectMinimumTouchTarget(page.getByRole("link", { name: "환불정책 보기" }));

    await page.goto("/cart");
    await expectMinimumTouchTarget(page.getByRole("link", { name: "밤편지", exact: true }));

    await page.goto("/checkout?items=1001");
    await expectMinimumTouchTarget(page.getByRole("link", { name: "환불정책 보기" }));

    await page.goto("/me/library");
    await expectMinimumTouchTarget(page.getByRole("link", { name: "밤편지", exact: true }));

    await page.goto(`/me/orders/${QA_ORDER_ID}`);
    await expectMinimumTouchTarget(page.getByRole("link", { name: "밤편지", exact: true }));
  });

  test("mobile admin home link keeps a minimum 44px target", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedBrowserState(page, { role: "admin" });
    await page.goto("/admin");
    await expectMinimumTouchTarget(page.getByRole("link", { name: "ScoreStore 관리" }));
  });
});
