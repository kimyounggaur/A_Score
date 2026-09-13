import type { Metadata } from "next";

import { OrderDetail } from "@/components/account/order-detail";

export const metadata: Metadata = {
  title: "주문 상세",
  description: "주문 상품과 결제 처리 정보를 확인해요.",
};

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  return <OrderDetail orderId={id} />;
}
