import Link from "next/link";
import { Suspense } from "react";

import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main
        className="min-h-[calc(100vh-var(--header-h))] pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1.5rem)] md:pb-0"
        id="main"
        tabIndex={-1}
      >
        <noscript>
          <aside className="border-b border-line bg-brand-50">
            <div className="page-shell flex flex-wrap items-center gap-x-3 gap-y-1 py-4 text-sm">
              <strong className="text-ink-900">자바스크립트 없이 둘러보기</strong>
              <span className="text-text-muted">추천 악보</span>
              <Link
                className="font-semibold text-cta underline underline-offset-4"
                href="/scores/1001"
              >
                밤편지
              </Link>
            </div>
          </aside>
        </noscript>
        {children}
      </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <BottomTabBar />
      </Suspense>
    </>
  );
}
