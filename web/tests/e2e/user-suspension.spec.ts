import { expect, test, type Page } from "@playwright/test";

const MEMBER_EMAIL = "player@example.com";
const ADMIN_LOGIN_EMAIL = "admin@scorestore.demo";

async function signIn(page: Page, email: string, next = "/") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("이메일").fill(email);
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
}

async function clearSession(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("ss.mock.session");
    localStorage.removeItem("ss.mock.session.v1");
  });
}

async function setMemberSuspension(page: Page, action: "정지" | "복구") {
  const memberRow = page.getByRole("row").filter({ hasText: MEMBER_EMAIL });
  await memberRow.getByRole("button", { name: action }).click();
  await page.getByRole("dialog").getByRole("button", { name: "확인" }).click();
  await expect(memberRow).toContainText(action === "정지" ? "정지" : "정상");
}

test("회원 정지는 로그인과 기존 세션을 차단하고 복구하면 다시 허용한다", async ({ page }) => {
  await signIn(page, ADMIN_LOGIN_EMAIL, "/admin/users");
  await expect(page).toHaveURL(/\/admin\/users$/);
  await setMemberSuspension(page, "정지");

  await clearSession(page);
  await signIn(page, "member@example.com");
  await expect(
    page.getByText("이용이 정지된 계정이에요. 관리자에게 문의해 주세요.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login/);

  await page.evaluate(() => {
    const session = {
      id: "demo-user",
      name: "오래 열린 세션",
      email: "member@example.com",
      role: "user",
      provider: "email",
      joinedAt: "2026-09-13T03:00:00.000Z",
    };
    localStorage.setItem("ss.mock.session", JSON.stringify({ version: 1, data: session }));
    localStorage.setItem("ss.mock.session.v1", JSON.stringify({ state: { session }, version: 0 }));
  });
  await page.goto("/checkout?items=1001");
  await expect(page).toHaveURL(/\/login\?next=/);

  await signIn(page, ADMIN_LOGIN_EMAIL, "/admin/users");
  await expect(page).toHaveURL(/\/admin\/users$/);
  await setMemberSuspension(page, "복구");

  await clearSession(page);
  await signIn(page, "member@example.com", "/checkout?items=1001");
  await expect(page).toHaveURL(/\/checkout\?items=1001$/);
  await expect(page.getByRole("heading", { level: 1, name: "주문 확인" })).toBeVisible();
});
