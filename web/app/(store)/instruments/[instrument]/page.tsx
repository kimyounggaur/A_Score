import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Music2 } from "lucide-react";

import { CatalogPageOverrideBridge } from "@/components/store/catalog-page-override-bridge";
import { InstrumentProductResults } from "@/components/store/catalog-page-results";
import { INSTRUMENTS, getInstrument } from "@/lib/catalog/taxonomy";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import { mergeSearchQuery, parsePageValue } from "@/lib/search/query";
import { createDefaultOpenGraph } from "@/lib/seo/metadata";

type InstrumentPageProps = {
  params: Promise<{ instrument: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export const dynamicParams = false;
export const revalidate = 3600;

function instrumentPageHref(instrumentId: string, page: number): string {
  const basePath = `/instruments/${instrumentId}`;
  return page > 1 ? `${basePath}?page=${page}` : basePath;
}

function getRequestedPage(value: string | string[] | undefined) {
  const rawPage = Array.isArray(value) ? value[0] : value;
  const page = parsePageValue(rawPage);
  const isCanonical =
    value === undefined || (typeof value === "string" && page > 1 && value === String(page));
  return { page, isCanonical };
}

export function generateStaticParams() {
  // 모든 유효 악기 경로를 만들어 두어 Stage B 관리자에서 최초 상품을
  // 게시한 악기도 브라우저 카탈로그로 복원할 수 있게 한다. 메뉴와 sitemap은
  // 계속 판매 가능한 상품 수가 0인 악기를 노출하지 않는다.
  return INSTRUMENTS.map((instrument) => ({ instrument: instrument.id }));
}

export async function generateMetadata({
  params,
  searchParams,
}: InstrumentPageProps): Promise<Metadata> {
  const [{ instrument: rawInstrument }, rawSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const instrument = getInstrument(rawInstrument);
  if (!instrument) notFound();
  const page = getRequestedPage(rawSearchParams.page).page;
  const pageLabel = page > 1 ? ` ${page}페이지` : "";
  const title = `${instrument.label} 악보${pageLabel}`;
  const description = `${instrument.label}로 연주할 수 있는 디지털 악보를 모았어요.${
    page > 1 ? ` ${page}페이지입니다.` : ""
  }`;
  const canonical = instrumentPageHref(instrument.id, page);
  const result = await catalogRepository.listByInstrument(instrument.id);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: createDefaultOpenGraph(title, description, canonical),
    ...(result.total === 0 ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function InstrumentPage({ params, searchParams }: InstrumentPageProps) {
  const [{ instrument: rawInstrument }, rawSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const requestedPage = getRequestedPage(rawSearchParams.page);
  const instrument = getInstrument(rawInstrument);
  if (!instrument) notFound();
  const query = mergeSearchQuery({
    instrument: instrument.id,
    sort: "popular",
    page: requestedPage.page,
  });
  const result = await catalogRepository.listProducts(query);
  if (!requestedPage.isCanonical || requestedPage.page !== result.page) {
    redirect(instrumentPageHref(instrument.id, result.page));
  }

  return (
    <div className="page-shell py-10 md:py-14">
      <div className="rounded-2xl bg-brand-50 p-6 md:p-8">
        <span
          className="flex size-12 items-center justify-center rounded-xl bg-surface text-cta shadow-sm"
          aria-hidden="true"
        >
          <Music2 className="size-6" strokeWidth={1.5} />
        </span>
        <h1 className="font-display mt-4 text-3xl font-semibold text-ink-900 md:text-4xl">
          {instrument.label} 악보
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink-600">
          {instrument.label}의 음역과 연주 방식에 맞춘 악보를 모았어요. 인기순으로 둘러보고 내
          수준에 맞는 곡을 골라보세요.
        </p>
      </div>
      <CatalogPageOverrideBridge
        query={query}
        view={{
          kind: "instrument",
          instrumentId: instrument.id,
          instrumentLabel: instrument.label,
        }}
      >
        <InstrumentProductResults
          instrumentId={instrument.id}
          instrumentLabel={instrument.label}
          result={result}
        />
      </CatalogPageOverrideBridge>
    </div>
  );
}
