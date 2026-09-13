"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { hasBrowserCatalogOverride } from "@/lib/catalog/browser-overrides";
import type { InstrumentId } from "@/lib/catalog/taxonomy";
import type { SearchResult } from "@/lib/search/filter";
import type { SearchQuery } from "@/lib/search/query";

export type CatalogPageView =
  | {
      kind: "instrument";
      instrumentId: InstrumentId;
      instrumentLabel: string;
    }
  | { kind: "arranger" };

type RuntimeProps = { result: SearchResult; view: CatalogPageView };
type RuntimeView = ComponentType<RuntimeProps>;
type BrowserResult = { key: string; result: SearchResult; View: RuntimeView };

function resultKey(query: SearchQuery, view: CatalogPageView): string {
  return JSON.stringify({ query, view });
}

function instrumentPageHref(instrumentId: InstrumentId, page: number): string {
  const basePath = `/instruments/${instrumentId}`;
  return page > 1 ? `${basePath}?page=${page}` : basePath;
}

export function CatalogPageOverrideBridge({
  children,
  query,
  view,
}: {
  children: ReactNode;
  query: SearchQuery;
  view: CatalogPageView;
}) {
  const router = useRouter();
  const key = resultKey(query, view);
  const [browserResult, setBrowserResult] = useState<BrowserResult | null>(null);
  const current = browserResult?.key === key ? browserResult : null;
  const instrumentId = view.kind === "instrument" ? view.instrumentId : null;

  useEffect(() => {
    if (!hasBrowserCatalogOverride()) return;
    let cancelled = false;

    void import("@/components/store/catalog-page-override-runtime")
      .then(async (runtime) => ({
        result: await runtime.loadBrowserCatalogPage(query),
        View: runtime.CatalogPageOverrideRuntime,
      }))
      .then((nextResult) => {
        if (!cancelled) setBrowserResult({ key, ...nextResult });
      })
      .catch(() => {
        // 브라우저 저장소를 읽지 못하면 검색 가능한 서버 초기 콘텐츠를 유지한다.
      });

    return () => {
      cancelled = true;
    };
  }, [key, query]);

  useEffect(() => {
    if (!current || !instrumentId || current.result.page === query.page) return;
    router.replace(instrumentPageHref(instrumentId, current.result.page), { scroll: false });
  }, [current, instrumentId, query.page, router]);

  const View = current?.View;

  return (
    <div className="contents" data-catalog-page-source={current ? "browser" : "server"}>
      {current && View ? <View result={current.result} view={view} /> : children}
    </div>
  );
}
