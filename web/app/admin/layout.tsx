import type { Metadata } from "next";

import { AdminMobileHeader, AdminSidebar } from "@/components/admin/admin-nav";
import { RequireRole } from "@/components/auth/require-role";

export const metadata: Metadata = {
  title: { default: "관리자", template: "%s | ScoreStore 관리자" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole requiredRole="admin">
      <div className="flex min-h-screen bg-canvas">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <AdminMobileHeader />
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </RequireRole>
  );
}
