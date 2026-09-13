import type { ReactNode } from "react";
import { Scale } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type LegalSection = { title: string; content: ReactNode };

export function LegalDocument({
  title,
  updatedAt,
  sections,
}: {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <article className="page-shell max-w-3xl py-10 md:py-16">
      <header className="border-b border-line pb-6">
        <Badge variant="sale" className="mb-4 gap-1">
          <Scale aria-hidden="true" /> 법률 검토 전 초안
        </Badge>
        <h1 className="font-display text-3xl font-semibold text-ink-900 md:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-text-muted">초안 갱신일: {updatedAt}</p>
        <p className="mt-4 rounded-lg bg-sale-bg p-4 text-sm leading-6 text-sale-ink">
          이 문서는 서비스 구조를 검토하기 위한 초안이에요. 전문가 검토를 마치기 전에는 실서비스
          약관으로 사용하지 않아요.
        </p>
      </header>
      <div className="space-y-9 py-8">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-lg font-bold text-ink-900">{section.title}</h2>
            <div className="space-y-3 text-sm leading-7 text-ink-700">{section.content}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
