import Link from "next/link";
import type { Metadata } from "next";
import { CircleX } from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "결제 실패", robots: { index: false, follow: false } };

type FailPageProps = {
  searchParams: Promise<{ code?: string; message?: string; orderId?: string }>;
};

export default async function FailPage({ searchParams }: FailPageProps) {
  const params = await searchParams;
  return (
    <RequireAuth>
      <section className="page-shell flex min-h-[65vh] items-center justify-center py-10">
        <Card className="w-full max-w-lg border-line bg-surface text-center shadow-none">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <CircleX className="size-14 text-sale" strokeWidth={1.5} aria-hidden="true" />
            <h1 className="font-display text-3xl font-semibold">결제를 완료하지 못했어요</h1>
            <p className="text-sm leading-6 text-text-muted">
              {params.message ??
                "결제가 취소되었거나 승인되지 않았어요. 결제 수단을 확인한 뒤 다시 시도해 주세요."}
            </p>
            {params.code ? (
              <p className="text-xs text-text-muted">오류 코드: {params.code}</p>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild className="bg-cta text-surface hover:bg-cta-hover">
                <Link href="/cart">다시 시도</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/scores">악보 둘러보기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </RequireAuth>
  );
}
