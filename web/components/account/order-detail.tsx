"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, FileMusic, ListChecks } from "lucide-react";

import {
  AccountError,
  AccountLoading,
  formatDateTime,
  OrderStatusBadge,
  paymentMethodLabel,
} from "@/components/account/account-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getProductPath } from "@/lib/catalog/types";
import { formatPoint } from "@/lib/format";
import { formatWon } from "@/lib/pricing";
import type { Order } from "@/lib/repositories/interfaces";
import { orderRepository } from "@/lib/repositories/order-repository";
import { useSessionStore } from "@/lib/stores/session";

export function OrderDetail({ orderId }: { orderId: string }) {
  const session = useSessionStore((state) => state.session);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    orderRepository
      .getOrder(orderId)
      .then((item) => {
        if (!active) return;
        setOrder(item?.userId === session.id ? item : null);
      })
      .catch((caught: unknown) => {
        if (active)
          setError(caught instanceof Error ? caught.message : "주문 상세를 불러오지 못했어요.");
      });
    return () => {
      active = false;
    };
  }, [orderId, session]);

  if (error) return <AccountError message={error} />;
  if (order === undefined) return <AccountLoading label="주문 상세를 불러오고 있어요." />;

  if (!order) {
    return (
      <EmptyState
        icon={<ListChecks />}
        title="주문을 찾을 수 없어요"
        description="현재 계정의 주문이 아니거나 주문 정보가 사라졌어요."
        action={
          <Button asChild variant="outline">
            <Link href="/me/orders">주문 내역으로</Link>
          </Button>
        }
      />
    );
  }

  const completedAt = order.finalizedAt ?? order.createdAt;

  return (
    <div className="space-y-6">
      <header>
        <Link
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-cta hover:text-cta-hover"
          href="/me/orders"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> 주문 내역
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-ink-900">주문 상세</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-2 break-all text-sm text-text-muted">주문번호 {order.orderNo}</p>
      </header>

      <Card className="border-line bg-surface shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-xl font-semibold">주문 상품</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item) => (
            <article
              className="flex flex-col gap-3 border-b border-line pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center"
              key={`${item.type}-${item.productId}`}
            >
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-cta"
                aria-hidden="true"
              >
                <FileMusic />
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  className="inline-flex min-h-11 min-w-11 items-center font-bold text-ink-900 hover:text-cta"
                  href={getProductPath(
                    { id: item.productId, type: item.type },
                    { browserBacked: true },
                  )}
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-text-muted">
                  상품 결제액 {formatWon(item.paidPrice)}
                </p>
              </div>
              {order.status === "paid" ? (
                <Button asChild variant="outline">
                  <Link href={`/me/library#product-${item.productId}`}>보관함에서 보기</Link>
                </Button>
              ) : null}
            </article>
          ))}
        </CardContent>
      </Card>

      <Card className="border-line bg-surface shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-xl font-semibold">결제 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">상품 금액</dt>
              <dd>{formatWon(order.listAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">할인 후 금액</dt>
              <dd>{formatWon(order.totalAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">사용 포인트</dt>
              <dd>-{formatPoint(order.pointsUsed)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-3 text-base font-bold">
              <dt>실제 결제</dt>
              <dd>{formatWon(order.cashPaid)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-free">
              <dt>적립 포인트</dt>
              <dd>+{formatPoint(order.earnedPoints)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="border-line bg-surface shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-xl font-semibold">처리 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-muted">결제 수단</dt>
              <dd className="mt-1 font-medium">{paymentMethodLabel(order.paymentMethod)}</dd>
            </div>
            <div>
              <dt className="text-text-muted">주문 일시</dt>
              <dd className="mt-1 font-medium">{formatDateTime(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-text-muted">처리 일시</dt>
              <dd className="mt-1 font-medium">{formatDateTime(completedAt)}</dd>
            </div>
            {order.failureCode ? (
              <div>
                <dt className="text-text-muted">실패 코드</dt>
                <dd className="mt-1 font-medium text-sale">{order.failureCode}</dd>
              </div>
            ) : null}
            {order.refundReason ? (
              <div>
                <dt className="text-text-muted">환불 사유</dt>
                <dd className="mt-1 font-medium">{order.refundReason}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
