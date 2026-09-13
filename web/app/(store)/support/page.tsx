import type { Metadata } from "next";
import { MessageCircleQuestion } from "lucide-react";

import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = {
  title: "문의",
  description: "ScoreStore 고객 문의 안내예요.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <div className="page-shell py-12 md:py-16">
      <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-sm md:p-10">
        <MessageCircleQuestion className="size-10 text-cta" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="font-display mt-4 text-3xl font-semibold text-ink-900">문의</h1>
        <p className="mt-3 leading-7 text-ink-600">
          정식 고객 문의 채널을 준비하고 있어요. 지금은 UI 데모라 실제 상담이나 주문 지원은 제공하지
          않아요.
        </p>
        <div className="mt-6">
          <ComingSoon label="문의 채널 열기" />
        </div>
      </div>
    </div>
  );
}
