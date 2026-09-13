"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";

import { hasBrowserCatalogOverride } from "@/lib/catalog/browser-overrides";
import type { SearchResult } from "@/lib/search/filter";
import type { SearchQuery } from "@/lib/search/query";

type RuntimeProps = { result: SearchResult; query: SearchQuery };
type RuntimeView = ComponentType<RuntimeProps>;
type BrowserResult = { key: string; result: SearchResult; View: RuntimeView };

function queryKey(query: SearchQuery) {
  return JSON.stringify(query);
}

export function CatalogResultsBridge({
  children,
  query,
}: {
  children: ReactNode;
  query: SearchQuery;
}) {
  const key = queryKey(query);
  const [browserResult, setBrowserResult] = useState<BrowserResult | null>(null);
  const current = browserResult?.key === key ? browserResult : null;

  useEffect(() => {
    if (!hasBrowserCatalogOverride()) return;
    let cancelled = false;

    void import("@/components/store/catalog-results-override-runtime")
      .then(async (runtime) => ({
        result: await runtime.loadBrowserCatalogResults(query),
        View: runtime.CatalogResultsOverrideRuntime,
      }))
      .then((nextResult) => {
        if (!cancelled) setBrowserResult({ key, ...nextResult });
      })
      .catch(() => {
        // 서버가 렌더링한 초기 결과를 유지해 탐색 흐름을 끊지 않는다.
      });

    return () => {
      cancelled = true;
    };
  }, [key, query]);

  const View = current?.View;

  return (
    <div className="contents" data-catalog-results-source={current ? "browser" : "server"}>
      {current && View ? <View result={current.result} query={query} /> : children}
    </div>
  );
}
