import type { Metadata } from "next";

import { OrderList } from "@/components/account/order-list";

export const metadata: Metadata = {
  title: "주문 내역",
  description: "ScoreStore 주문 상태와 결제 내역을 확인해요.",
};

export default function OrdersPage() {
  return <OrderList />;
}
