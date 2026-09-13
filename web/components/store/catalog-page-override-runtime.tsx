"use client";

import {
  ArrangerProductResults,
  InstrumentProductResults,
} from "@/components/store/catalog-page-results";
import type { CatalogPageView } from "@/components/store/catalog-page-override-bridge";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import type { SearchResult } from "@/lib/search/filter";
import type { SearchQuery } from "@/lib/search/query";

export function loadBrowserCatalogPage(query: SearchQuery): Promise<SearchResult> {
  return catalogRepository.listProducts(query);
}

export function CatalogPageOverrideRuntime({
  result,
  view,
}: {
  result: SearchResult;
  view: CatalogPageView;
}) {
  if (view.kind === "instrument") {
    return (
      <InstrumentProductResults
        browserBacked
        instrumentId={view.instrumentId}
        instrumentLabel={view.instrumentLabel}
        result={result}
      />
    );
  }

  return <ArrangerProductResults browserBacked result={result} />;
}
