"use client";

import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="page-shell flex min-h-[60vh] items-center justify-center py-12"
      id="main"
      tabIndex={-1}
    >
      <div className="max-w-lg text-center">
        <span
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-sale-bg text-sale"
          aria-hidden="true"
        >
          <CircleAlert className="size-8" strokeWidth={1.5} />
        </span>
        <h1 className="font-display mt-5 text-3xl font-semibold text-ink-900">
          페이지를 불러오지 못했어요
        </h1>
        <p className="mt-3 leading-7 text-text-muted">
          잠시 연결이 원활하지 않았어요. 다시 시도하거나 홈에서 계속 둘러보세요.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cta px-4 text-sm font-medium text-surface hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2"
            type="button"
            onClick={reset}
          >
            <RotateCcw strokeWidth={1.5} aria-hidden="true" /> 다시 시도
          </button>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink-900 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
            href="/"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
