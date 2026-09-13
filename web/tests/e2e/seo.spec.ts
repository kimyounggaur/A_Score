import { expect, test } from "@playwright/test";

test("홈·편곡자·악기 페이지가 공용 OG 이미지를 유지해요", async ({ page }) => {
  for (const path of ["/", "/arrangers/kim-minsu", "/instruments/acoustic-guitar"]) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/opengraph-image$/,
    );
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      "content",
      "1200",
    );
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
      "content",
      "630",
    );
  }
});

test("상품 상세가 고유 설명과 상품별 OG 이미지를 제공해요", async ({ page }) => {
  for (const product of [
    { path: "/scores/1021", title: "아기상어" },
    { path: "/scores/1022", title: "생일 축하합니다" },
    { path: "/bundles/2001", title: "인디 기타 베스트 악보집" },
    { path: "/band-sets/3001", title: "사건의 지평선 밴드세트" },
  ]) {
    await page.goto(product.path);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      new RegExp(product.title),
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      new RegExp(`${product.path}/opengraph-image`),
    );
  }
});
