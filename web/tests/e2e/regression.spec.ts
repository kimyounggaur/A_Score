import { expect, test, type Locator, type Page } from "@playwright/test";

import { seedBrowserState, signInWithEmail } from "./test-state";

const essentialPublicRoutes = [
  "/",
  "/scores",
  "/scores/1001",
  "/bundles/2001",
  "/band-sets/3001",
  "/cart",
  "/login",
] as const;

function parseWon(text: string | null): number {
  return Number((text ?? "").replace(/[^0-9]/g, ""));
}

async function expectNoHorizontalOverflow(page: Page, route: string) {
  const response = await page.goto(route);
  expect(response?.ok(), route).toBeTruthy();
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll, route).toBe(widths.client);
}

async function expectDiscount(locator: Locator, rate: number) {
  await expect(locator.getByLabel(`${rate}% 할인`).first()).toBeVisible();
}

test.describe("부록 A · F-01~F-20 회귀", () => {
  test("F-01 헤더 메뉴 전체가 유효한 페이지로 이동", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const navigation = page.getByRole("navigation", { name: "주요 메뉴" });
    const hrefs = await navigation
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs).toHaveLength(7);
    for (const href of hrefs) {
      expect(href).toBeTruthy();
      const response = await page.request.get(href as string);
      expect(response.ok(), href ?? "헤더 링크").toBeTruthy();
      const target = await page.goto(href as string);
      expect(target?.ok(), href ?? "헤더 링크").toBeTruthy();
      await expect(page.locator("main")).not.toBeEmpty();
    }
  });

  test("F-02 320·360·390px 가로 스크롤 0", async ({ page }) => {
    for (const width of [320, 360, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of essentialPublicRoutes) await expectNoHorizontalOverflow(page, route);
    }
  });

  test("F-03 색깔악보·밴드세트 포함 장바구니 총액 > 0", async ({ page }) => {
    await seedBrowserState(page, {
      cart: [
        { productId: 1010, type: "score" },
        { productId: 3001, type: "band-set" },
      ],
    });
    await page.goto("/cart");
    await expect(page.getByText("Ditto", { exact: true })).toBeVisible();
    await expect(page.getByText("사건의 지평선 밴드세트", { exact: true })).toBeVisible();
    const total = page.getByText("총 결제액", { exact: true }).locator("..").locator("dd");
    expect(parseWon(await total.textContent())).toBeGreaterThan(0);
  });

  test("F-04 없는 상품 id는 404, 상세 새로고침 시 동일 상품", async ({ page }) => {
    const notFoundResponse = await page.goto("/scores/999999");
    expect(notFoundResponse?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "페이지를 찾을 수 없어요" }),
    ).toBeVisible();

    await page.goto("/scores/1004");
    await expect(page.getByRole("heading", { level: 1, name: "RING X RING" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "RING X RING" })).toBeVisible();
  });

  test("F-05 결제액 초과 포인트 입력이 자동 보정", async ({ page }) => {
    await seedBrowserState(page, { role: "user", points: 30_000 });
    await page.goto("/checkout?items=1001");
    await expect(page.getByText("사용 가능 30,000P")).toBeVisible();
    const input = page.getByLabel("사용할 포인트");
    await input.fill("9000");
    await expect(input).toHaveValue("1990");
    await expect(page.getByRole("status")).toContainText("최대 1,990P까지 쓸 수 있어요.");
    await expect(
      page.getByText("결제 금액", { exact: true }).locator("..").locator("dd"),
    ).toHaveText("₩0");
  });

  test("F-06 상품별 할인율이 실제 값", async ({ page }) => {
    await page.goto("/scores/1003");
    await expectDiscount(page.getByRole("complementary", { name: "구매 옵션" }), 31);
    await page.goto("/scores/1004");
    await expectDiscount(page.getByRole("complementary", { name: "구매 옵션" }), 20);
    await page.goto("/bundles/2001");
    await expectDiscount(page.getByRole("complementary", { name: "구매 옵션" }), 25);
    // 2,900→2,400의 보수적 반올림(17%)은 pricing 단위 테스트가 담당한다.
    // 여기서는 실제 카탈로그의 서로 다른 할인율이 하드코딩되지 않았음을 화면에서 검증한다.
  });

  test("F-07 악보집 상세에 단일 악보 전용 필드 없음", async ({ page }) => {
    await page.goto("/bundles/2001");
    await expect(
      page.getByRole("heading", { level: 1, name: "인디 기타 베스트 악보집" }),
    ).toBeVisible();
    for (const label of ["조성", "BPM", "아티스트"]) {
      await expect(page.getByText(label, { exact: true })).toHaveCount(0);
    }
  });

  test("F-08 피아노·드럼 상세에 TAB 없음", async ({ page }) => {
    for (const route of ["/scores/1006", "/scores/1007"]) {
      await page.goto(route);
      await expect(page.getByText("TAB", { exact: true })).toHaveCount(0);
    }
  });

  test("F-09 브랜드 폰트 로드 성공", async ({ page }) => {
    const response = await page.request.get("/fonts/maruburi-light-subset.woff2");
    expect(response.status()).toBe(200);
    expect((await response.body()).byteLength).toBeGreaterThan(0);

    await page.goto("/");
    const displayFont = await page
      .getByRole("banner")
      .getByRole("link", { name: "ScoreStore 홈" })
      .evaluate((logo) => getComputedStyle(logo).fontFamily);
    const bodyFont = await page
      .locator("body")
      .evaluate((body) => getComputedStyle(body).fontFamily);
    expect(displayFont).not.toBe(bodyFont);
    expect(displayFont).toMatch(/maru|serif/i);
  });

  test("F-10 비로그인 시 포인트 잔액 미표시", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header").first();
    await expect(header.getByRole("link", { name: "로그인" })).toBeVisible();
    await expect(header.getByRole("link", { name: "포인트", exact: true })).toHaveCount(0);
    await expect(header).not.toContainText("12,300P");
  });

  test("F-11 데스크톱 헤더 메뉴가 비어 있지 않음", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const menu = page.getByRole("navigation", { name: "주요 메뉴" });
    await expect(menu).toBeVisible();
    expect(await menu.getByRole("link").count()).toBeGreaterThan(0);
  });

  test("F-12 비로그인이 보호 경로·관리자 링크에 접근 불가", async ({ page }) => {
    await page.goto("/me/library");
    await expect(page).toHaveURL(/\/login\?next=%2Fme%2Flibrary$/);

    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { level: 1, name: "페이지를 찾을 수 없어요" }),
    ).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("link", { name: /관리자/ })).toHaveCount(0);
  });

  test("F-13 구매 후 보관함에 항목 존재", async ({ page }) => {
    await signInWithEmail(page, "/checkout?items=1005");
    await expect(page.getByRole("heading", { level: 1, name: "주문 확인" })).toBeVisible();
    await page.getByRole("checkbox", { name: /디지털 콘텐츠 제공이 시작된 뒤/ }).check();
    await page.getByRole("button", { name: "무료로 받기" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "받기 완료" })).toBeVisible();
    await page.getByRole("link", { name: "보관함에서 보기" }).click();
    await expect(page.getByRole("link", { name: "봄날", exact: true })).toBeVisible();
  });

  test("F-14 환불은 사유 선택 없이 확정 불가", async ({ page }) => {
    await seedBrowserState(page, { role: "admin", paidOrder: true, library: true });
    await page.goto("/admin/orders");
    await page.getByRole("button", { name: "환불" }).click();
    const dialog = page.getByRole("dialog", { name: "환불 처리 확인" });
    await expect(dialog.getByRole("button", { name: "환불 처리" })).toBeDisabled();
    await dialog.getByLabel("환불 사유").selectOption("other");
    await expect(dialog.getByRole("button", { name: "환불 처리" })).toBeDisabled();
    await dialog.getByLabel("기타 사유").fill("중복 결제 확인");
    await expect(dialog.getByRole("button", { name: "환불 처리" })).toBeEnabled();
  });

  test("F-15 관리자 변경이 이동·새로고침 후 유지되고 스토어에 반영", async ({ page }) => {
    await seedBrowserState(page, { role: "admin" });
    await page.goto("/admin/products");
    await page.getByRole("button", { name: "악보 등록" }).click();
    const dialog = page.getByRole("dialog", { name: "상품 등록" });
    await dialog.getByLabel("제목").fill("QA 저장 악보");
    await dialog.getByLabel("정가").fill("1700");
    await dialog.getByLabel("이용허락").selectOption("cleared");
    await dialog.getByLabel("게시 상태").selectOption("published");
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(page.getByText("QA 저장 악보", { exact: true }).first()).toBeVisible();

    await page.goto("/admin/settings");
    await page.goto("/admin/products");
    await page.reload();
    await expect(page.getByText("QA 저장 악보", { exact: true }).first()).toBeVisible();

    await page.goto("/scores?q=QA%20저장%20악보");
    const productLink = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { level: 3, name: "QA 저장 악보" }) })
      .getByRole("link")
      .first();
    await expect(productLink).toBeVisible();
    await productLink.click();
    await expect(page).toHaveURL(/\/scores\/local\/\d+$/);
    await expect(page.getByRole("heading", { level: 1, name: "QA 저장 악보" })).toBeVisible();
    await expect(page).toHaveTitle(/QA 저장 악보/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/scores\/local\/\d+$/,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    const relatedSeedLink = page
      .locator('section[aria-labelledby="related-products-heading"] article > a')
      .first();
    await expect(relatedSeedLink).toHaveAttribute("href", /^\/scores\/\d+$/);
  });

  test("F-16 상세 구매바와 탭바가 겹치지 않음", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/scores/1001");
    const purchasePanel = page.getByRole("complementary", { name: "구매 옵션" });
    await expect(purchasePanel.getByRole("button", { name: "구매하기" })).toBeVisible();
    const [purchase, tabs] = await Promise.all([
      purchasePanel.boundingBox(),
      page.getByRole("navigation", { name: "하단 메뉴" }).boundingBox(),
    ]);
    expect(purchase).not.toBeNull();
    expect(tabs).not.toBeNull();
    expect((purchase?.y ?? 0) + (purchase?.height ?? 0)).toBeLessThanOrEqual(tabs?.y ?? 0);
  });

  test("F-17 모든 버튼이 이동·동작·명시적 준비중 중 하나", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator('[aria-roledescription="carousel"]');
    const activeTitle = hero.locator('[aria-hidden="false"] h2');
    const initialTitle = await activeTitle.textContent();
    await hero.getByRole("button", { name: "다음 슬라이드" }).click();
    await expect(activeTitle).not.toHaveText(initialTitle ?? "");
    const heroHref = await hero.getByRole("link").getAttribute("href");
    expect(heroHref).toMatch(/^\/scores\?/);

    await page.goto("/support");
    const disabledButtons = page.locator("button:disabled");
    expect(await disabledButtons.count()).toBeGreaterThan(0);
    for (let index = 0; index < (await disabledButtons.count()); index += 1) {
      await expect(disabledButtons.nth(index).locator("xpath=..")).toContainText("준비 중");
    }

    await page.goto("/scores/1001");
    await page.getByRole("button", { name: "장바구니에 담기" }).click();
    await expect(page.getByRole("link", { name: /장바구니, 1개 담김/ })).toBeVisible();
  });

  test("F-18 인기 섹션에 근거 없는 순위 표현 없음", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/TOP\s*20|인기곡\s*TOP/i)).toHaveCount(0);
    const popular = page.locator('section[aria-labelledby="popular-scores-heading"]');
    await expect(popular.getByRole("heading", { name: "인기 악보" })).toBeVisible();
    await expect(popular.getByRole("heading", { level: 3 }).first()).toHaveText("작은 별");
    await expect(popular.locator("article")).toHaveCount(8);
  });

  test("F-19 배너 정지 가능, reduced-motion 존중", async ({ page }) => {
    await page.goto("/");
    const title = page.locator('[aria-roledescription="carousel"] [aria-hidden="false"] h2');
    const initial = await title.textContent();
    await page.getByRole("button", { name: "자동 재생 정지" }).click();
    await page.waitForTimeout(5_200);
    await expect(title).toHaveText(initial ?? "");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const reducedInitial = await title.textContent();
    await page.waitForTimeout(5_200);
    await expect(title).toHaveText(reducedInitial ?? "");
  });

  test("F-20 상품 0건 분류가 메뉴·필터에 없음", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    for (const id of ["bassoon", "tuba", "tongue-drum"]) {
      await expect(page.locator(`a[href="/instruments/${id}"]`)).toHaveCount(0);
    }
    expect(await page.locator('a[href="/instruments/flute"]').count()).toBeGreaterThan(0);

    await page.goto("/scores");
    const instrumentFilter = page.getByLabel("악기").last();
    for (const id of ["bassoon", "tuba", "tongue-drum"]) {
      await expect(instrumentFilter.locator(`option[value="${id}"]`)).toHaveCount(0);
    }
    await expect(instrumentFilter.locator('option[value="flute"]')).toHaveCount(1);
  });
});
