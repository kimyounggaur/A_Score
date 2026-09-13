"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ComingSoon } from "@/components/ui/coming-soon";
import { mockPaymentGateway } from "@/lib/payments/mock-gateway";
import { formatWon } from "@/lib/pricing";
import type { Order } from "@/lib/repositories/interfaces";
import { orderRepository } from "@/lib/repositories/order-repository";
import { useCartStore } from "@/lib/stores/cart";
import { useSessionStore } from "@/lib/stores/session";

export function CheckoutSuccess({
  orderId,
  paymentKey,
  amount,
}: {
  orderId: string;
  paymentKey: string;
  amount: number;
}) {
  const removeMany = useCartStore((state) => state.removeMany);
  const session = useSessionStore((state) => state.session);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function finalize() {
      if (!session) return;
      try {
        const existing = await orderRepository.getOrder(orderId);
        if (!existing) throw new Error("주문 정보를 찾을 수 없어요. 주문 내역을 확인해 주세요.");
        if (existing.userId !== session.id) {
          throw new Error("이 계정의 주문이 아니에요. 본인의 주문 내역에서 다시 확인해 주세요.");
        }
        if (!Number.isSafeInteger(amount) || amount < 0 || amount !== existing.cashPaid) {
          throw new Error(
            "결제 금액이 주문 금액과 달라 승인할 수 없어요. 주문 내역을 확인해 주세요.",
          );
        }
        const finalized =
          existing.status === "paid"
            ? existing
            : existing.cashPaid === 0
              ? await orderRepository.finalizeNoPaymentOrder(orderId)
              : await (async () => {
                  await mockPaymentGateway.confirmPayment(paymentKey, orderId, amount);
                  return orderRepository.finalizeOrder(orderId, paymentKey);
                })();
        if (!active) return;
        setOrder(finalized);
        removeMany(finalized.items.map((item) => item.productId));
      } catch (caught) {
        if (active)
          setError(
            caught instanceof Error
              ? caught.message
              : "결제를 확정하지 못했어요. 주문 내역을 확인해 주세요.",
          );
      }
    }
    void finalize();
    return () => {
      active = false;
    };
  }, [amount, orderId, paymentKey, removeMany, session]);

  if (error) {
    return (
      <section className="page-shell flex min-h-[65vh] items-center justify-center py-10">
        <Card className="w-full max-w-lg border-sale bg-surface text-center shadow-none">
          <CardContent className="space-y-4 py-10">
            <h1 className="font-display text-2xl font-semibold">결제를 확정하지 못했어요</h1>
            <p className="text-sm leading-6 text-sale" role="alert">
              {error}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/me/orders">주문 내역 보기</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/cart">장바구니로</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!order) {
    return (
      <div className="page-shell flex min-h-[65vh] items-center justify-center" role="status">
        <LoaderCircle className="size-6 animate-spin text-cta" aria-hidden="true" />
        <span className="ml-2 text-sm text-text-muted">결제를 안전하게 확정하고 있어요.</span>
      </div>
    );
  }

  return (
    <section className="page-shell flex min-h-[65vh] items-center justify-center py-10">
      <Card className="w-full max-w-xl border-line bg-surface text-center shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <CheckCircle2 className="size-14 text-free" strokeWidth={1.5} aria-hidden="true" />
          <div>
            <h1 className="font-display text-3xl font-semibold">
              {order.totalAmount === 0 ? "받기 완료" : "결제가 완료됐어요"}
            </h1>
            <p className="mt-2 text-sm text-text-muted">구매한 악보를 보관함에 넣었어요.</p>
          </div>
          <dl className="my-3 w-full rounded-xl bg-muted p-4 text-sm">
            <div className="flex justify-between gap-4 py-1">
              <dt className="text-ink-600">주문번호</dt>
              <dd className="font-medium">{order.orderNo}</dd>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <dt className="text-ink-600">결제 금액</dt>
              <dd className="font-medium">{formatWon(order.cashPaid)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <dt className="text-ink-600">사용 포인트</dt>
              <dd>{order.pointsUsed.toLocaleString("ko-KR")}P</dd>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <dt className="text-ink-600">적립 포인트</dt>
              <dd className="text-free">+{order.earnedPoints.toLocaleString("ko-KR")}P</dd>
            </div>
          </dl>
          <div className="flex w-full flex-col justify-center gap-2 sm:flex-row">
            <Button asChild className="bg-cta text-surface hover:bg-cta-hover">
              <Link href="/me/library">보관함에서 보기</Link>
            </Button>
            <ComingSoon label="바로 받기" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
