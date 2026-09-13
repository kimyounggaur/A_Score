import type { Page } from "@playwright/test";

type DemoRole = "user" | "admin";
type CartSeed = { productId: number; type: "score" | "bundle" | "band-set" };

const FIXED_TIME = "2026-09-13T03:00:00.000Z";
const FAR_FUTURE = "2099-12-31T14:59:59.000Z";
const BONUS_FUTURE = "2098-12-31T14:59:59.000Z";

export const QA_ORDER_ID = "order-qa-paid";
export const QA_ORDER_NO = "SS-20260913-0001";

export type BrowserSeed = {
  role?: DemoRole;
  cart?: CartSeed[];
  points?: number;
  paidOrder?: boolean;
  library?: boolean;
  refundLedger?: boolean;
};

/**
 * 저장소와 Zustand가 실제로 쓰는 버전 문서 형식으로 테스트 상태를 준비한다.
 * 앱 로직을 우회해 주문을 "완료"시키는 용도가 아니라, 독립적인 보호 화면과
 * 완료 화면의 접근성 검사를 재현 가능하게 만드는 고정 fixture다.
 */
export async function seedBrowserState(page: Page, seed: BrowserSeed): Promise<void> {
  await page.addInitScript(
    ({ fixedTime, farFuture, bonusFuture, orderId, orderNo, seedValue }) => {
      const repositoryDocument = (data: unknown) => JSON.stringify({ version: 1, data });

      if (seedValue.role) {
        const isAdmin = seedValue.role === "admin";
        const session = {
          id: isAdmin ? "demo-admin" : "demo-user",
          name: isAdmin ? "데모 관리자" : "데모 회원",
          email: isAdmin ? "admin@scorestore.demo" : "member@scorestore.demo",
          role: seedValue.role,
          provider: "email",
          joinedAt: fixedTime,
        };
        localStorage.setItem(
          "ss.mock.session.v1",
          JSON.stringify({ state: { session }, version: 0 }),
        );
        localStorage.setItem("ss.mock.session", repositoryDocument(session));
      }

      if (seedValue.cart) {
        localStorage.setItem(
          "ss.mock.cart.v1",
          JSON.stringify({
            state: {
              items: seedValue.cart.map((item) => ({ ...item, addedAt: fixedTime })),
            },
            version: 0,
          }),
        );
      }

      if (seedValue.points && seedValue.points > 0) {
        localStorage.setItem(
          "ss.mock.point-lots",
          repositoryDocument({
            "demo-user": [
              {
                id: "lot-qa-paid",
                bucket: "paid",
                remaining: seedValue.points,
                expiresAt: farFuture,
                createdAt: fixedTime,
              },
            ],
          }),
        );
      }

      if (seedValue.paidOrder) {
        const hasRefundLedger = seedValue.refundLedger === true;
        const order = {
          id: orderId,
          orderNo,
          userId: "demo-user",
          items: [
            {
              productId: 1001,
              type: "score",
              title: "밤편지",
              listPrice: 2_900,
              salePrice: 1_990,
              paidPrice: 1_990,
            },
          ],
          status: "paid",
          listAmount: 2_900,
          totalAmount: 1_990,
          pointsUsed: hasRefundLedger ? 600 : 0,
          cashPaid: hasRefundLedger ? 1_390 : 1_990,
          earnedPoints: hasRefundLedger ? 41 : 59,
          paymentMethod: "card",
          paymentRef: "mock:order-qa-paid:1990:1",
          createdAt: fixedTime,
          finalizedAt: fixedTime,
          failureCode: null,
          refundReason: null,
        };
        localStorage.setItem("ss.mock.orders", repositoryDocument([order]));
      }

      if (seedValue.refundLedger) {
        localStorage.setItem(
          "ss.mock.point-lots",
          repositoryDocument({
            "demo-user": [
              {
                id: "lot-qa-paid",
                bucket: "paid",
                remaining: 900,
                expiresAt: farFuture,
                createdAt: fixedTime,
              },
              {
                id: "lot-qa-bonus",
                bucket: "bonus",
                remaining: 0,
                expiresAt: bonusFuture,
                createdAt: fixedTime,
              },
              {
                id: "lot-qa-earned",
                bucket: "bonus",
                remaining: 41,
                expiresAt: bonusFuture,
                createdAt: fixedTime,
              },
            ],
          }),
        );
        localStorage.setItem(
          "ss.mock.point-transactions",
          repositoryDocument([
            {
              id: "tx-qa-charge",
              userId: "demo-user",
              type: "charge",
              bucket: "paid",
              amount: 1_000,
              referenceId: "qa-charge",
              lotId: "lot-qa-paid",
              reversalOf: null,
              createdAt: fixedTime,
              expiresAt: farFuture,
            },
            {
              id: "tx-qa-bonus",
              userId: "demo-user",
              type: "bonus",
              bucket: "bonus",
              amount: 500,
              referenceId: "qa-charge",
              lotId: "lot-qa-bonus",
              reversalOf: null,
              createdAt: fixedTime,
              expiresAt: bonusFuture,
            },
            {
              id: "tx-qa-spend-bonus",
              userId: "demo-user",
              type: "spend",
              bucket: "bonus",
              amount: -500,
              referenceId: orderId,
              lotId: "lot-qa-bonus",
              reversalOf: null,
              createdAt: fixedTime,
              expiresAt: bonusFuture,
            },
            {
              id: "tx-qa-spend-paid",
              userId: "demo-user",
              type: "spend",
              bucket: "paid",
              amount: -100,
              referenceId: orderId,
              lotId: "lot-qa-paid",
              reversalOf: null,
              createdAt: fixedTime,
              expiresAt: farFuture,
            },
            {
              id: "tx-qa-earn",
              userId: "demo-user",
              type: "earn",
              bucket: "bonus",
              amount: 41,
              referenceId: orderId,
              lotId: "lot-qa-earned",
              reversalOf: null,
              createdAt: fixedTime,
              expiresAt: bonusFuture,
            },
          ]),
        );
      }

      if (seedValue.library) {
        localStorage.setItem(
          "ss.mock.library",
          repositoryDocument([
            {
              id: "library-qa-1001",
              userId: "demo-user",
              productId: 1001,
              productType: "score",
              orderId,
              orderNo,
              purchasedAt: fixedTime,
            },
          ]),
        );
      }
    },
    {
      fixedTime: FIXED_TIME,
      farFuture: FAR_FUTURE,
      bonusFuture: BONUS_FUTURE,
      orderId: QA_ORDER_ID,
      orderNo: QA_ORDER_NO,
      seedValue: seed,
    },
  );
}

export async function signInWithEmail(page: Page, next = "/"): Promise<void> {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("이메일").fill("member@example.com");
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
}

export async function readRepositoryData<T>(page: Page, key: string): Promise<T> {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) throw new Error(`${storageKey} 테스트 데이터가 없습니다.`);
    return (JSON.parse(raw) as { data: T }).data;
  }, key);
}
