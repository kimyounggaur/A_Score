import { expect, test } from "@playwright/test";

import { seedBrowserState } from "./test-state";

test("관리자 사이트 이름 설정이 공개 헤더와 새로고침에 반영된다", async ({ page }) => {
  await seedBrowserState(page, { role: "admin" });
  await page.goto("/admin/settings");
  await page.getByLabel("사이트 이름").fill("QA ScoreStore");
  await page.getByRole("button", { name: "설정 저장" }).click();

  await page.goto("/");
  await expect(page.getByRole("link", { name: "QA ScoreStore 홈" })).toBeVisible();
  await expect(page.locator("footer")).toContainText("QA ScoreStore");
  await expect(page).toHaveTitle(/QA ScoreStore/);
  await page.reload();
  await expect(page.getByRole("link", { name: "QA ScoreStore 홈" })).toBeVisible();
  await expect(page.locator("footer")).toContainText("QA ScoreStore");
  await expect(page).toHaveTitle(/QA ScoreStore/);

  await page.goto(`/admin/products?q=${encodeURIComponent("밤편지")}`);
  await page.getByRole("button", { name: "밤편지 수정" }).click();
  const dialog = page.getByRole("dialog", { name: "상품 수정" });
  await dialog.getByLabel("제목").fill("밤편지 설정 회귀");
  await dialog.getByRole("button", { name: "저장" }).click();
  await expect(dialog).toBeHidden();

  await page.goto("/scores/1001");
  await expect(page.getByRole("heading", { level: 1, name: "밤편지 설정 회귀" })).toBeVisible();
  await expect(page).toHaveTitle("밤편지 설정 회귀 | QA ScoreStore");
  await page.reload();
  await expect(page).toHaveTitle("밤편지 설정 회귀 | QA ScoreStore");
});
