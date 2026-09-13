import { expect, test } from "@playwright/test";

import { seedBrowserState } from "./test-state";

test.describe("B5 홈", () => {
  test("홈 문서에는 대표 h1이 하나만 있어요", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("ScoreStore 디지털 악보 마켓");
  });

  test("자바스크립트가 없어도 상품명이 HTML에 있어요", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByText("밤편지", { exact: true }).first()).toBeVisible();
    await context.close();
  });

  test("F-15 관리자에서 바꾼 seed 상품의 제목·가격·숨김이 홈 새로고침에 반영", async ({ page }) => {
    await seedBrowserState(page, { role: "admin" });
    await page.goto(`/admin/products?q=${encodeURIComponent("밤편지")}`);
    await page.getByRole("button", { name: "밤편지 수정" }).click();
    let dialog = page.getByRole("dialog", { name: "상품 수정" });
    await dialog.getByLabel("제목").fill("밤편지 홈 반영");
    await dialog.getByLabel("할인가").fill("1500");
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog).toBeHidden();

    await page.goto("/");
    await expect(page.locator('[data-home-catalog-source="browser"]')).toBeAttached();
    const newScores = page.locator('section[aria-labelledby="new-scores-heading"]');
    let updatedCard = newScores.locator("article").filter({
      has: page.getByRole("heading", { level: 3, name: "밤편지 홈 반영" }),
    });
    await expect(updatedCard).toHaveCount(1);
    await expect(updatedCard).toContainText("₩1,500");
    await expect(page.getByRole("link", { name: "통기타 4", exact: true }).first()).toBeVisible();
    await expect(
      page
        .locator('section[aria-labelledby="arrangers-heading"] a')
        .filter({ has: page.getByRole("heading", { level: 3, name: "김민수" }) }),
    ).toContainText("담당 악보 5개");

    await page.reload();
    await expect(page.locator('[data-home-catalog-source="browser"]')).toBeAttached();
    updatedCard = page
      .locator('section[aria-labelledby="new-scores-heading"] article')
      .filter({ hasText: "밤편지 홈 반영" });
    await expect(updatedCard).toHaveCount(1);
    await expect(updatedCard).toContainText("₩1,500");

    await page.goto(`/admin/products?q=${encodeURIComponent("밤편지 홈 반영")}`);
    await page.getByRole("button", { name: "밤편지 홈 반영 수정" }).click();
    dialog = page.getByRole("dialog", { name: "상품 수정" });
    await dialog.getByLabel("게시 상태").selectOption("hidden");
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog).toBeHidden();

    await page.goto("/");
    await page.reload();
    await expect(page.locator('[data-home-catalog-source="browser"]')).toBeAttached();
    await expect(page.getByText("밤편지 홈 반영", { exact: true })).toHaveCount(0);
    await expect(page.getByText("밤편지", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "통기타 2", exact: true }).first()).toBeVisible();
    await expect(
      page
        .locator('section[aria-labelledby="arrangers-heading"] a')
        .filter({ has: page.getByRole("heading", { level: 3, name: "김민수" }) }),
    ).toContainText("담당 악보 3개");
  });

  test("F-19 배너 자동 재생을 멈출 수 있어요", async ({ page }) => {
    await page.goto("/");
    const heading = page.locator('[aria-roledescription="carousel"] [aria-hidden="false"] h2');
    const initialTitle = await heading.textContent();
    await page.getByRole("button", { name: "자동 재생 정지" }).click();
    await page.waitForTimeout(5_300);
    await expect(heading).toHaveText(initialTitle ?? "");

    await page.getByRole("button", { name: "자동 재생" }).click();
    await page.waitForTimeout(5_300);
    await expect(heading).not.toHaveText(initialTitle ?? "");
  });

  test("reduced-motion에서는 배너가 자동 전환되지 않아요", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const heading = page.locator('[aria-roledescription="carousel"] [aria-hidden="false"] h2');
    const initialTitle = await heading.textContent();
    await page.waitForTimeout(5_300);
    await expect(heading).toHaveText(initialTitle ?? "");
  });

  test("F-17 모든 더보기 링크가 유효해요", async ({ page }) => {
    await page.goto("/");
    const links = page.getByRole("link", { name: /더보기/ });
    for (let index = 0; index < (await links.count()); index += 1) {
      const href = await links.nth(index).getAttribute("href");
      expect(href).toBeTruthy();
      const response = await page.request.get(href as string);
      expect(response.ok(), href ?? "").toBeTruthy();
    }
  });
});
