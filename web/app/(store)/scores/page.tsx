import type { Metadata } from "next";

import { CatalogResults } from "@/components/store/catalog-results";
import { CatalogResultsBridge } from "@/components/store/catalog-results-bridge";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import { parseSearchParams } from "@/lib/search/query";

type ScoreSearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "악보 검색",
  description: "곡명, 아티스트, 악기, 기보 형식과 난이도로 악보를 찾아보세요.",
  alternates: { canonical: "/scores" },
};

function toUrlSearchParams(record: Awaited<ScoreSearchParams>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first != null) params.set(key, first);
  }
  return params;
}

export default async function ScoresPage({ searchParams }: { searchParams: ScoreSearchParams }) {
  const rawSearchParams = await searchParams;
  const query = parseSearchParams(toUrlSearchParams(rawSearchParams));
  const result = await catalogRepository.listProducts(query);

  return (
    <div className="page-shell py-8 md:py-12">
      <div className="mb-7">
        <p className="text-sm font-bold text-cta">CATALOG</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-ink-900 md:text-4xl">
          악보 검색
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          필터와 정렬 상태는 주소에 남아 새로고침하거나 공유해도 그대로 보여요.
        </p>
      </div>

      <CatalogResultsBridge query={query}>
        <CatalogResults result={result} query={query} />
      </CatalogResultsBridge>
    </div>
  );
}
