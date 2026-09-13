import type { Metadata } from "next";

import { CartView } from "@/components/checkout/cart-view";
import { catalogRepository } from "@/lib/repositories/catalog-repository";

export const metadata: Metadata = {
  title: "장바구니",
  description: "담아 둔 디지털 악보와 현재 결제 금액을 확인해요.",
  alternates: { canonical: "/cart" },
};

async function listAllProducts() {
  const first = await catalogRepository.listProducts({ page: 1 });
  const remaining = await Promise.all(
    Array.from({ length: Math.max(0, first.pageCount - 1) }, (_, index) =>
      catalogRepository.listProducts({ page: index + 2 }),
    ),
  );
  return [first, ...remaining].flatMap((result) => result.items);
}

export default async function CartPage() {
  const products = await listAllProducts();
  return (
    <section className="page-shell py-8 md:py-12">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink-900">장바구니</h1>
        <p className="mt-2 text-sm text-text-muted">
          가격은 결제 직전에 카탈로그 기준으로 다시 확인해요.
        </p>
      </header>
      <CartView products={products} />
    </section>
  );
}
