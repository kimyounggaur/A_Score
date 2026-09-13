import { expect, test } from "@playwright/test";

import { seedBrowserState } from "./test-state";

test.describe("B6 목록과 검색", () => {
  test("필터 URL을 새로고침해도 같은 결과가 나와요", async ({ page }) => {
    const url = "/scores?instrument=acoustic-guitar&format=tab&genre=indie&sort=new";
    await page.goto(url);
    const heading = page.getByRole("heading", { name: /악보 \d+개/ });
    const before = await heading.textContent();
    await page.reload();
    await expect(heading).toHaveText(before ?? "");
    expect(page.url()).toContain("instrument=acoustic-guitar");
    expect(page.url()).toContain("format=tab");
  });

  test("초성과 악기 별칭 검색이 동작해요", async ({ page }) => {
    await page.goto("/scores?q=ㅂㅍㅈ");
    await expect(page.getByRole("heading", { name: "밤편지" })).toBeVisible();
    await page.goto("/scores?q=플룻");
    await expect(page.getByText("플루트", { exact: true }).first()).toBeVisible();
  });

  test("모바일 지연 필터가 열리고 선택한 악기를 URL에 반영해요", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/scores");

    await page.getByRole("button", { name: "필터", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "검색 필터" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("악기", { exact: true }).selectOption("acoustic-guitar");

    await expect(page).toHaveURL(/\/scores\?instrument=acoustic-guitar$/);
    await dialog.getByRole("button", { name: "닫기" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("heading", { name: /악보 \d+개/ })).toBeVisible();
  });

  test("최근 검색어를 저장하고 빈 검색 화면에서 다시 선택할 수 있어요", async ({ page }) => {
    await page.goto("/scores");
    const input = page.getByRole("searchbox", { name: "악보 검색" });
    await input.fill("밤편지");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/scores\?q=%EB%B0%A4%ED%8E%B8%EC%A7%80$/);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("ss.mock.recent-searches.v1")))
      .toContain("밤편지");

    await page.goto("/scores");
    const recentSearch = page
      .locator('[aria-label="최근 검색어"]')
      .getByRole("button", { name: "밤편지" });
    await expect(recentSearch).toBeVisible();
    await recentSearch.click();

    await expect(page.getByRole("searchbox", { name: "악보 검색" })).toHaveValue("밤편지");
    await expect(page).toHaveURL(/\/scores\?q=%EB%B0%A4%ED%8E%B8%EC%A7%80$/);
  });

  test("브라우저 저장소로 재조회한 seed 상품도 canonical 상세 링크를 유지해요", async ({
    page,
  }) => {
    await page.goto("/scores?q=밤편지");
    const productLink = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { level: 3, name: "밤편지" }) })
      .getByRole("link")
      .first();
    await expect(productLink).toHaveAttribute("href", "/scores/1001");
  });

  test("페이지 이동은 URL 상태와 정렬을 보존하고 새로고침·뒤로가기로 복원돼요", async ({
    page,
  }) => {
    await page.goto("/scores?sort=new");
    const pagination = page.getByRole("navigation", { name: "검색 결과 페이지" });
    const firstPageTitles = await page.locator("article h3").allTextContents();

    await expect(pagination.getByRole("link", { name: "다음 페이지" })).toHaveAttribute(
      "href",
      "/scores?sort=new&page=2",
    );
    await pagination.getByRole("link", { name: "다음 페이지" }).click();
    await expect(page).toHaveURL(/\/scores\?sort=new&page=2$/);
    await expect(pagination.locator('[aria-current="page"]')).toHaveText("2");
    const secondPageTitles = await page.locator("article h3").allTextContents();
    expect(secondPageTitles).not.toEqual(firstPageTitles);

    await page.reload();
    await expect(page.locator("article h3")).toHaveText(secondPageTitles);
    await page.goBack();
    await expect(page).toHaveURL(/\/scores\?sort=new$/);
    await expect(page.locator("article h3")).toHaveText(firstPageTitles);
  });

  test("악기 페이지의 잘못되거나 초과한 page는 canonical URL로 정리돼요", async ({ page }) => {
    await page.goto("/instruments/acoustic-guitar?page=2junk");
    await expect(page).toHaveURL(/\/instruments\/acoustic-guitar$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/instruments\/acoustic-guitar$/,
    );

    await page.goto("/instruments/acoustic-guitar?page=9999");
    await expect(page).toHaveURL(/\/instruments\/acoustic-guitar$/);
  });
});

