import { Suspense } from "react";
import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import type { CatalogProduct } from "@/lib/catalog/types";
import { catalogRepository } from "@/lib/repositories/catalog-repository";

export const metadata: Metadata = {
  title: "결제",
  description: "상품과 포인트, 결제수단을 확인하고 디지털 악보 주문을 진행해요.",
  robots: { index: false, follow: false },
};

type CheckoutPageProps = {
  searchParams: Promise<{ items?: string | string[] }>;
};

function parseItemIds(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map(Number)
        .filter((id) => Number.isSafeInteger(id) && id > 0),
    ),
  ];
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const ids = parseItemIds(params.items);
  const resolved = await Promise.all(ids.map((id) => catalogRepository.getProduct(id)));
  const products = resolved.filter((product): product is CatalogProduct => Boolean(product));

  return (
    <RequireAuth>
      <section className="page-shell py-8 md:py-12">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-semibold text-ink-900">주문 확인</h1>
          <p className="mt-2 text-sm text-text-muted">
            상품 가격과 제공 조건을 마지막으로 확인해 주세요.
          </p>
        </header>
        <Suspense
          fallback={
            <p className="py-12 text-center text-sm text-text-muted">주문서를 준비하고 있어요.</p>
          }
        >
          <CheckoutForm requestedIds={ids} products={products} />
        </Suspense>
      </section>
    </RequireAuth>
  );
}
