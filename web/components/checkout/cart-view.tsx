"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LibraryBig, LoaderCircle, Music2, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

import { PriceTag } from "@/components/store/price-tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { hasBrowserCatalogOverride } from "@/lib/catalog/browser-overrides";
import type { CatalogProduct } from "@/lib/catalog/types";
import { getProductPath } from "@/lib/catalog/types";
import { formatWon, savingsAmount, sumList, sumPayable } from "@/lib/pricing";
import { useCartStore } from "@/lib/stores/cart";
import { useSessionStore } from "@/lib/stores/session";
import { useMounted } from "@/hooks/use-mounted";

type OwnershipState =
  | { userId: string; status: "loading" }
  | { userId: string; status: "ready"; productIds: number[] }
  | { userId: string; status: "error"; message: string };

export function CartView({ products }: { products: CatalogProduct[] }) {
  const mounted = useMounted();
  const items = useCartStore((state) => state.items);
  const remove = useCartStore((state) => state.remove);
  const session = useSessionStore((state) => state.session);
  const sessionHydrated = useSessionStore((state) => state.hydrated);
  const [currentProducts, setCurrentProducts] = useState(products);
  const [ownershipState, setOwnershipState] = useState<OwnershipState | null>(null);
  const [ownershipRetryKey, setOwnershipRetryKey] = useState(0);

  useEffect(() => {
    if (!mounted || !hasBrowserCatalogOverride()) return;
    let active = true;
    void import("@/lib/repositories/catalog-repository").then(({ catalogRepository }) =>
      Promise.all(items.map((item) => catalogRepository.getProduct(item.productId))).then(
        (resolved) => {
          if (!active) return;
          setCurrentProducts(
            resolved.filter((product): product is CatalogProduct => Boolean(product)),
          );
        },
      ),
    );
    return () => {
      active = false;
    };
  }, [items, mounted]);

  const sessionId = session?.id;

  useEffect(() => {
    if (!mounted || !sessionHydrated || !sessionId) return;

    let cancelled = false;
    void import("@/lib/repositories/library-repository")
      .then(({ libraryRepository }) => libraryRepository.listLibrary(sessionId))
      .then((libraryItems) => {
        if (cancelled) return;
        setOwnershipState({
          userId: sessionId,
          status: "ready",
          productIds: [...new Set(libraryItems.map((item) => item.productId))],
        });
      })
      .catch(() => {
        if (cancelled) return;
        setOwnershipState({
          userId: sessionId,
          status: "error",
          message: "보관함의 구매 내역을 확인하지 못했어요. 결제 전에 다시 확인해 주세요.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [mounted, ownershipRetryKey, sessionHydrated, sessionId]);

  const productById = new Map(currentProducts.map((product) => [product.id, product]));
  const available = items
    .map((item) => productById.get(item.productId))
    .filter((product): product is CatalogProduct => Boolean(product));
  const unavailable = items.filter((item) => !productById.has(item.productId));
  const currentOwnershipState = !sessionHydrated
    ? ({ userId: "pending", status: "loading" } as const)
    : !sessionId
      ? ({ userId: "guest", status: "ready", productIds: [] } as const)
      : ownershipState?.userId === sessionId
        ? ownershipState
        : ({ userId: sessionId, status: "loading" } as const);
  const ownershipReady = currentOwnershipState.status === "ready";
  const ownedProductIds = new Set(
    currentOwnershipState.status === "ready" ? currentOwnershipState.productIds : [],
  );
  const owned = available.filter((product) => ownedProductIds.has(product.id));
  const payableProducts = ownershipReady
    ? available.filter((product) => !ownedProductIds.has(product.id))
    : [];

  if (!mounted) {
    return <p className="py-16 text-center text-sm text-text-muted">장바구니를 불러오고 있어요.</p>;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title="장바구니가 비어 있어요"
        description="연주하고 싶은 곡을 찾아 한 번에 결제해 보세요."
        action={
          <Button asChild className="bg-cta text-surface hover:bg-cta-hover">
            <Link href="/scores">악보 둘러보기</Link>
          </Button>
        }
      />
    );
  }

  const listTotal = sumList(payableProducts);
  const payable = sumPayable(payableProducts);
  const checkoutHref = `/checkout?items=${payableProducts.map(({ id }) => id).join(",")}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-3">
        {available.map((product) => (
          <Card key={product.id} className="border-line bg-surface py-0 shadow-none">
            <CardContent className="flex items-center gap-3 p-3 md:gap-5 md:p-4">
              <Link
                href={getProductPath(product, { browserBacked: true })}
                className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 md:size-24"
                aria-label={`${product.title} 상세 보기`}
              >
                <Music2 aria-hidden="true" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  className="inline-flex min-h-11 min-w-11 items-center font-semibold text-ink-900 hover:text-cta"
                  href={getProductPath(product, { browserBacked: true })}
                >
                  <span className="line-clamp-2">{product.title}</span>
                </Link>
                {product.artist ? (
                  <p className="mt-1 truncate text-sm text-text-muted">{product.artist}</p>
                ) : null}
                <PriceTag
                  className="mt-2"
                  listPrice={product.listPrice}
                  salePrice={product.salePrice}
                  saleEndsAt={product.saleEndsAt}
                />
                {ownedProductIds.has(product.id) ? (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <p className="inline-flex items-center gap-1 font-medium text-brand-800">
                      <LibraryBig className="size-4" aria-hidden="true" />
                      이미 보관함에 있어요
                    </p>
                    <Link
                      className="inline-flex min-h-11 items-center font-semibold text-cta underline underline-offset-4"
                      href="/me/library"
                    >
                      보관함에서 보기
                    </Link>
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${product.title} 장바구니에서 삭제`}
                onClick={() => {
                  remove(product.id);
                  toast.success("장바구니에서 뺐어요.");
                }}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {unavailable.map((item) => (
          <Card key={item.productId} className="border-sale bg-sale-bg py-0 shadow-none">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-sale-ink">판매가 종료된 상품이에요</p>
                <p className="mt-1 text-sm text-ink-600">
                  결제 대상에서 제외했어요. 상품 번호 {item.productId}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => remove(item.productId)}>
                목록에서 지우기
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <aside className="h-fit rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-semibold">결제 금액</h2>
        {currentOwnershipState.status === "loading" ? (
          <p
            className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-text-muted"
            id="cart-ownership-status"
            role="status"
          >
            <LoaderCircle
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            보유 상품을 확인하고 있어요.
          </p>
        ) : currentOwnershipState.status === "error" ? (
          <div
            className="mt-4 rounded-lg border border-sale bg-sale-bg p-3 text-sm text-sale-ink"
            id="cart-ownership-status"
            role="alert"
          >
            <p>{currentOwnershipState.message}</p>
            <Button
              className="mt-3 w-full"
              type="button"
              variant="outline"
              onClick={() => {
                setOwnershipState({ userId: sessionId ?? "unknown", status: "loading" });
                setOwnershipRetryKey((value) => value + 1);
              }}
            >
              보유 여부 다시 확인
            </Button>
          </div>
        ) : null}
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4 text-text-muted">
            <dt>상품 정가</dt>
            <dd>{ownershipReady ? formatWon(listTotal) : "확인 필요"}</dd>
          </div>
          <div className="flex justify-between gap-4 text-sale">
            <dt>할인</dt>
            <dd>
              {ownershipReady ? `-${formatWon(savingsAmount(listTotal, payable))}` : "확인 필요"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-4 text-base font-bold text-ink-900">
            <dt>총 결제액</dt>
            <dd>{ownershipReady ? formatWon(payable) : "확인 필요"}</dd>
          </div>
        </dl>
        {!ownershipReady ? (
          <Button
            aria-describedby="cart-ownership-status"
            className="mt-5 h-12 w-full"
            type="button"
            disabled
          >
            보유 상품 확인이 필요해요
          </Button>
        ) : payableProducts.length > 0 ? (
          <Button asChild className="mt-5 h-12 w-full bg-cta text-surface hover:bg-cta-hover">
            <Link href={checkoutHref}>{payableProducts.length}개 상품 결제하기</Link>
          </Button>
        ) : (
          <Button className="mt-5 h-12 w-full" type="button" disabled>
            결제 가능한 새 상품이 없어요
          </Button>
        )}
        {owned.length > 0 ? (
          <p className="mt-3 text-xs leading-5 text-text-muted">
            보관함에 있는 상품 {owned.length}개는 결제 금액에서 제외했어요.
          </p>
        ) : null}
        {unavailable.length > 0 ? (
          <p className="mt-3 text-xs leading-5 text-text-muted">
            판매 종료 상품은 금액에 포함하지 않았어요.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