test.describe("B7 상품 상세", () => {
  test("F-04 없는 상품 ID는 404예요", async ({ page }) => {
    const response = await page.goto("/scores/9999");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없어요" })).toBeVisible();
  });

  test("판매 전·숨김 seed의 canonical URL도 404예요", async ({ request }) => {
    for (const path of ["/scores/1029", "/scores/1030", "/scores/1033"]) {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
    }
  });

  test("local URL의 seed와 누락 상품을 canonical HTTP 경로로 정리해요", async ({ page }) => {
    await page.goto("/scores/local/1001");
    await expect(page).toHaveURL(/\/scores\/1001$/);
    await expect(page.getByRole("heading", { level: 1, name: "밤편지" })).toBeVisible();

    await page.goto("/scores/local/9999");
    await expect(page).toHaveURL(/\/scores\/9999$/);
    await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없어요" })).toBeVisible();
    const response = await page.reload();
    expect(response?.status()).toBe(404);
  });

  test("F-07 악보집에 단일 악보 전용 정보가 없어요", async ({ page }) => {
    await page.goto("/bundles/2001");
    await expect(page.getByText("조성", { exact: true })).toHaveCount(0);
    await expect(page.getByText("BPM", { exact: true })).toHaveCount(0);
  });

  test("F-08 피아노 악보에 TAB 기본값을 넣지 않아요", async ({ page }) => {
    await page.goto("/scores/1006");
    await expect(page.getByText("TAB", { exact: true })).toHaveCount(0);
    await expect(page.getByText("오선", { exact: true }).first()).toBeVisible();
  });

  test("상세 링크를 새 탭에서 열어도 같은 상품이에요", async ({ page, context }) => {
    await page.goto("/scores/1001");
    const url = page.url();
    const otherPage = await context.newPage();
    await otherPage.goto(url);
    await expect(otherPage.getByRole("heading", { level: 1, name: "밤편지" })).toBeVisible();
  });

  test("실제 워터마크 샘플 이미지와 오디오 컨트롤을 제공해요", async ({ page }) => {
    await page.goto("/scores/1001");
    await expect(
      page.getByRole("img", { name: "밤편지 악보 1쪽 워터마크 미리보기" }),
    ).toBeVisible();
    const audio = page.locator("audio[controls]");
    await expect(audio).toHaveAttribute("src", "/samples/demo-tone.wav");
    const duration = await audio.evaluate(
      (node) =>
        new Promise<number>((resolve, reject) => {
          const element = node as HTMLAudioElement;
          element.addEventListener("loadedmetadata", () => resolve(element.duration), {
            once: true,
          });
          element.addEventListener(
            "error",
            () => reject(new Error("샘플 오디오를 읽지 못했어요.")),
            {
              once: true,
            },
          );
          element.load();
        }),
    );
    expect(duration).toBeGreaterThanOrEqual(29.9);
    expect(duration).toBeLessThanOrEqual(30.1);
  });

  test("밴드세트의 제공 가능한 파트 미리보기를 탭으로 전환해요", async ({ page }) => {
    await page.goto("/band-sets/3001");
    const bassTab = page.getByRole("tab", { name: "베이스" });
    await bassTab.click();
    await expect(bassTab).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("img", { name: "사건의 지평선 밴드세트 베이스 파트 워터마크 미리보기" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/part=bass/);

    await page.reload();
    await expect(page.getByRole("tab", { name: "베이스" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.goBack();
    await expect(page.getByRole("tab", { name: "일렉기타" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("이미 보유한 상품은 보관함에서 받도록 안내해요", async ({ page }) => {
    await seedBrowserState(page, { role: "user", paidOrder: true, library: true });
    await page.goto("/scores/1001");
    const panel = page.getByRole("complementary", { name: "구매 옵션" });
    await expect(panel.getByRole("link", { name: "보관함에서 받기" })).toBeVisible();
    await expect(panel.getByRole("button", { name: "구매하기" })).toHaveCount(0);
  });

  test("포인트가 충분하면 전액 포인트 결제로 이어져요", async ({ page }) => {
    await seedBrowserState(page, { role: "user", points: 30_000 });
    await page.goto("/scores/1001");
    await page
      .getByRole("complementary", { name: "구매 옵션" })
      .getByRole("button", { name: "포인트로 결제" })
      .click();
    await expect(page).toHaveURL(/\/checkout\?items=1001&points=all$/);
  });
});
