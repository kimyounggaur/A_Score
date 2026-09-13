import { expect, test } from "@playwright/test";

import { DEMO_ADMIN } from "@/data/mock/seed-user";
import { DEMO_ADMIN_EMAIL } from "@/lib/config/demo-account";

const unsafeNextTargets = [
  { name: "backslash authority", value: "/%5Cexample.com" },
  { name: "double-encoded backslash authority", value: "/%255Cexample.com" },
] as const;

for (const target of unsafeNextTargets) {
  test(`로그인 next의 ${target.name} 우회가 외부 origin으로 이동하지 않아요`, async ({ page }) => {
    await page.goto(`/login?next=${target.value}`);
    await page.getByLabel("이메일").fill("member@example.com");
    await page.getByRole("button", { name: "이메일로 로그인" }).click();

    await expect(page).toHaveURL("http://localhost:3000/");
    expect(new URL(page.url()).origin).toBe("http://localhost:3000");
  });
}

test("현재 관리자는 자신의 계정을 정지할 수 없고 이유를 확인할 수 있어요", async ({ page }) => {
  await page.goto("/login?next=/admin/users");
  await page.getByLabel("이메일").fill(DEMO_ADMIN_EMAIL);
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  await expect(page).toHaveURL(/\/admin\/users$/);

  const currentAdminRow = page.getByRole("row").filter({ hasText: DEMO_ADMIN_EMAIL });
  await expect(
    currentAdminRow.getByRole("button", { name: `${DEMO_ADMIN.name} 회원 정지` }),
  ).toBeDisabled();
  await expect(currentAdminRow).toContainText("현재 로그인한 관리자 계정은 정지할 수 없습니다.");
});
