import type { Metadata } from "next";

import { PointChargeView } from "@/components/account/point-charge-view";
import { RequireAuth } from "@/components/auth/require-auth";

export const metadata: Metadata = {
  title: "포인트 충전",
  description: "ScoreStore 포인트 충전 상품과 보너스를 확인해요.",
  robots: { index: false, follow: false },
};

export default function PointChargePage() {
  return (
    <RequireAuth>
      <section className="page-shell py-8 md:py-12">
        <PointChargeView />
      </section>
    </RequireAuth>
  );
}
