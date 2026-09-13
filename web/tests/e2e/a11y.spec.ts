import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { QA_ORDER_ID, seedBrowserState, type BrowserSeed } from "./test-state";

type ScreenCase = {
  name: string;
  path: string;
  readyHeading: string | RegExp;
  readyHeadingLevel?: 1 | 2;
  seed?: BrowserSeed;
};

const screens: readonly ScreenCase[] = [
  { name: "홈", path: "/", readyHeading: "어떤 곡을 연주할까요", readyHeadingLevel: 2 },
  { name: "목록", path: "/scores", readyHeading: "악보 검색" },
  { name: "단일 상세", path: "/scores/1001", readyHeading: "밤편지" },
  { name: "악보집 상세", path: "/bundles/2001", readyHeading: "인디 기타 베스트 악보집" },
  { name: "밴드세트 상세", path: "/band-sets/3001", readyHeading: "사건의 지평선 밴드세트" },
  {
    name: "장바구니",
    path: "/cart",
    readyHeading: "장바구니",
    seed: {
      cart: [
        { productId: 1010, type: "score" },
        { productId: 3001, type: "band-set" },
      ],
    },
  },
  {
    name: "결제",
    path: "/checkout?items=1010,3001",
    readyHeading: "주문 확인",
    seed: { role: "user", points: 30_000 },
  },
  {
    name: "완료",
    path: `/checkout/success?orderId=${QA_ORDER_ID}&paymentKey=mock%3Aorder-qa-paid%3A1990%3A1&amount=1990`,
    readyHeading: "결제가 완료됐어요",
    seed: { role: "user", paidOrder: true, library: true },
  },
  { name: "로그인", path: "/login", readyHeading: "연주를 이어가 볼까요?" },
  {
    name: "보관함",
    path: "/me/library",
    readyHeading: "보관함",
    seed: { role: "user", paidOrder: true, library: true },
  },
  {
    name: "관리자 악보 목록",
    path: "/admin/products",
    readyHeading: "악보 관리",
    seed: { role: "admin" },
  },
] as const;

const viewports = [
  { name: "모바일 390px", width: 390, height: 844 },
  { name: "데스크톱 1280px", width: 1280, height: 900 },
] as const;

async function waitUntilScreenIsReady(page: Page, screen: ScreenCase) {
  await page.goto(screen.path);
  await expect(
    page
      .getByRole("heading", { level: screen.readyHeadingLevel ?? 1, name: screen.readyHeading })
      .first(),
  ).toBeVisible();

  if (screen.name === "관리자 악보 목록") {
    await expect(page.getByRole("cell", { name: /밤편지/ }).first()).toBeVisible();
  }
}

test.describe("B11 주요 11화면 접근성", () => {
  test.describe.configure({ mode: "serial" });

  for (const viewport of viewports) {
    for (const screen of screens) {
      test(`${viewport.name} · ${screen.name} · axe serious/critical 0`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        if (screen.seed) await seedBrowserState(page, screen.seed);
        await waitUntilScreenIsReady(page, screen);

        const results = await new AxeBuilder({ page }).analyze();
        const blocking = results.violations
          .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
          .map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            targets: violation.nodes.map((node) => node.target),
          }));

        expect(
          blocking,
          `${viewport.name} ${screen.name}에서 serious/critical 접근성 위반이 발견됐어요.`,
        ).toEqual([]);
      });
    }
  }
});
