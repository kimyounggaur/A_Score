import { Suspense } from "react";
import type { Metadata } from "next";

import { UserManager } from "@/components/admin/user-manager";

export const metadata: Metadata = { title: "회원 관리" };

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <p className="py-12 text-center text-sm text-text-muted">회원 목록을 준비하고 있습니다.</p>
      }
    >
      <UserManager />
    </Suspense>
  );
}
