"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import { AccountError, AccountLoading } from "@/components/account/account-utils";
import { ProductGrid } from "@/components/store/product-grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useMounted } from "@/hooks/use-mounted";
import type { CatalogProduct } from "@/lib/catalog/types";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import { useWishlistStore } from "@/lib/stores/wishlist";

export function WishlistView() {
  const mounted = useMounted();
  const productIds = useWishlistStore((state) => state.productIds);
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mounted) return;
    let active = true;
    Promise.all(productIds.map((id) => catalogRepository.getProduct(id)))
      .then((items) => {
        if (!active) return;
        setError(null);
        setProducts(items.filter((item): item is CatalogProduct => Boolean(item)));
      })
      .catch((caught: unknown) => {
        if (active)
          setError(caught instanceof Error ? caught.message : "찜한 악보를 불러오지 못했어요.");
      });
    return () => {
      active = false;
    };
  }, [mounted, productIds]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink-900">찜한 악보</h1>
        <p className="mt-2 text-sm text-text-muted">
          카드와 상세에서 누른 하트가 이 목록에 함께 반영되고 새로고침 뒤에도 유지돼요.
        </p>
      </header>

      {error ? <AccountError message={error} /> : null}
      {!products && !error ? <AccountLoading label="찜한 악보를 불러오고 있어요." /> : null}
      {products?.length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title="아직 찜한 악보가 없어요"
          description="관심 있는 악보의 하트를 누르면 여기에서 다시 찾을 수 있어요."
          action={
            <Button asChild className="bg-cta text-surface hover:bg-cta-hover">
              <Link href="/scores">악보 둘러보기</Link>
            </Button>
          }
        />
      ) : null}
      {products && products.length > 0 ? <ProductGrid products={products} browserBacked /> : null}
    </div>
  );
}
