"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";

import type { HomeCatalogViewData } from "@/components/store/home-catalog-content";
import { hasBrowserCatalogOverride } from "@/lib/catalog/browser-overrides";

type RuntimeView = ComponentType<{ data: HomeCatalogViewData }>;
type BrowserHomeCatalog = { data: HomeCatalogViewData; View: RuntimeView };

export function HomeCatalogOverrideBridge({ children }: { children: ReactNode }) {
  const [browserCatalog, setBrowserCatalog] = useState<BrowserHomeCatalog | null>(null);

  useEffect(() => {
    if (!hasBrowserCatalogOverride()) return;
    let cancelled = false;

    void import("@/components/store/home-catalog-runtime")
      .then(async (runtime) => ({
        data: await runtime.loadBrowserHomeCatalog(),
        View: runtime.HomeCatalogRuntime,
      }))
      .then((nextCatalog) => {
        if (!cancelled) setBrowserCatalog(nextCatalog);
      })
      .catch(() => {
        // 브라우저 저장소 조회에 실패해도 서버가 렌더링한 카탈로그는 유지한다.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const View = browserCatalog?.View;

  return (
    <div className="contents" data-home-catalog-source={browserCatalog ? "browser" : "server"}>
      {browserCatalog && View ? <View data={browserCatalog.data} /> : children}
    </div>
  );
}
