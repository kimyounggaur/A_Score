"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListChecks } from "lucide-react";

import {
  AccountError,
  AccountLoading,
  formatDateTime,
  OrderStatusBadge,
} from "@/components/account/account-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPoint } from "@/lib/format";
import { formatWon } from "@/lib/pricing";
import type { Order } from "@/lib/repositories/interfaces";
import { orderRepository } from "@/lib/repositories/order-repository";
import { useSessionStore } from "@/lib/stores/session";

export function OrderList() {
  const session = useSessionStore((state) => state.session);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    orderRepository
      .listOrders(session.id)
      .then((items) => {
        if (active) setOrders(items);
      })
      .catch((caught: unknown) => {
        if (active)
          setError(caught instanceof Error ? caught.message : "주문 내역을 불러오지 못했어요.");
      });
    return () => {
      active = false;
    };
  }, [session]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink-900">주문 내역</h1>
        <p className="mt-2 text-sm text-text-muted">
          결제 완료, 실패, 취소, 환불 상태를 주문별로 확인해요.
        </p>
      </header>

      {error ? <AccountError message={error} /> : null}
      {!orders && !error ? <AccountLoading label="주문 내역을 불러오고 있어요." /> : null}
      {orders?.length === 0 ? (
        <EmptyState
          icon={<ListChecks />}
          title="아직 주문 내역이 없어요"
          description="연주하고 싶은 악보를 찾아 첫 주문을 시작해 보세요."
          action={
            <Button asChild className="bg-cta text-surface hover:bg-cta-hover">
              <Link href="/scores">악보 둘러보기</Link>
            </Button>
          }
        />
      ) : null}

      {orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card className="border-line bg-surface shadow-none" key={order.id}>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-text-muted">{formatDateTime(order.createdAt)}</p>
                    <p className="mt-1 font-semibold text-ink-900">주문번호 {order.orderNo}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div>
                  <p className="font-bold text-ink-900">{order.items[0]?.title ?? "주문 상품"}</p>
                  {order.items.length > 1 ? (
                    <p className="mt-1 text-sm text-text-muted">외 {order.items.length - 1}개</p>
                  ) : null}
                </div>
                <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="text-text-muted">결제 금액</dt>
                    <dd className="font-semibold">{formatWon(order.cashPaid)}</dd>
                  </div>
                  {order.pointsUsed > 0 ? (
                    <div className="flex gap-2">
                      <dt className="text-text-muted">사용 포인트</dt>
                      <dd>{formatPoint(order.pointsUsed)}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                  <Button asChild variant="outline">
                    <Link href={`/me/orders/${encodeURIComponent(order.id)}`}>상세 보기</Link>
                  </Button>
                  {order.status === "paid" ? (
                    <Button asChild variant="ghost">
                      <Link href="/me/library">보관함 보기</Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
