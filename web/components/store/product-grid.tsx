import { SearchX } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { CatalogProduct } from "@/lib/catalog/types";

export function ProductGrid({
  products,
  emptyTitle = "조건에 맞는 악보가 없어요",
  emptyDescription = "필터를 줄이거나 다른 검색어를 써보세요.",
  browserBacked = false,
}: {
  products: CatalogProduct[];
  emptyTitle?: string;
  emptyDescription?: string;
  browserBacked?: boolean;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="size-6" strokeWidth={1.5} />}
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Button asChild variant="outline">
            <Link href="/scores">필터 초기화</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard
          key={`${product.type}-${product.id}`}
          product={product}
          browserBacked={browserBacked}
        />
      ))}
    </div>
  );
}
