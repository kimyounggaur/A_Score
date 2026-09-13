"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, LoaderCircle, ShieldCheck } from "lucide-react";

import { PriceTag } from "@/components/store/price-tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { hasBrowserCatalogOverride } from "@/lib/catalog/browser-overrides";
import type { CatalogProduct } from "@/lib/catalog/types";
import { REFUND_POLICY } from "@/lib/config/policy";
import { EARN_RATE_PERCENT } from "@/lib/config/points";
import { PaymentGatewayError } from "@/lib/payments/gateway";
import { mockPaymentGateway } from "@/lib/payments/mock-gateway";
import {
  cashAfterPoints,
  clampPoints,
  earnPoints,
  formatWon,
  maxUsablePoints,
  savingsAmount,
  sumList,
  sumPayable,
} from "@/lib/pricing";
import { RepositoryError, type Order, type PaymentMethod } from "@/lib/repositories/interfaces";
import { orderRepository } from "@/lib/repositories/order-repository";
import { pointRepository } from "@/lib/repositories/point-repository";
import { settingsRepository } from "@/lib/repositories/settings-repository";
import { expiringWithin, sumRemaining } from "@/lib/points/ledger";
import { useSessionStore } from "@/lib/stores/session";

const paymentMethods = [
  { id: "card", label: "카드" },
  { id: "kakao-pay", label: "카카오페이" },
  { id: "naver-pay", label: "네이버페이" },
  { id: "toss", label: "토스" },
] as const satisfies readonly { id: PaymentMethod; label: string }[];

