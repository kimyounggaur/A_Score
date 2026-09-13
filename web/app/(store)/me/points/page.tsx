import { Suspense } from "react";
import type { Metadata } from "next";

import { PointsView } from "@/components/account/points-view";

export const metadata: Metadata = {
  title: "포인트",
  description: "유상·무상 포인트 잔액과 만료일, 이용 내역을 확인해요.",
};

export default function PointsPage() {
  return (
    <Suspense
      fallback={
        <p className="py-12 text-center text-sm text-text-muted">포인트 내역을 준비하고 있어요.</p>
      }
    >
      <PointsView />
    </Suspense>
  );
}
