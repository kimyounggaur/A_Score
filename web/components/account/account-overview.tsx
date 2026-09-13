"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronRight,
  Coins,
  Heart,
  LibraryBig,
  ListChecks,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import { AccountError, AccountLoading } from "@/components/account/account-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatPoint } from "@/lib/format";
import { libraryRepository } from "@/lib/repositories/library-repository";
import { pointRepository } from "@/lib/repositories/point-repository";
import { useSessionStore } from "@/lib/stores/session";
import { useWishlistStore } from "@/lib/stores/wishlist";

type Summary = {
  totalPoints: number;
  paidPoints: number;
  bonusPoints: number;
  libraryCount: number;
};

const shortcuts = [
  { href: "/me/library", label: "보관함", description: "구매한 악보를 확인해요", icon: LibraryBig },
  {
    href: "/me/orders",
    label: "주문 내역",
    description: "결제 상태와 상세를 봐요",
    icon: ListChecks,
  },
  { href: "/me/points", label: "포인트", description: "잔액과 사용 내역을 봐요", icon: Coins },
  { href: "/me/wishlist", label: "찜", description: "저장한 악보를 모아 봐요", icon: Heart },
  { href: "/notifications", label: "알림", description: "새 소식을 확인해요", icon: Bell },
] as const;

export function AccountOverview() {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const signOut = useSessionStore((state) => state.signOut);
  const wishlistCount = useWishlistStore((state) => state.productIds.length);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    Promise.all([pointRepository.getBalance(session.id), libraryRepository.listLibrary(session.id)])
      .then(([balance, library]) => {
        if (!active) return;
        setSummary({
          totalPoints: balance.total,
          paidPoints: balance.paid,
          bonusPoints: balance.bonus,
          libraryCount: library.length,
        });
      })
      .catch((caught: unknown) => {
        if (active)
          setError(caught instanceof Error ? caught.message : "내 정보를 불러오지 못했어요.");
      });
    return () => {
      active = false;
    };
  }, [session]);

  if (!session) return null;

  const logout = () => {
    signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-cta">내 계정</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink-900">마이페이지</h1>
        <p className="mt-2 text-sm text-text-muted">
          보관한 악보와 주문, 포인트를 한곳에서 관리해요.
        </p>
      </header>

      <Card className="border-line bg-surface shadow-none">
        <CardContent className="grid gap-5 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-ink-900">{session.name}</h2>
            <p className="mt-1 text-sm text-text-muted">{session.email}</p>
            <p className="mt-2 text-xs text-text-muted">가입일 {formatDate(session.joinedAt)}</p>
          </div>
          <Button
            className="justify-self-start sm:justify-self-end"
            type="button"
            variant="outline"
            onClick={logout}
          >
            <LogOut aria-hidden="true" /> 로그아웃
          </Button>
        </CardContent>
      </Card>

      {error ? <AccountError message={error} /> : null}
      {!summary && !error ? (
        <AccountLoading />
      ) : summary ? (
        <section className="grid gap-3 sm:grid-cols-3" aria-label="내 활동 요약">
          <Link
            className="rounded-xl border border-line bg-point-bg p-5 hover:border-brand-400"
            href="/me/points"
          >
            <p className="text-sm font-medium text-point-ink">사용 가능 포인트</p>
            <p className="mt-2 text-2xl font-bold text-point-ink">
              {formatPoint(summary.totalPoints)}
            </p>
            <p className="mt-1 text-xs text-point-ink/80">
              유상 {formatPoint(summary.paidPoints)} · 무상 {formatPoint(summary.bonusPoints)}
            </p>
          </Link>
          <Link
            className="rounded-xl border border-line bg-surface p-5 hover:border-brand-400"
            href="/me/library"
          >
            <p className="text-sm font-medium text-text-muted">보관함</p>
            <p className="mt-2 text-2xl font-bold text-ink-900">
              {summary.libraryCount.toLocaleString("ko-KR")}개
            </p>
          </Link>
          <Link
            className="rounded-xl border border-line bg-surface p-5 hover:border-brand-400"
            href="/me/wishlist"
          >
            <p className="text-sm font-medium text-text-muted">찜한 악보</p>
            <p className="mt-2 text-2xl font-bold text-ink-900">
              {wishlistCount.toLocaleString("ko-KR")}개
            </p>
          </Link>
        </section>
      ) : null}

      <Card className="border-line bg-surface shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-xl font-semibold">바로가기</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {shortcuts.map(({ href, label, description, icon: Icon }) => (
            <Link
              className="group flex min-h-16 items-center gap-3 rounded-xl border border-line p-3 hover:border-brand-400 hover:bg-brand-50"
              href={href}
              key={href}
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-ink-700 group-hover:bg-brand-100 group-hover:text-cta"
                aria-hidden="true"
              >
                <Icon className="size-5" strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink-900">{label}</span>
                <span className="block truncate text-xs text-text-muted">{description}</span>
              </span>
              <ChevronRight className="size-4 text-text-muted" aria-hidden="true" />
            </Link>
          ))}
          {session.role === "admin" ? (
            <Link
              className="group flex min-h-16 items-center gap-3 rounded-xl border border-line p-3 hover:border-brand-400 hover:bg-brand-50"
              href="/admin"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-ink-700 group-hover:bg-brand-100 group-hover:text-cta"
                aria-hidden="true"
              >
                <ShieldCheck className="size-5" strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink-900">관리자</span>
                <span className="block truncate text-xs text-text-muted">
                  관리자 대시보드로 이동해요
                </span>
              </span>
              <ChevronRight className="size-4 text-text-muted" aria-hidden="true" />
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
