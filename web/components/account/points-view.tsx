"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, History } from "lucide-react";

import {
  AccountError,
  AccountLoading,
  formatDateTime,
  formatExpiry,
  formatSignedPoint,
} from "@/components/account/account-utils";
import { useListQueryNavigation } from "@/components/navigation/use-list-query-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPoint } from "@/lib/format";
import { parsePointHistoryListQuery, type PointHistoryFilter } from "@/lib/navigation/list-query";
import {
  earliestUsableExpiry,
  expiringWithin,
  sumRemaining,
  usableLots,
} from "@/lib/points/ledger";
import type {
  PointBalance,
  PointLot,
  PointTransaction,
  PointTransactionType,
} from "@/lib/points/types";
import { pointRepository } from "@/lib/repositories/point-repository";
import { useSessionStore } from "@/lib/stores/session";

const PAGE_SIZE = 10;

const filters: readonly { id: PointHistoryFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "charge", label: "충전" },
  { id: "earn", label: "적립" },
  { id: "spend", label: "사용" },
  { id: "expire", label: "만료" },
  { id: "refund", label: "환불" },
];

const transactionCopy: Record<PointTransactionType, string> = {
  charge: "충전",
  bonus: "충전 보너스",
  earn: "구매 적립",
  spend: "사용",
  expire: "만료",
  refund: "환불 정산",
};

function matchesFilter(transaction: PointTransaction, filter: PointHistoryFilter) {
  if (filter === "all") return true;
  if (filter === "earn") return transaction.type === "earn" || transaction.type === "bonus";
  return transaction.type === filter;
}

