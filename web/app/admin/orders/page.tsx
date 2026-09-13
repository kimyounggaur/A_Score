import { Suspense } from "react";
import type { Metadata } from "next";

import { OrderManager } from "@/components/admin/order-manager";

export const metadata: Metadata = { title: "주문 관리" };

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <p className="py-12 text-center text-sm text-text-muted">주문 목록을 준비하고 있습니다.</p>
      }
    >
      <OrderManager />
    </Suspense>
  );
}
