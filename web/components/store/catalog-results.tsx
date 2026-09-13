import { Suspense } from "react";

import { Pagination } from "@/components/store/pagination";
import { ProductGrid } from "@/components/store/product-grid";
import { SearchControls } from "@/components/store/search-controls";
import type { SearchResult } from "@/lib/search/filter";
import type { SearchQuery } from "@/lib/search/query";

export function CatalogResults({
  result,
  query,
  browserBacked = false,
}: {
  result: SearchResult;
  query: SearchQuery;
  browserBacked?: boolean;
}) {
  const resultLabel = query.q
    ? `'${query.q}' 검색 결과 ${result.total}개`
    : `악보 ${result.total}개`;

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
      <Suspense
        fallback={
          <div className="h-12 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        }
      >
        <SearchControls facets={result.facets} key={query.q} query={query} />
      </Suspense>

      <section aria-labelledby="search-result-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink-900" id="search-result-heading">
            {resultLabel}
          </h2>
          <p className="text-sm text-text-muted">
            {result.page} / {result.pageCount} 페이지
          </p>
        </div>
        <ProductGrid
          products={result.items}
          browserBacked={browserBacked}
          emptyTitle={query.q ? `'${query.q}' 검색 결과가 없어요` : "조건에 맞는 악보가 없어요"}
          emptyDescription={
            query.q
              ? "다른 검색어를 쓰거나 필터를 초기화해 보세요."
              : "적용한 필터를 하나씩 줄여 보세요."
          }
        />
        <Pagination page={result.page} pageCount={result.pageCount} query={query} />
      </section>
    </div>
  );
}