export function CheckoutForm({
  products: initialProducts,
  requestedIds,
}: {
  products: CatalogProduct[];
  requestedIds: number[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSessionStore((state) => state.session);
  const [products, setProducts] = useState(initialProducts);
  const [priceNotice, setPriceNotice] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [balanceLoaded, setBalanceLoaded] = useState(false);
  const [expiring, setExpiring] = useState(0);
  const [earnRatePercent, setEarnRatePercent] = useState(EARN_RATE_PERCENT);
  const [pointsInput, setPointsInput] = useState("0");
  const [correction, setCorrection] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [consent, setConsent] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoPointApplied = useRef(false);

  const listAmount = sumList(products);
  const totalAmount = sumPayable(products);
  const pointsUsed = clampPoints(pointsInput, balance, totalAmount);
  const cashPaid = cashAfterPoints(totalAmount, pointsUsed);
  const earned = earnPoints(cashPaid, earnRatePercent);
  const missingCount = Math.max(0, requestedIds.length - products.length);

  useEffect(() => {
    if (!hasBrowserCatalogOverride()) return;
    let active = true;
    void import("@/lib/repositories/catalog-repository")
      .then(({ catalogRepository }) =>
        Promise.all(requestedIds.map((id) => catalogRepository.getProduct(id))),
      )
      .then((resolved) => {
        if (!active) return;
        const currentProducts = resolved.filter((product): product is CatalogProduct =>
          Boolean(product),
        );
        const initialAmount = sumPayable(initialProducts);
        const currentAmount = sumPayable(currentProducts);
        if (currentAmount !== initialAmount || currentProducts.length !== initialProducts.length) {
          setPriceNotice(
            "가격 또는 판매 상태가 변경되었어요. 아래의 최신 결제 금액을 확인해 주세요.",
          );
        }
        setProducts(currentProducts);
      });
    return () => {
      active = false;
    };
  }, [initialProducts, requestedIds]);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      pointRepository.getBalance(session.id),
      pointRepository.getLots(session.id),
      settingsRepository.getSettings(),
    ]).then(([nextBalance, lots, settings]) => {
      setBalance(nextBalance.total);
      setBalanceLoaded(true);
      setExpiring(sumRemaining(expiringWithin(lots, 30)));
      setEarnRatePercent(settings.earnRatePercent);
    });
  }, [session]);

  useEffect(() => {
    if (!balanceLoaded || autoPointApplied.current || searchParams.get("points") !== "all") return;
    setPointsInput(String(clampPoints(balance, balance, totalAmount)));
    autoPointApplied.current = true;
  }, [balance, balanceLoaded, searchParams, totalAmount]);

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<AlertCircle />}
        title="결제할 상품을 찾을 수 없어요"
        description="판매가 종료됐거나 주소가 올바르지 않아요. 장바구니에서 상품을 다시 골라 주세요."
        action={
          <Button asChild>
            <Link href="/cart">장바구니로 돌아가기</Link>
          </Button>
        }
      />
    );
  }

  const correctPoints = (raw: string) => {
    const corrected = clampPoints(raw, balance, totalAmount);
    setPointsInput(String(corrected));
    const parsed = Math.floor(Number(raw));
    setCorrection(
      Number.isFinite(parsed) && parsed > corrected
        ? `최대 ${corrected.toLocaleString("ko-KR")}P까지 쓸 수 있어요.`
        : null,
    );
  };

  const submitOrder = async () => {
    if (!session || !consent || processing) return;
    setProcessing(true);
    setError(null);
    let order: Order | null = null;
    try {
      order = await orderRepository.createOrder({
        userId: session.id,
        items: products.map((product) => ({ productId: product.id, type: product.type })),
        clientAmount: totalAmount,
        pointsToUse: pointsUsed,
        paymentMethod: totalAmount === 0 ? "free" : cashPaid === 0 ? "points" : paymentMethod,
      });
      if (order.cashPaid === 0) {
        const query = new URLSearchParams({ orderId: order.id, amount: "0" });
        router.push(`/checkout/success?${query.toString()}`);
        return;
      }
      const payment = await mockPaymentGateway.requestPayment(order, {
        mockFail: searchParams.get("mockFail") === "1",
      });
      router.push(payment.redirectUrl);
    } catch (caught) {
      if (caught instanceof PaymentGatewayError && order) {
        await orderRepository.markFailed(order.id, caught.code);
        const query = new URLSearchParams({
          code: caught.code,
          message: caught.message,
          orderId: order.id,
        });
        router.push(`/checkout/fail?${query.toString()}`);
        return;
      }
      const message =
        caught instanceof Error
          ? caught.message
          : "주문을 만들지 못했어요. 잠시 후 다시 시도해 주세요.";
      setError(message);
      if (caught instanceof RepositoryError && caught.code === "AMOUNT_MISMATCH") router.refresh();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        {priceNotice ? (
          <p
            className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800"
            role="status"
          >
            {priceNotice}
          </p>
        ) : null}
        <Card className="border-line bg-surface shadow-none">
          <CardHeader>
            <CardTitle>주문 상품</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {products.map((product) => (
              <div
                className="flex items-start justify-between gap-4 border-b border-line pb-4 last:border-0 last:pb-0"
                key={product.id}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900">{product.title}</p>
                  {product.artist ? (
                    <p className="mt-1 text-sm text-text-muted">{product.artist}</p>
                  ) : null}
                </div>
                <PriceTag
                  className="shrink-0"
                  listPrice={product.listPrice}
                  salePrice={product.salePrice}
                  saleEndsAt={product.saleEndsAt}
                  size="sm"
                />
              </div>
            ))}
            {missingCount > 0 ? (
              <p className="rounded-lg bg-sale-bg p-3 text-sm text-sale-ink">
                판매가 종료된 상품 {missingCount}개는 결제에서 제외했어요.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-line bg-surface shadow-none">
          <CardHeader>
            <CardTitle>포인트 사용</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1">
                <Label className="sr-only" htmlFor="points-use">
                  사용할 포인트
                </Label>
                <Input
                  id="points-use"
                  inputMode="numeric"
                  min={0}
                  max={maxUsablePoints(balance, totalAmount)}
                  value={pointsInput}
                  onChange={(event) => correctPoints(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => correctPoints(String(maxUsablePoints(balance, totalAmount)))}
              >
                전액 사용
              </Button>
            </div>
            <p className="text-sm text-text-muted">사용 가능 {balance.toLocaleString("ko-KR")}P</p>
            {correction ? (
              <p className="text-sm font-medium text-brand-800" role="status">
                {correction}
              </p>
            ) : null}
            {expiring > 0 ? (
              <p className="text-sm text-sale">
                {expiring.toLocaleString("ko-KR")}P가 30일 안에 만료돼요.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {cashPaid > 0 ? (
          <Card className="border-line bg-surface shadow-none">
            <CardHeader>
              <CardTitle>결제 수단</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                className="grid grid-cols-2 gap-2"
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                {paymentMethods.map((method) => (
                  <Label
                    key={method.id}
                    className="flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 hover:bg-muted"
                    htmlFor={`method-${method.id}`}
                  >
                    <RadioGroupItem id={`method-${method.id}`} value={method.id} /> {method.label}
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-line bg-surface shadow-none">
          <CardContent className="space-y-3">
            <Label
              className="flex cursor-pointer items-start gap-3 leading-6"
              htmlFor="refund-consent"
            >
              <Checkbox
                id="refund-consent"
                className="mt-1"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
              />
              <span>
                디지털 콘텐츠 제공이 시작된 뒤에는 청약철회가 제한될 수 있다는 내용을 확인했어요.{" "}
                <Link
                  className="inline-flex min-h-11 items-center px-1 font-semibold text-cta underline"
                  href="/legal/refund"
                >
                  환불정책 보기
                </Link>
              </span>
            </Label>
            <p className="text-xs text-text-muted">{REFUND_POLICY.summary}</p>
          </CardContent>
        </Card>
      </div>

      <aside className="h-fit rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-semibold">최종 결제</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between text-text-muted">
            <dt>정가 합계</dt>
            <dd>{formatWon(listAmount)}</dd>
          </div>
          <div className="flex justify-between text-sale">
            <dt>상품 할인</dt>
            <dd>-{formatWon(savingsAmount(listAmount, totalAmount))}</dd>
          </div>
          <div className="flex justify-between text-text-muted">
            <dt>포인트</dt>
            <dd>-{pointsUsed.toLocaleString("ko-KR")}P</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-lg font-bold">
            <dt>결제 금액</dt>
            <dd>{formatWon(cashPaid)}</dd>
          </div>
          <div className="flex justify-between text-sm text-free">
            <dt>결제 후 적립</dt>
            <dd>+{earned.toLocaleString("ko-KR")}P</dd>
          </div>
        </dl>
        {error ? (
          <p className="mt-4 rounded-lg bg-sale-bg p-3 text-sm text-sale-ink" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          className="mt-5 h-12 w-full bg-cta text-surface hover:bg-cta-hover"
          type="button"
          disabled={!consent || processing}
          onClick={submitOrder}
        >
          {processing ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck aria-hidden="true" />
          )}
          {processing
            ? "처리 중이에요"
            : totalAmount === 0
              ? "무료로 받기"
              : cashPaid === 0
                ? "포인트로 결제"
                : `${formatWon(cashPaid)} 결제하기`}
        </Button>
        <p className="mt-3 text-center text-xs leading-5 text-text-muted">
          UI 데모예요. 실제 결제·다운로드는 되지 않아요.
        </p>
      </aside>
    </div>
  );
}
