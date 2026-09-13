"use client";

import { CatalogResults } from "@/components/store/catalog-results";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import type { SearchResult } from "@/lib/search/filter";
import type { SearchQuery } from "@/lib/search/query";

export function loadBrowserCatalogResults(query: SearchQuery): Promise<SearchResult> {
  return catalogRepository.listProducts(query);
}

export function CatalogResultsOverrideRuntime({
  result,
  query,
}: {
  result: SearchResult;
  query: SearchQuery;
}) {
  return <CatalogResults browserBacked result={result} query={query} />;
}