export function PointsView() {
  const { searchParams, replaceFilters, pushPage } = useListQueryNavigation();
  const { filter, sort, page } = parsePointHistoryListQuery(searchParams);
  const session = useSessionStore((state) => state.session);
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [lots, setLots] = useState<PointLot[] | null>(null);
  const [history, setHistory] = useState<PointTransaction[] | null>(null);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const userId = session.id;
    let active = true;
    Promise.all([
      pointRepository.getBalance(userId),
      pointRepository.getLots(userId),
      pointRepository.listHistory(userId),
    ])
      .then(([nextBalance, nextLots, nextHistory]) => {
        if (!active) return;
        setBalance(nextBalance);
        setLots(nextLots);
        setHistory(nextHistory);
        setLoadedAt(new Date().getTime());
      })
      .catch((caught: unknown) => {
        if (active)
          setError(caught instanceof Error ? caught.message : "포인트 정보를 불러오지 못했어요.");
      });
    return () => {
      active = false;
    };
  }, [session]);

  const filteredHistory = useMemo(() => {
    const filtered = (history ?? []).filter((transaction) => matchesFilter(transaction, filter));
    return filtered.toSorted((a, b) => {
      if (sort === "oldest") return Date.parse(a.createdAt) - Date.parse(b.createdAt);
      if (sort === "amount-desc") return Math.abs(b.amount) - Math.abs(a.amount);
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }, [filter, history, sort]);
  const pageCount = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleHistory = filteredHistory.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const expiringLots = lots ? expiringWithin(lots, 30) : [];
  const expiringTotal = sumRemaining(expiringLots);
  const loadedDate = loadedAt === null ? null : new Date(loadedAt);
  const paidExpiry = lots && loadedDate ? earliestUsableExpiry(lots, "paid", loadedDate) : null;
  const bonusExpiry = lots && loadedDate ? earliestUsableExpiry(lots, "bonus", loadedDate) : null;
  const activeLots = lots && loadedDate ? usableLots(lots, loadedDate) : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900">포인트</h1>
          <p className="mt-2 text-sm text-text-muted">
            유상·무상 잔액과 만료일, 이용 내역을 구분해 확인해요.
          </p>
        </div>
        <Button asChild className="self-start bg-cta text-surface hover:bg-cta-hover">
          <Link href="/points/charge">포인트 충전</Link>
        </Button>
      </header>

      {error ? <AccountError message={error} /> : null}
      {(!balance || !lots || !history) && !error ? (
        <AccountLoading label="포인트 정보를 불러오고 있어요." />
      ) : null}

      {balance && lots && history ? (
        <>
          {expiringTotal > 0 ? (
            <div
              className="flex items-start gap-3 rounded-xl border border-sale/20 bg-sale-bg p-4 text-sm text-sale-ink"
              role="status"
            >
              <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold">30일 안에 {formatPoint(expiringTotal)}가 만료돼요.</p>
                <p className="mt-1 text-xs leading-5">
                  가장 가까운 만료일부터 사용하는 것이 좋아요.
                </p>
              </div>
            </div>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-3" aria-label="포인트 잔액">
            <Card className="border-line bg-point-bg shadow-none">
              <CardContent>
                <p className="text-sm font-medium text-point-ink">총 사용 가능</p>
                <p className="mt-2 text-2xl font-bold text-point-ink">
                  {formatPoint(balance.total)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-line bg-surface shadow-none">
              <CardContent>
                <p className="text-sm font-medium text-text-muted">유상 포인트</p>
                <p className="mt-2 text-2xl font-bold text-ink-900">{formatPoint(balance.paid)}</p>
                <p className="mt-2 text-xs text-text-muted">
                  {paidExpiry ? `가장 가까운 ${formatExpiry(paidExpiry)}` : "만료 예정 lot 없음"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-line bg-surface shadow-none">
              <CardContent>
                <p className="text-sm font-medium text-text-muted">무상 포인트</p>
                <p className="mt-2 text-2xl font-bold text-ink-900">{formatPoint(balance.bonus)}</p>
                <p className="mt-2 text-xs text-text-muted">
                  {bonusExpiry ? `가장 가까운 ${formatExpiry(bonusExpiry)}` : "만료 예정 lot 없음"}
                </p>
              </CardContent>
            </Card>
          </section>

          <Card className="border-line bg-surface shadow-none">
            <CardHeader>
              <CardTitle className="font-display text-xl font-semibold">보유 포인트 lot</CardTitle>
            </CardHeader>
            <CardContent>
              {activeLots.length === 0 ? (
                <p className="py-5 text-center text-sm text-text-muted">
                  현재 사용할 수 있는 포인트가 없어요.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {activeLots.map((lot) => (
                    <li
                      className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      key={lot.id}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={lot.bucket === "paid" ? "bundle" : "free"}>
                          {lot.bucket === "paid" ? "유상" : "무상"}
                        </Badge>
                        <span className="font-semibold">{formatPoint(lot.remaining)}</span>
                      </div>
                      <span className="text-xs text-text-muted">{formatExpiry(lot.expiresAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <section aria-labelledby="point-history-heading">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold" id="point-history-heading">
                  포인트 내역
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  충전 보너스는 무상 적립으로 따로 기록돼요.
                </p>
              </div>
              <div className="flex max-w-full flex-col gap-2 sm:flex-row sm:items-center">
                <div
                  className="flex max-w-full gap-1 overflow-x-auto pb-1"
                  role="group"
                  aria-label="포인트 내역 필터"
                >
                  {filters.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant={filter === item.id ? "default" : "outline"}
                      aria-pressed={filter === item.id}
                      onClick={() => replaceFilters({ filter: item.id })}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <select
                  className="min-h-11 rounded-lg border border-input bg-surface px-3 text-sm"
                  aria-label="포인트 내역 정렬"
                  value={sort}
                  onChange={(event) => replaceFilters({ sort: event.target.value })}
                >
                  <option value="newest">최신순</option>
                  <option value="oldest">오래된순</option>
                  <option value="amount-desc">금액 큰순</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              {filteredHistory.length === 0 ? (
                <EmptyState
                  icon={<History />}
                  title="표시할 포인트 내역이 없어요"
                  description="선택한 유형의 충전·적립·사용 기록이 아직 없어요."
                  action={
                    <Button asChild variant="outline">
                      <Link href="/points/charge">충전 상품 보기</Link>
                    </Button>
                  }
                />
              ) : (
                <Card className="border-line bg-surface shadow-none">
                  <CardContent>
                    <ul className="divide-y divide-line">
                      {visibleHistory.map((transaction) => (
                        <li
                          className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                          key={transaction.id}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink-900">
                                {transactionCopy[transaction.type]}
                              </span>
                              {transaction.bucket ? (
                                <Badge variant="outline">
                                  {transaction.bucket === "paid" ? "유상" : "무상"}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-text-muted">
                              {formatDateTime(transaction.createdAt)}
                              {transaction.referenceId ? ` · ${transaction.referenceId}` : ""}
                            </p>
                          </div>
                          <span
                            className={`font-bold ${transaction.amount < 0 ? "text-sale" : "text-free"}`}
                          >
                            {formatSignedPoint(transaction.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
            {filteredHistory.length > PAGE_SIZE ? (
              <nav
                className="mt-4 flex items-center justify-center gap-3"
                aria-label="포인트 내역 페이지"
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={safePage <= 1}
                  onClick={() => pushPage(Math.max(1, safePage - 1))}
                >
                  이전
                </Button>
                <span className="text-sm text-text-muted" aria-live="polite">
                  {safePage} / {pageCount} 페이지
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={safePage >= pageCount}
                  onClick={() => pushPage(Math.min(pageCount, safePage + 1))}
                >
                  다음
                </Button>
              </nav>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
