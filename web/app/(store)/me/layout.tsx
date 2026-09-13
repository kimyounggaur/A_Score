import type { Metadata } from "next";

import { AccountNav } from "@/components/account/account-nav";
import { RequireAuth } from "@/components/auth/require-auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <RequireAuth>
      <section className="page-shell py-8 md:py-12">
        <div className="grid gap-7 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-10">
          <aside className="min-w-0 lg:sticky lg:top-24 lg:h-fit">
            <AccountNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </section>
    </RequireAuth>
  );
}
