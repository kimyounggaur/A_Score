import { expect, test, type Locator, type Page } from "@playwright/test";

import { seedBrowserState } from "./test-state";

async function tabTo(page: Page, target: Locator, maxTabs = 160): Promise<void> {
  await expect(target).toBeVisible();

  for (let index = 0; index < maxTabs; index += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }

  const activeElement = await page.evaluate(() => ({
    name: document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent,
    tag: document.activeElement?.tagName,
  }));
  throw new Error(
    `Tab ${maxTabs}회 안에 목표에 도달하지 못했습니다. 현재 초점: ${JSON.stringify(activeElement)}`,
  );
}

async function expectFocusWithin(container: Locator): Promise<void> {
  expect(await container.evaluate((element) => element.contains(document.activeElement))).toBe(
    true,
  );
}

test.describe("B11 키보드 접근성", () => {
  test("skip link는 첫 Tab에 나타나고 Enter로 main에 초점을 옮겨요", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.getByRole("link", { name: "본문 바로가기" });
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
    await expect(page).toHaveURL(/#main$/);
  });

  test("모바일 전체 악기 dialog는 초점을 가두고 Escape 뒤 trigger로 돌려줘요", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const trigger = page.getByRole("button", { name: "전체 악기", exact: true });
    await tabTo(page, trigger);
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", { name: "전체 악기" });
    await expect(dialog).toBeVisible();
    await expectFocusWithin(dialog);

    const focusableCount = await dialog
      .locator(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      .count();
    expect(focusableCount).toBeGreaterThan(1);

    for (let index = 0; index <= focusableCount; index += 1) {
      await page.keyboard.press("Tab");
      await expectFocusWithin(dialog);
    }
    for (let index = 0; index <= focusableCount; index += 1) {
      await page.keyboard.press("Shift+Tab");
      await expectFocusWithin(dialog);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("관리자 상품 dialog는 Escape 뒤 키보드로 연 trigger에 초점을 돌려줘요", async ({ page }) => {
    await seedBrowserState(page, { role: "admin" });
    await page.goto("/admin/products");

    const trigger = page.getByRole("button", { name: "악보 등록" });
    await tabTo(page, trigger);
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", { name: "상품 등록" });
    await expect(dialog).toBeVisible();
    await expectFocusWithin(dialog);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  for (const viewport of [
    { label: "모바일 390px", width: 390, height: 844 },
    { label: "데스크톱 1280px", width: 1280, height: 900 },
  ] as const) {
    test(`${viewport.label}에서 로그인 사용자가 홈부터 결제 완료까지 마우스 없이 완주해요`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await seedBrowserState(page, { role: "user" });
      await page.goto("/");

      const headerSearch = page.getByRole("link", { name: "악보 검색" });
      await tabTo(page, headerSearch);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/scores$/);

      const searchInput = page.getByRole("searchbox", { name: "악보 검색" });
      await tabTo(page, searchInput);
      await page.keyboard.insertText("밤편지");
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/scores\?q=/);

      const productCard = page.locator("article").filter({ hasText: "밤편지" }).first();
      const productLink = productCard.getByRole("link").first();
      await tabTo(page, productLink);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/scores\/1001$/);
      await expect(page.getByRole("heading", { level: 1, name: "밤편지" })).toBeVisible();

      const addToCart = page.getByRole("button", { name: "장바구니에 담기" });
      await tabTo(page, addToCart);
      await page.keyboard.press("Enter");
      await expect(page.getByRole("button", { name: "이미 장바구니에 담김" })).toBeVisible();

      const cartLink = page.getByRole("link", { name: "장바구니, 1개 담김" });
      await tabTo(page, cartLink);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/cart$/);

      const checkoutLink = page.getByRole("link", { name: "1개 상품 결제하기" });
      await tabTo(page, checkoutLink);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/checkout\?items=1001$/);

      const consent = page.getByRole("checkbox", {
        name: /디지털 콘텐츠 제공이 시작된 뒤/,
      });
      await tabTo(page, consent);
      await page.keyboard.press("Space");
      await expect(consent).toBeChecked();

      const payButton = page.getByRole("button", { name: "₩1,990 결제하기" });
      await tabTo(page, payButton);
      await page.keyboard.press("Enter");

      await expect(
        page.getByRole("heading", { level: 1, name: "결제가 완료됐어요" }),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/checkout\/success\?/);

      const libraryLink = page.getByRole("link", { name: "보관함에서 보기" });
      await tabTo(page, libraryLink);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/me\/library$/);
      await expect(page.getByRole("heading", { level: 1, name: "보관함" })).toBeVisible();
      await expect(page.getByRole("link", { name: "밤편지", exact: true })).toBeVisible();
    });
  }
});
