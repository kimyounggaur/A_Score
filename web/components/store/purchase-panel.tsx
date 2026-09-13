"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coins, Heart, LibraryBig, LoaderCircle, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

import { PriceTag } from "@/components/store/price-tag";
import { Button } from "@/components/ui/button";
import type { CatalogProduct } from "@/lib/catalog/types";
import { effectivePrice, isFree } from "@/lib/pricing";
import { useCartStore } from "@/lib/stores/cart";
import { useSessionStore } from "@/lib/stores/session";
import { useWishlistStore } from "@/lib/stores/wishlist";

type AccountState =
  | { key: string; status: "loading" }
  | { key: string; status: "ready"; owned: boolean; pointBalance: number }
  | { key: string; status: "error"; message: string };

export function PurchasePanel({ product }: { product: CatalogProduct }) {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const sessionHydrated = useSessionStore((state) => state.hydrated);
  const addToCart = useCartStore((state) => state.add);
  const inCart = useCartStore((state) => state.items.some((item) => item.productId === product.id));
  const wished = useWishlistStore((state) => state.productIds.includes(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const sessionId = session?.id;
  const accountKey = !sessionHydrated
    ? `pending:${product.id}`
    : sessionId
      ? `${sessionId}:${product.id}`
      : `guest:${product.id}`;
  const [accountState, setAccountState] = useState<AccountState>(() =>
    sessionHydrated && !session
      ? { key: accountKey, status: "ready", owned: false, pointBalance: 0 }
      : session
        ? { key: accountKey, status: "loading" }
        : { key: accountKey, status: "loading" },
  );
  const [retryKey, setRetryKey] = useState(0);
  const currentAccountState: AccountState =
    accountState.key === accountKey ? accountState : { key: accountKey, status: "loading" };
  const owned = currentAccountState.status === "ready" && currentAccountState.owned;
  const payable = effectivePrice(product);
  const canPayWithPoints =
    Boolean(session) &&
    currentAccountState.status === "ready" &&
    !owned &&
    payable > 0 &&
    currentAccountState.pointBalance >= payable;

  useEffect(() => {
    let cancelled = false;
    if (!sessionHydrated) {
      return () => {
        cancelled = true;
      };
    }
    const key = sessionId ? `${sessionId}:${product.id}` : `guest:${product.id}`;

    if (!sessionId) {
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setAccountState({ key, status: "ready", owned: false, pointBalance: 0 });
        }
      });
      return () => {
        cancelled = true;
      };
    }

    void Promise.all([
      import("@/lib/repositories/library-repository"),
      import("@/lib/repositories/point-repository"),
    ])
      .then(([{ libraryRepository }, { pointRepository }]) =>
        Promise.all([
          libraryRepository.hasPurchased(sessionId, product.id),
          pointRepository.getBalance(sessionId),
        ]),
      )
      .then(([nextOwned, balance]) => {
        if (!cancelled) {
          setAccountState({
            key,
            status: "ready",
            owned: nextOwned,
            pointBalance: balance.total,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccountState({
            key,
            status: "error",
            message: "구매 가능 여부를 확인하지 못했어요.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [product.id, retryKey, sessionHydrated, sessionId]);

  function goToCheckout(preferPoints = false) {
    const checkoutPath = `/checkout?items=${product.id}${preferPoints ? "&points=all" : ""}`;
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(checkoutPath)}`);
      return;
    }
    router.push(checkoutPath);
  }

  function addProduct() {
    if (inCart) {
      toast.info("이미 장바구니에 담겨 있어요.");
      return;
    }
    addToCart({ productId: product.id, type: product.type });
    toast.success("장바구니에 담았어요.", {
      action: { label: "장바구니 보기", onClick: () => router.push("/cart") },
    });
  }

  return (
    <aside
      className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1px)] z-30 border-t border-line bg-surface/95 p-3 shadow-lg backdrop-blur md:bottom-0 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:z-10 lg:rounded-2xl lg:border lg:p-5 lg:shadow-sm"
      aria-label="구매 옵션"
    >
      <div className="page-shell grid grid-cols-[2.75rem_2.75rem_minmax(0,1fr)] items-center gap-2 lg:flex lg:w-auto lg:flex-col lg:items-stretch">
        <PriceTag
          className="col-span-3 mr-auto lg:mb-2 lg:mr-0"
          listPrice={product.listPrice}
          saleEndsAt={product.saleEndsAt}
          salePrice={product.salePrice}
          size="lg"
        />
        <Button
          className="size-11 shrink-0 lg:w-full"
          type="button"
          variant="outline"
          size="icon"
          aria-label={wished ? "찜 해제" : "찜하기"}
          aria-pressed={wished}
          onClick={() => toggleWishlist(product.id)}
        >
          <Heart
            className={wished ? "fill-sale text-sale" : ""}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className="hidden lg:inline">{wished ? "찜 해제" : "찜하기"}</span>
        </Button>
        {currentAccountState.status === "loading" ? (
          <div
            className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-muted px-3 text-sm text-text-muted lg:w-full"
            role="status"
          >
            <LoaderCircle
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            구매 가능 여부 확인 중
          </div>
        ) : currentAccountState.status === "error" ? (
          <div className="col-span-2 grid gap-2 lg:w-full">
            <p className="text-sm text-sale-ink" role="alert">
              {currentAccountState.message}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAccountState({ key: accountKey, status: "loading" });
                setRetryKey((value) => value + 1);
              }}
            >
              다시 시도
            </Button>
          </div>
        ) : owned ? (
          <Button className="col-span-2 min-h-11 bg-cta hover:bg-cta-hover lg:w-full" asChild>
            <Link href="/me/library">
              <LibraryBig strokeWidth={1.5} aria-hidden="true" />
              보관함에서 받기
            </Link>
          </Button>
        ) : (
          <>
            <Button
              className="size-11 shrink-0 lg:w-full"
              type="button"
              variant="outline"
              size="icon"
              aria-label={inCart ? "이미 장바구니에 담김" : "장바구니에 담기"}
              onClick={addProduct}
            >
              <ShoppingBag strokeWidth={1.5} aria-hidden="true" />
              <span className="hidden lg:inline">{inCart ? "담겨 있어요" : "장바구니"}</span>
            </Button>
            <Button
              className="min-h-11 bg-cta hover:bg-cta-hover lg:w-full"
              type="button"
              onClick={() => goToCheckout()}
            >
              {isFree(product) ? (
                <LibraryBig strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <ShoppingBag strokeWidth={1.5} aria-hidden="true" />
              )}
              {isFree(product) ? "무료로 받기" : "구매하기"}
            </Button>
          </>
        )}
        {canPayWithPoints ? (
          <Button
            className="col-span-3 min-h-11 lg:w-full"
            type="button"
            variant="outline"
            onClick={() => goToCheckout(true)}
          >
            <Coins strokeWidth={1.5} aria-hidden="true" />
            포인트로 결제
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
