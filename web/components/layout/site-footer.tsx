"use client";

import Link from "next/link";

import { useSiteName } from "@/hooks/use-site-name";
import { BUSINESS_INFORMATION } from "@/lib/config/business";

const legalLinks = [
  { href: "/legal/terms", label: "이용약관" },
  { href: "/legal/privacy", label: "개인정보처리방침" },
  { href: "/legal/refund", label: "환불정책" },
  { href: "/support", label: "문의" },
] as const;

export function SiteFooter() {
  const siteName = useSiteName();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const businessFacts = [
    BUSINESS_INFORMATION.companyName ? `상호 ${BUSINESS_INFORMATION.companyName}` : null,
    BUSINESS_INFORMATION.representative ? `대표 ${BUSINESS_INFORMATION.representative}` : null,
    BUSINESS_INFORMATION.businessRegistrationNumber
      ? `사업자등록번호 ${BUSINESS_INFORMATION.businessRegistrationNumber}`
      : null,
    BUSINESS_INFORMATION.ecommerceRegistrationNumber
      ? `통신판매업 신고번호 ${BUSINESS_INFORMATION.ecommerceRegistrationNumber}`
      : null,
    BUSINESS_INFORMATION.address || null,
    BUSINESS_INFORMATION.contact || null,
    BUSINESS_INFORMATION.hostingProvider
      ? `호스팅 제공자 ${BUSINESS_INFORMATION.hostingProvider}`
      : null,
  ].filter((fact): fact is string => Boolean(fact));

  return (
    <footer className="border-t border-line bg-surface pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] md:pb-0">
      <div className="page-shell py-8 md:py-10">
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="정책과 고객 지원">
          {legalLinks.map((link) => (
            <Link
              className="inline-flex min-h-11 items-center text-sm font-medium text-ink-700 hover:text-cta"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 space-y-1 text-sm leading-6 text-text-muted">
          {businessFacts.length > 0 ? (
            <p>{businessFacts.join(" · ")}</p>
          ) : (
            <p>사업자 정보 준비 중</p>
          )}
          {demoMode ? <p>UI 데모 · 곡 정보는 샘플 데이터예요.</p> : null}
          <p>
            © {new Date().getFullYear()} {siteName}
          </p>
        </div>
      </div>
    </footer>
  );
}
