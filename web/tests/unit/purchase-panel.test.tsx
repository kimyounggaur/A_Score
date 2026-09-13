import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_SCORES } from "@/data/mock/products";
import { PurchasePanel } from "@/components/store/purchase-panel";

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  getBalance: vi.fn(),
  hasPurchased: vi.fn(),
  push: vi.fn(),
  toggleWishlist: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/repositories/library-repository", () => ({
  libraryRepository: { hasPurchased: mocks.hasPurchased },
}));

vi.mock("@/lib/repositories/point-repository", () => ({
  pointRepository: { getBalance: mocks.getBalance },
}));

vi.mock("@/lib/stores/cart", () => ({
  useCartStore: (selector: (state: { add: typeof mocks.add; items: never[] }) => unknown) =>
    selector({ add: mocks.add, items: [] }),
}));

vi.mock("@/lib/stores/session", () => ({
  useSessionStore: (
    selector: (state: {
      hydrated: boolean;
      session: {
        id: string;
        name: string;
        email: string;
        role: "user";
        provider: "email";
        joinedAt: string;
      };
    }) => unknown,
  ) =>
    selector({
      hydrated: true,
      session: {
        id: "purchase-panel-user",
        name: "구매 테스트",
        email: "purchase@example.com",
        role: "user",
        provider: "email",
        joinedAt: "2026-09-13T00:00:00.000Z",
      },
    }),
}));

vi.mock("@/lib/stores/wishlist", () => ({
  useWishlistStore: (
    selector: (state: { productIds: number[]; toggle: typeof mocks.toggleWishlist }) => unknown,
  ) => selector({ productIds: [], toggle: mocks.toggleWishlist }),
}));

const product = MOCK_SCORES[0]!;

describe("PurchasePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("hides cart and checkout actions until ownership and points are confirmed", async () => {
    let resolveOwned: (value: boolean) => void = () => undefined;
    let resolveBalance: (value: { total: number }) => void = () => undefined;
    mocks.hasPurchased.mockReturnValue(
      new Promise<boolean>((resolve) => {
        resolveOwned = resolve;
      }),
    );
    mocks.getBalance.mockReturnValue(
      new Promise<{ total: number }>((resolve) => {
        resolveBalance = resolve;
      }),
    );

    render(<PurchasePanel product={product} />);

    expect(screen.getByRole("status")).toHaveTextContent("구매 가능 여부 확인 중");
    expect(screen.queryByRole("button", { name: "장바구니에 담기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "구매하기" })).not.toBeInTheDocument();

    await act(async () => {
      resolveOwned(false);
      resolveBalance({ total: 0 });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "장바구니에 담기" })).toBeVisible();
      expect(screen.getByRole("button", { name: "구매하기" })).toBeVisible();
    });
  });

  it("shows a retry action after account verification fails", async () => {
    mocks.hasPurchased.mockRejectedValueOnce(new Error("storage unavailable"));
    mocks.getBalance.mockRejectedValueOnce(new Error("storage unavailable"));

    render(<PurchasePanel product={product} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "구매 가능 여부를 확인하지 못했어요.",
    );
    expect(screen.queryByRole("button", { name: "장바구니에 담기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "구매하기" })).not.toBeInTheDocument();

    mocks.hasPurchased.mockResolvedValue(false);
    mocks.getBalance.mockResolvedValue({ total: 0 });
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "장바구니에 담기" })).toBeVisible();
      expect(screen.getByRole("button", { name: "구매하기" })).toBeVisible();
    });
  });
});
