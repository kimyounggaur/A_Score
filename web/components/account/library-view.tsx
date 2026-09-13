"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, LibraryBig, LoaderCircle } from "lucide-react";

import { AccountError, AccountLoading } from "@/components/account/account-utils";
import { NotationThumbnail } from "@/components/store/notation-thumbnail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ComingSoon } from "@/components/ui/coming-soon";
import { EmptyState } from "@/components/ui/empty-state";
import type { CatalogProduct } from "@/lib/catalog/types";
import { getProductPath } from "@/lib/catalog/types";
import { DOWNLOAD_POLICY } from "@/lib/config/policy";
import { formatDate } from "@/lib/format";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import type { LibraryItem } from "@/lib/repositories/interfaces";
import { libraryRepository } from "@/lib/repositories/library-repository";
import { useSessionStore } from "@/lib/stores/session";

type LibraryRow = {
  item: LibraryItem;
  product: CatalogProduct | null;
};

function DownloadControl({ productId, userId }: { productId: number; userId: string }) {
  const [state, setState] = useState<"idle" | "checking" | "ready">("idle");
  const [error, setError] = useState<string | null>(null);

  const prepare = async () => {
    if (state !== "idle") return;
    setState("checking");
    setError(null);
    try {
      await libraryRepository.issueDownloadTicket(userId, productId);
      setState("ready");
    } catch (caught) {
      setState("idle");
      setError(caught instanceof Error ? caught.message : "다운로드 권한을 확인하지 못했어요.");
    }
  };

  return (
    <div className="space-y-2">
      {state === "ready" ? (
        <ComingSoon label="Stage C에서 실제 파일이 제공돼요" />
      ) : (
        <Button type="button" variant="outline" disabled={state === "checking"} onClick={prepare}>
          {state === "checking" ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Download aria-hidden="true" />
          )}
          {state === "checking" ? "권한 확인 중" : "다운로드"}
        </Button>
      )}
      <p className="text-xs leading-5 text-text-muted">Stage C에서 실제 파일이 제공돼요.</p>
      {error ? (
        <p className="text-xs text-sale" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function LibraryView() {
  const session = useSessionStore((state) => state.session);
  const [rows, setRows] = useState<LibraryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const userId = session.id;
    let active = true;
    async function loadLibrary() {
      try {
        const items = await libraryRepository.listLibrary(userId);
        const products = await Promise.all(
          items.map((item) => catalogRepository.getProduct(item.productId)),
        );
        if (active) {
          setRows(items.map((item, index) => ({ item, product: products[index] ?? null })));
        }
      } catch (caught) {
        if (active)
          setError(caught instanceof Error ? caught.message : "보관함을 불러오지 못했어요.");
      }
    }
    void loadLibrary();
    return () => {
      active = false;
    };
  }, [session]);

  if (!session) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink-900">보관함</h1>
        <p className="mt-2 text-sm text-text-muted">
          결제가 확정된 악보를 최신 구매순으로 보여드려요.
        </p>
      </header>

      <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm leading-6 text-brand-800">
        구매일로부터 {DOWNLOAD_POLICY.availableDays.toLocaleString("ko-KR")}일 동안 상품당 최대{" "}
        {DOWNLOAD_POLICY.maxDownloads}회 다시 받을 수 있어요. Stage B에서는 권한 티켓만 확인하며
        실제 파일은 제공하지 않아요.
      </div>

      {error ? <AccountError message={error} /> : null}
      {!rows && !error ? <AccountLoading label="보관함을 불러오고 있어요." /> : null}
      {rows?.length === 0 ? (
        <EmptyState
          icon={<LibraryBig />}
          title="아직 받은 악보가 없어요"
          description="무료 악보도 같은 주문 과정을 거쳐 보관함에 안전하게 담겨요."
          action={
            <Button asChild className="bg-cta text-surface hover:bg-cta-hover">
              <Link href="/scores?price=free">무료 악보 둘러보기</Link>
            </Button>
          }
        />
      ) : null}

      {rows && rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map(({ item, product }) => (
            <Card
              className="border-line bg-surface shadow-none"
              id={`product-${item.productId}`}
              key={item.id}
            >
              <CardContent className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center">
                {product ? (
                  <Link
                    className="block w-28 rounded-xl"
                    href={getProductPath(product, { browserBacked: true })}
                    aria-label={`${product.title} 상세 보기`}
                  >
                    <NotationThumbnail className="w-full" product={product} />
                  </Link>
                ) : (
                  <div
                    className="flex aspect-[4/5] w-28 items-center justify-center rounded-xl border border-line bg-muted text-xs text-text-muted"
                    aria-label="상품 이미지 없음"
                  >
                    판매 종료
                  </div>
                )}
                <div className="min-w-0">
                  {product ? (
                    <Link
                      className="inline-flex min-h-11 min-w-11 items-center font-bold text-ink-900 hover:text-cta"
                      href={getProductPath(product, { browserBacked: true })}
                    >
                      {product.title}
                    </Link>
                  ) : (
                    <p className="font-bold text-ink-900">판매가 종료된 악보</p>
                  )}
                  <dl className="mt-3 grid gap-1 text-sm text-text-muted">
                    <div className="flex flex-wrap gap-x-2">
                      <dt>구매일</dt>
                      <dd className="text-ink-700">{formatDate(item.purchasedAt)}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt>주문번호</dt>
                      <dd className="break-all text-ink-700">{item.orderNo}</dd>
                    </div>
                  </dl>
                  <Link
                    className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-cta hover:text-cta-hover"
                    href={`/me/orders/${encodeURIComponent(item.orderId)}`}
                  >
                    주문 상세 보기
                  </Link>
                </div>
                <div className="sm:justify-self-end">
                  <DownloadControl productId={item.productId} userId={session.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
