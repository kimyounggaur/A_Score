"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Coins, LoaderCircle, ShieldCheck } from "lucide-react";

import { formatExpiry } from "@/components/account/account-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { POINT_PACKAGES, type PointPackageId } from "@/lib/config/points";
import { REFUND_POLICY } from "@/lib/config/policy";
import { formatPoint } from "@/lib/format";
import { bonusRatePercent, formatWon } from "@/lib/pricing";
import type { PointChargeResult } from "@/lib/repositories/interfaces";
import { pointRepository } from "@/lib/repositories/point-repository";
import { settingsRepository } from "@/lib/repositories/settings-repository";
import { useSessionStore } from "@/lib/stores/session";

const paymentMethods = [
  { id: "card", label: "카드" },
  { id: "kakao-pay", label: "카카오페이" },
  { id: "naver-pay", label: "네이버페이" },
  { id: "toss", label: "토스페이" },
] as const;

export function PointChargeView() {
  const session = useSessionStore((state) => state.session);
  const [packageId, setPackageId] = useState<PointPackageId>("point-5000");
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]["id"]>("card");
  const [charging, setCharging] = useState(false);
  const [chargeEnabled, setChargeEnabled] = useState(true);
  const [result, setResult] = useState<PointChargeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedPackage = POINT_PACKAGES.find((item) => item.id === packageId) ?? POINT_PACKAGES[0];

  useEffect(() => {
    void settingsRepository
      .getSettings()
      .then((settings) => setChargeEnabled(settings.pointChargeEnabled));
  }, []);

  const charge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || charging) return;
    setCharging(true);
    setError(null);
    setResult(null);
    try {
      const nextResult = await pointRepository.charge(session.id, packageId);
      setResult(nextResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "포인트를 충전하지 못했어요.");
    } finally {
      setCharging(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-cta">모의 결제</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink-900">포인트 충전</h1>
        <p className="mt-2 text-sm text-text-muted">
          충전 금액과 보너스는 만료 기간이 다른 lot으로 나누어 적립해요.
        </p>
      </header>

      <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" onSubmit={charge}>
        <div className="space-y-5">
          <Card className="border-line bg-surface shadow-none">
            <CardHeader>
              <CardTitle className="font-display text-xl font-semibold">충전 상품</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                className="grid gap-3 sm:grid-cols-2"
                value={packageId}
                onValueChange={(value) => setPackageId(value as PointPackageId)}
              >
                {POINT_PACKAGES.map((pointPackage) => {
                  const rate = bonusRatePercent(pointPackage.paidPoints, pointPackage.bonusPoints);
                  return (
                    <Label
                      className="flex min-h-24 cursor-pointer items-start gap-3 rounded-xl border border-line p-4 hover:border-brand-400 has-[[data-checked]]:border-cta has-[[data-checked]]:bg-brand-50"
                      htmlFor={`package-${pointPackage.id}`}
                      key={pointPackage.id}
                    >
                      <RadioGroupItem
                        className="mt-1"
                        id={`package-${pointPackage.id}`}
                        value={pointPackage.id}
                      />
                      <span className="min-w-0">
                        <span className="block text-base font-bold text-ink-900">
                          {formatPoint(pointPackage.paidPoints)}
                        </span>
                        <span className="mt-1 block text-sm text-text-muted">
                          {formatWon(pointPackage.price)}
                        </span>
                        <span className="mt-2 block text-xs font-semibold text-free">
                          {pointPackage.bonusPoints > 0
                            ? `보너스 ${formatPoint(pointPackage.bonusPoints)} · ${rate}%`
                            : "보너스 없음"}
                        </span>
                      </span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="border-line bg-surface shadow-none">
            <CardHeader>
              <CardTitle className="font-display text-xl font-semibold">결제 수단</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                className="grid grid-cols-2 gap-2"
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as (typeof paymentMethods)[number]["id"])
                }
              >
                {paymentMethods.map((method) => (
                  <Label
                    className="flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 hover:bg-muted"
                    htmlFor={`charge-method-${method.id}`}
                    key={method.id}
                  >
                    <RadioGroupItem id={`charge-method-${method.id}`} value={method.id} />{" "}
                    {method.label}
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm leading-6 text-brand-800">
            <p className="font-semibold">환불 안내</p>
            <p className="mt-1">{REFUND_POLICY.summary}</p>
            <Link
              className="mt-2 inline-flex min-h-11 items-center font-semibold text-cta underline underline-offset-4"
              href="/legal/refund"
            >
              환불정책 자세히 보기
            </Link>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold">결제 요약</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-text-muted">유상 포인트</dt>
              <dd className="font-semibold">{formatPoint(selectedPackage.paidPoints)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-muted">무상 보너스</dt>
              <dd className="font-semibold text-free">
                +{formatPoint(selectedPackage.bonusPoints)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-4 text-lg font-bold">
              <dt>결제 금액</dt>
              <dd>{formatWon(selectedPackage.price)}</dd>
            </div>
          </dl>
          {error ? (
            <p className="mt-4 rounded-lg bg-sale-bg p-3 text-sm text-sale-ink" role="alert">
              {error}
            </p>
          ) : null}
          {!chargeEnabled ? (
            <p className="mt-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-800" role="status">
              관리자가 포인트 충전을 잠시 꺼 두었어요. 포인트 내역에서 보유 잔액을 확인해 주세요.
            </p>
          ) : null}
          <Button
            className="mt-5 h-12 w-full bg-cta text-surface hover:bg-cta-hover"
            type="submit"
            disabled={!session || charging || !chargeEnabled}
          >
            {charging ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <ShieldCheck aria-hidden="true" />
            )}
            {charging
              ? "충전 중이에요"
              : chargeEnabled
                ? `${formatWon(selectedPackage.price)} 모의 결제`
                : "포인트 충전 중지됨"}
          </Button>
          <p className="mt-3 text-center text-xs leading-5 text-text-muted">
            UI 데모이며 실제 승인이나 청구는 일어나지 않아요. 선택 수단:{" "}
            {paymentMethods.find((method) => method.id === paymentMethod)?.label}
          </p>
        </aside>
      </form>

      {result ? (
        <Card className="border-free/30 bg-free-bg shadow-none" role="status">
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-free" aria-hidden="true" />
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">
                  모의 충전이 반영됐어요
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  유상과 무상 포인트를 별도 lot으로 저장했어요.
                </p>
              </div>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-surface p-3">
                <dt className="text-xs text-text-muted">유상 lot</dt>
                <dd className="mt-1 font-bold">{formatPoint(result.paidLot.remaining)}</dd>
                <dd className="mt-1 text-xs text-text-muted">
                  {formatExpiry(result.paidLot.expiresAt)}
                </dd>
              </div>
              <div className="rounded-lg bg-surface p-3">
                <dt className="text-xs text-text-muted">무상 보너스 lot</dt>
                <dd className="mt-1 font-bold">
                  {result.bonusLot ? formatPoint(result.bonusLot.remaining) : "없음"}
                </dd>
                {result.bonusLot ? (
                  <dd className="mt-1 text-xs text-text-muted">
                    {formatExpiry(result.bonusLot.expiresAt)}
                  </dd>
                ) : null}
              </div>
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-free/20 pt-4">
              <span className="inline-flex items-center gap-2 font-bold text-free">
                <Coins aria-hidden="true" /> 총 잔액 {formatPoint(result.balance.total)}
              </span>
              <Button asChild variant="outline">
                <Link href="/me/points">포인트 내역 보기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
