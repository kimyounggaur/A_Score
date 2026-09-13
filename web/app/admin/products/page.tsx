import { Suspense } from "react";
import type { Metadata } from "next";

import { ProductManager } from "@/components/admin/product-manager";

export const metadata: Metadata = { title: "악보 관리" };

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <p className="py-12 text-center text-sm text-text-muted">악보 목록을 준비하고 있습니다.</p>
      }
    >
      <ProductManager />
    </Suspense>
  );
}
