import { expect, test } from "@playwright/test";

import { seedBrowserState } from "./test-state";

const extraPublicRoutes = ["/cart", "/login", "/support"] as const;

const widths = [320, 360, 390, 430, 768, 1280] as const;

test.describe("B4 앱 셸", () => {
  test("Stage B 기본 빌드는 데모임을 숨기지 않아요", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toContainText("UI 데모 · 곡 정보는 샘플 데이터예요");

    const response = await page.goto("/dev/ui");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "UI 컴포넌트 카탈로그" }),
    ).toBeVisible();
  });

  for (const width of widths) {
    test(`${width}px 공개 화면은 가로로 넘치지 않아요`, async ({ page }) => {
      // This is an intentionally sitemap-wide check (all public routes at six
      // viewports), so give it the Playwright-recommended long-test budget.
      test.slow();
      await page.setViewportSize({ width, height: 900 });
      const sitemap = await page.request.get("/sitemap.xml");
      expect(sitemap.ok()).toBeTruthy();
      const sitemapRoutes = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(
        (match) => new URL(match[1] ?? "", "http://localhost:3000").pathname,
      );
      const publicRoutes = [...new Set([...sitemapRoutes, ...extraPublicRoutes])];

      for (const route of publicRoutes) {
        const response = await page.goto(route);
        expect(response?.ok(), route).toBeTruthy();
        const sizes = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(sizes.scrollWidth, route).toBe(sizes.clientWidth);
      }
    });
  }

  test("F-01 · F-11 데스크톱 헤더 메뉴가 모두 유효해요", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const navigation = page.getByRole("navigation", { name: "주요 메뉴" });
    const links = navigation.getByRole("link");
    expect(await links.count()).toBeGreaterThan(0);
    const hrefs = await links.evaluateAll((items) =>
      items.map((item) => item.getAttribute("href")),
    );
    for (const href of hrefs) {
      expect(href).toBeTruthy();
      const response = await page.request.get(href as string);
      expect(response.ok(), href ?? "").toBeTruthy();
    }
  });

  test("F-16 모바일 구매바가 하단 탭바와 겹치지 않아요", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/scores/1001");
    const purchasePanel = page.getByRole("complementary", { name: "구매 옵션" });
    const tabBar = page.getByRole("navigation", { name: "하단 메뉴" });
    await expect(purchasePanel.getByRole("button", { name: "찜하기" })).toBeVisible();
    await expect(purchasePanel.getByRole("button", { name: "장바구니에 담기" })).toBeVisible();
    await expect(purchasePanel.getByRole("button", { name: "구매하기" })).toBeVisible();
    const [purchaseBox, tabBox] = await Promise.all([
      purchasePanel.boundingBox(),
      tabBar.boundingBox(),
    ]);
    expect(purchaseBox).not.toBeNull();
    expect(tabBox).not.toBeNull();
    expect((purchaseBox?.y ?? 0) + (purchaseBox?.height ?? 0)).toBeLessThanOrEqual(tabBox?.y ?? 0);
  });

  test("모바일 하단 메뉴는 현재 위치를 하나만 표시해요", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedBrowserState(page, { role: "user" });
    await page.goto("/me/library");
    const tabBar = page.getByRole("navigation", { name: "하단 메뉴" });
    await expect(tabBar.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(tabBar.getByRole("link", { name: "보관함" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  for (const width of [320, 390]) {
    test(`${width}px 히어로 CTA와 슬라이드 제어가 겹치지 않아요`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      const hero = page.locator('[aria-roledescription="carousel"]');
      await hero.getByRole("button", { name: "자동 재생 정지" }).click();
      const [cta, firstDot] = await Promise.all([
        hero.getByRole("link", { name: "인기 악보 보기" }).boundingBox(),
        hero.getByRole("button", { name: "1번째 슬라이드 보기" }).boundingBox(),
      ]);
      expect(cta).not.toBeNull();
      expect(firstDot).not.toBeNull();
      expect((cta?.y ?? 0) + (cta?.height ?? 0)).toBeLessThanOrEqual(firstDot?.y ?? 0);
    });
  }
});
