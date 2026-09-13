"use client";

import dynamic from "next/dynamic";

import type { CatalogProduct } from "@/lib/catalog/types";

function PurchasePanelSkeleton() {
  return (
    <aside
      className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1px)] z-30 border-t border-line bg-surface/95 p-3 shadow-lg backdrop-blur md:bottom-0 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:z-10 lg:rounded-2xl lg:border lg:p-5 lg:shadow-sm"
      aria-label="구매 옵션"
      aria-busy="true"
    >
      <div className="page-shell grid grid-cols-[2.75rem_2.75rem_minmax(0,1fr)] items-center gap-2 lg:flex lg:w-auto lg:flex-col lg:items-stretch">
        <span className="col-span-3 h-7 w-28 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
        <span className="size-11 animate-pulse rounded-lg bg-muted motion-reduce:animate-none lg:w-full" />
        <span className="size-11 animate-pulse rounded-lg bg-muted motion-reduce:animate-none lg:w-full" />
        <span className="h-11 animate-pulse rounded-lg bg-muted motion-reduce:animate-none lg:w-full" />
        <span className="sr-only">구매 옵션을 불러오고 있어요.</span>
      </div>
    </aside>
  );
}

const PurchasePanel = dynamic(
  () => import("@/components/store/purchase-panel").then((module) => module.PurchasePanel),
  { ssr: false, loading: PurchasePanelSkeleton },
);

export function DeferredPurchasePanel({ product }: { product: CatalogProduct }) {
  return <PurchasePanel product={product} />;
}
