import { expect, test } from "@playwright/test";

import { seedBrowserState } from "./test-state";

async function openProductForm(page: import("@playwright/test").Page) {
  await seedBrowserState(page, { role: "admin" });
  await page.goto("/admin/products");
  await page.getByRole("button", { name: "악보 등록" }).click();
  return page.getByRole("dialog", { name: "상품 등록" });
}

test.describe("B10 관리자 상품 폼", () => {
  test("Zod 오류를 해당 필수·가격 필드에 연결해 표시", async ({ page }) => {
    const dialog = await openProductForm(page);
    await dialog.getByLabel("제목").fill("");
    await dialog.getByLabel("정가").fill("");
    await dialog.getByRole("checkbox", { name: "통기타" }).uncheck();
    await dialog.getByRole("checkbox", { name: "오선" }).uncheck();
    await dialog.getByRole("button", { name: "저장" }).click();

    await expect(dialog.getByRole("alert")).toContainText("상품을 저장하지 않았습니다");
    await expect(dialog.getByLabel("제목")).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.getByLabel("제목")).toHaveAttribute(
      "aria-describedby",
      "product-title-error",
    );
    await expect(dialog.getByText("제목을 입력해 주세요.", { exact: true })).toBeVisible();
    await expect(
      dialog.getByText("악기를 하나 이상 선택해 주세요.", { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByText("기보 형식을 하나 이상 선택해 주세요.", { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByText("정가를 입력해 주세요.", { exact: true })).toBeVisible();

    await dialog.getByLabel("제목").fill("가격 검증 악보");
    await dialog.getByLabel("정가").fill("2000");
    await dialog.getByLabel("할인가").fill("2000");
    await dialog.getByRole("button", { name: "저장" }).click();

    await expect(
      dialog.getByText("할인가는 정가보다 낮아야 합니다.", { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByText("할인 종료 시각을 입력해 주세요.", { exact: true }),
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("pending 상품의 게시를 차단하고 초안도 스토어에는 노출하지 않음", async ({ page }) => {
    const title = "QA 이용허락 대기 악보";
    const dialog = await openProductForm(page);
    await dialog.getByLabel("제목").fill(title);
    await dialog.getByLabel("정가").fill("1700");
    await dialog.getByLabel("이용허락").selectOption("pending");
    await dialog.getByLabel("게시 상태").selectOption("published");
    await dialog.getByRole("button", { name: "저장" }).click();

    await expect(
      dialog.getByText("이용허락 확인 완료 상품만 게시할 수 있습니다.", { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByText("게시하려면 이용허락 상태를 확인 완료로 변경해 주세요.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(dialog).toBeVisible();
    expect(
      await page.evaluate((productTitle) => {
        const raw = localStorage.getItem("ss.mock.products");
        if (!raw) return false;
        const products = (JSON.parse(raw) as { data: Array<{ title: string }> }).data;
        return products.some((product) => product.title === productTitle);
      }, title),
    ).toBe(false);

    await dialog.getByLabel("게시 상태").selectOption("draft");
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();

    await page.goto(`/scores?q=${encodeURIComponent(title)}`);
    await expect(
      page.getByRole("heading", { level: 2, name: `'${title}' 검색 결과 0개`, exact: true }),
    ).toBeVisible();
    await expect(
      page.locator("article").filter({ has: page.getByText(title, { exact: true }) }),
    ).toHaveCount(0);

    await page.goto(`/scores?q=${encodeURIComponent("바순 소나타 1악장")}`);
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "'바순 소나타 1악장' 검색 결과 0개",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("악보집 수록곡 후보에는 현재 판매 가능한 단일 악보만 표시", async ({ page }) => {
    const dialog = await openProductForm(page);
    await dialog.getByLabel("상품 유형").selectOption("bundle");

    await expect(
      dialog.getByText("게시·이용허락 확인이 끝난 단일 악보만 선택할 수 있습니다."),
    ).toBeVisible();
    await expect(dialog.getByRole("checkbox", { name: "밤편지" })).toBeVisible();
    await expect(dialog.getByRole("checkbox", { name: "바순 소나타 1악장" })).toHaveCount(0);
    await expect(dialog.getByRole("checkbox", { name: "바람이 불어오는 곳" })).toHaveCount(0);
    await expect(dialog.getByRole("checkbox", { name: "사건의 지평선 밴드세트" })).toHaveCount(0);
  });

  test("수록곡을 숨기면 의존 악보집도 격리되어 스토어에서 판매되지 않음", async ({ page }) => {
    await seedBrowserState(page, { role: "admin" });
    await page.goto("/admin/products");
    await page.getByRole("button", { name: "밤편지 수정" }).click();
    const dialog = page.getByRole("dialog", { name: "상품 수정" });
    await dialog.getByLabel("게시 상태").selectOption("hidden");
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog).toBeHidden();

    const quarantinedBundle = await page.evaluate(() => {
      const raw = localStorage.getItem("ss.mock.products");
      if (!raw) return null;
      const products = (JSON.parse(raw) as { data: Array<{ id: number; status: string }> }).data;
      return products.find((product) => product.id === 2001) ?? null;
    });
    expect(quarantinedBundle).toMatchObject({ id: 2001, status: "hidden" });

    await page.goto(`/scores?q=${encodeURIComponent("인디 기타 베스트 악보집")}`);
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "'인디 기타 베스트 악보집' 검색 결과 0개",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator("article")).toHaveCount(0);
  });

  test("F-15 seed 수정·숨김과 판매 전환이 올바른 상세 경로에 반영", async ({ page }) => {
    await seedBrowserState(page, { role: "admin" });

    await page.goto(`/admin/products?q=${encodeURIComponent("밤편지")}`);
    await page.getByRole("button", { name: "밤편지 수정" }).click();
    let dialog = page.getByRole("dialog", { name: "상품 수정" });
    await dialog.getByLabel("제목").fill("밤편지 관리자 수정");
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog).toBeHidden();

    await page.goto("/scores/1001");
    await expect(page).toHaveURL(/\/scores\/1001$/);
    await expect(page.getByRole("heading", { level: 1, name: "밤편지 관리자 수정" })).toBeVisible();
    await expect(page).toHaveTitle(/밤편지 관리자 수정/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/scores\/1001$/);

    await page.goto(`/admin/products?q=${encodeURIComponent("밤편지 관리자 수정")}`);
    await page.getByRole("button", { name: "밤편지 관리자 수정 수정" }).click();
    dialog = page.getByRole("dialog", { name: "상품 수정" });
    await dialog.getByLabel("게시 상태").selectOption("hidden");
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog).toBeHidden();

    await page.goto("/scores/1001");
    await expect(
      page.getByRole("heading", { level: 1, name: "판매할 수 없는 상품이에요" }),
    ).toBeVisible();
    await expect(page.getByRole("complementary", { name: "구매 옵션" })).toHaveCount(0);

    await page.goto(`/admin/products?q=${encodeURIComponent("바순 소나타 1악장")}`);
    await page.getByRole("button", { name: "바순 소나타 1악장 수정" }).click();
    dialog = page.getByRole("dialog", { name: "상품 수정" });
    await dialog.getByLabel("이용허락").selectOption("cleared");
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog).toBeHidden();

    await page.goto(`/scores?q=${encodeURIComponent("바순 소나타 1악장")}`);
    const publishedLink = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { level: 3, name: "바순 소나타 1악장" }) })
      .getByRole("link")
      .first();
    await expect(publishedLink).toHaveAttribute("href", "/scores/local/1029");
    await publishedLink.click();
    await expect(page).toHaveURL(/\/scores\/local\/1029$/);
    await expect(page.getByRole("heading", { level: 1, name: "바순 소나타 1악장" })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "구매 옵션" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "바순 소나타 1악장" })).toBeVisible();

    const pendingResponse = await page.request.get("/scores/1030");
    expect(pendingResponse.status()).toBe(404);
  });

  test("F-15 판매 전환과 숨김이 악기·편곡자 페이지에 새로고침 후 반영", async ({ page }) => {
    const title = "바순 소나타 1악장";
    await seedBrowserState(page, { role: "admin" });

    const emptyInstrumentResponse = await page.goto("/instruments/bassoon");
    expect(emptyInstrumentResponse?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 2, name: "바순 악보 0개" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const invalidInstrumentResponse = await page.request.get("/instruments/not-an-instrument");
    expect(invalidInstrumentResponse.status()).toBe(404);

    await page.goto("/arrangers/jung-woojin");
    const arrangerHeading = page.getByRole("heading", { level: 2, name: /담당 악보 \d+개/ });
    const initialCount = Number((await arrangerHeading.innerText()).match(/\d+/)?.[0] ?? NaN);
    expect(Number.isSafeInteger(initialCount)).toBe(true);

    await page.goto(`/admin/products?q=${encodeURIComponent(title)}`);
    await page.getByRole("button", { name: `${title} 수정` }).click();
    let dialog = page.getByRole("dialog", { name: "상품 수정" });
    await dialog.getByLabel("이용허락").selectOption("cleared");
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog).toBeHidden();

    await page.goto("/instruments/bassoon");
    await expect(page.locator('[data-catalog-page-source="browser"]')).toBeAttached();
    await expect(page.getByRole("heading", { level: 2, name: "바순 악보 1개" })).toBeVisible();
    let productCard = page.locator("article").filter({ hasText: title });
    await expect(productCard).toHaveCount(1);
    await expect(productCard.getByRole("link").first()).toHaveAttribute(
      "href",
      "/scores/local/1029",
    );
    await page.reload();
    await expect(page.locator('[data-catalog-page-source="browser"]')).toBeAttached();
    await expect(page.getByText(title, { exact: true })).toBeVisible();

    await page.goto("/arrangers/jung-woojin");
    await expect(page.locator('[data-catalog-page-source="browser"]')).toBeAttached();
    await expect(
      page.getByRole("heading", { level: 2, name: `담당 악보 ${initialCount + 1}개` }),
    ).toBeVisible();
    productCard = page.locator("article").filter({ hasText: title });
    await expect(productCard).toHaveCount(1);
    await expect(productCard.getByRole("link").first()).toHaveAttribute(
      "href",
      "/scores/local/1029",
    );
    await page.reload();
    await expect(page.locator('[data-catalog-page-source="browser"]')).toBeAttached();
    await expect(page.getByText(title, { exact: true })).toBeVisible();

    await page.goto(`/admin/products?q=${encodeURIComponent(title)}`);
    await page.getByRole("button", { name: `${title} 수정` }).click();
    dialog = page.getByRole("dialog", { name: "상품 수정" });
    await dialog.getByLabel("게시 상태").selectOption("hidden");
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog).toBeHidden();

    await page.goto("/instruments/bassoon");
    await page.reload();
    await expect(page.locator('[data-catalog-page-source="browser"]')).toBeAttached();
    await expect(page.getByRole("heading", { level: 2, name: "바순 악보 0개" })).toBeVisible();
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);

    await page.goto("/arrangers/jung-woojin");
    await page.reload();
    await expect(page.locator('[data-catalog-page-source="browser"]')).toBeAttached();
    await expect(
      page.getByRole("heading", { level: 2, name: `담당 악보 ${initialCount}개` }),
    ).toBeVisible();
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  });

  for (const product of [
    {
      label: "악보집",
      title: "처음 피아노 악보집",
      updatedTitle: "처음 피아노 악보집 관리자 수정",
      route: "/bundles/2002",
    },
    {
      label: "밴드세트",
      title: "사건의 지평선 밴드세트",
      updatedTitle: "사건의 지평선 밴드세트 관리자 수정",
      route: "/band-sets/3001",
    },
  ] as const) {
    test(`F-15 ${product.label} seed 수정·숨김이 canonical 상세에 반영`, async ({ page }) => {
      await seedBrowserState(page, { role: "admin" });

      await page.goto(`/admin/products?q=${encodeURIComponent(product.title)}`);
      await page.getByRole("button", { name: `${product.title} 수정` }).click();
      let dialog = page.getByRole("dialog", { name: "상품 수정" });
      await dialog.getByLabel("제목").fill(product.updatedTitle);
      await dialog.getByRole("button", { name: "저장" }).click();
      await expect(dialog).toBeHidden();

      await page.goto(product.route);
      await expect(page).toHaveURL(new RegExp(`${product.route}$`));
      await expect(
        page.getByRole("heading", { level: 1, name: product.updatedTitle }),
      ).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${product.route}$`),
      );

      await page.goto(`/admin/products?q=${encodeURIComponent(product.updatedTitle)}`);
      await page.getByRole("button", { name: `${product.updatedTitle} 수정` }).click();
      dialog = page.getByRole("dialog", { name: "상품 수정" });
      await dialog.getByLabel("게시 상태").selectOption("hidden");
      await dialog.getByRole("button", { name: "저장" }).click();
      await expect(dialog).toBeHidden();

      await page.goto(product.route);
      await expect(
        page.getByRole("heading", { level: 1, name: "판매할 수 없는 상품이에요" }),
      ).toBeVisible();
      await expect(page.getByRole("complementary", { name: "구매 옵션" })).toHaveCount(0);
    });
  }
});
