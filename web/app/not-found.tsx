import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div
      className="page-shell flex min-h-[60vh] items-center justify-center py-12"
      id="main"
      tabIndex={-1}
    >
      <div className="max-w-lg text-center">
        <span
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-50 text-cta"
          aria-hidden="true"
        >
          <FileQuestion className="size-8" strokeWidth={1.5} />
        </span>
        <h1 className="font-display mt-5 text-3xl font-semibold text-ink-900">
          페이지를 찾을 수 없어요
        </h1>
        <p className="mt-3 leading-7 text-text-muted">
          주소가 바뀌었거나 판매할 수 없는 상품이에요. 홈이나 검색에서 다른 악보를 찾아보세요.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="min-h-11 bg-cta hover:bg-cta-hover">
            <Link href="/">홈으로</Link>
          </Button>
          <Button asChild className="min-h-11" variant="outline">
            <Link href="/scores">악보 검색</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
