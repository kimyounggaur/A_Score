import type { Metadata } from "next";

import { NotificationsView } from "@/components/account/notifications-view";
import { RequireAuth } from "@/components/auth/require-auth";

export const metadata: Metadata = {
  title: "알림",
  description: "주문과 보관함, ScoreStore의 새 소식을 확인해요.",
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <section className="page-shell py-8 md:py-12">
        <NotificationsView />
      </section>
    </RequireAuth>
  );
}
