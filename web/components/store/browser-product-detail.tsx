"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";

import { hasBrowserCatalogOverride } from "@/lib/catalog/browser-overrides";
import type { ProductType } from "@/lib/catalog/taxonomy";
import type { Arranger, CatalogProduct } from "@/lib/catalog/types";

export type BrowserProductData = {
  product: CatalogProduct;
  arranger: Arranger | null;
  related: CatalogProduct[];
  bundleItems: CatalogProduct[];
  recentlyPublished: boolean;
};

type ProductRouteMode = "canonical" | "local";
type RuntimeView = ComponentType<{ data: BrowserProductData }>;

type BrowserDetailState =
  | { status: "static" }
  | { status: "loading" }
  | { status: "ready"; data: BrowserProductData; View: RuntimeView }
  | { status: "redirect" }
  | { status: "missing" }
  | { status: "error" };

const primaryLinkClass =
  "inline-flex min-h-11 items-center rounded-lg bg-cta px-4 font-semibold text-surface hover:bg-cta-hover";
const secondaryLinkClass =
  "inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-semibold text-ink-900 hover:bg-muted";

function getCanonicalProductPath(productId: number, productType: ProductType) {
  if (productType === "bundle") return `/bundles/${productId}`;
  if (productType === "band-set") return `/band-sets/${productId}`;
  return `/scores/${productId}`;
}

export function BrowserProductDetail({
  productId,
  expectedType,
  hasInitialData = false,
  routeMode = "local",
  children,
}: {
  productId: number;
  expectedType: ProductType;
  hasInitialData?: boolean;
  routeMode?: ProductRouteMode;
  children?: ReactNode;
}) {
  const [state, setState] = useState<BrowserDetailState>(
    hasInitialData
      ? { status: "static" }
      : routeMode === "canonical"
        ? { status: "missing" }
        : { status: "loading" },
  );
  const [retryKey, setRetryKey] = useState(0);
  const canonicalPath = getCanonicalProductPath(productId, expectedType);

  useEffect(() => {
    if (routeMode === "canonical" && !hasBrowserCatalogOverride()) return;
    let cancelled = false;

    void import("@/components/store/browser-product-detail-runtime")
      .then(async (runtime) => {
        const result = await runtime.loadBrowserProductData(productId, expectedType);
        return { result, View: runtime.BrowserProductDetailRuntime };
      })
      .then(({ result, View }) => {
        if (cancelled) return;
        if (!result) {
          setState({ status: "missing" });
          return;
        }
        setState(
          routeMode === "local" && result.canonical
            ? { status: "redirect" }
            : { status: "ready", data: result.data, View },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [expectedType, productId, retryKey, routeMode]);

  useEffect(() => {
    if (routeMode !== "local" || (state.status !== "redirect" && state.status !== "missing")) {
      return;
    }
    window.location.replace(canonicalPath);
  }, [canonicalPath, routeMode, state.status]);

  if (state.status === "ready") return <state.View data={state.data} />;
  if (state.status === "static") return <>{children}</>;

  if (state.status === "missing" && routeMode === "canonical") {
    return (
      <div className="page-shell flex min-h-[60vh] items-center justify-center py-12">
        <div className="max-w-lg text-center">
          <span className="mx-auto text-5xl text-cta" aria-hidden="true">
            ?
          </span>
          <h1 className="font-display mt-5 text-3xl font-semibold text-ink-900">
            판매할 수 없는 상품이에요
          </h1>
          <p className="mt-3 leading-7 text-text-muted">
            숨김·삭제되었거나 이용허락 확인이 끝나지 않은 상품이에요. 다른 악보를 찾아보세요.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className={primaryLinkClass} href="/scores">
              악보 검색으로
            </Link>
            <Link className={secondaryLinkClass} href="/">
              홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "loading" || state.status === "redirect") {
    return (
      <div className="page-shell py-16" role="status">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        <p className="mt-4 text-sm text-text-muted">
          {state.status === "loading"
            ? "저장된 상품 정보를 불러오고 있어요."
            : "정규 상품 주소를 확인하고 있어요."}
        </p>
      </div>
    );
  }

  return (
    <div className="page-shell flex min-h-[60vh] items-center justify-center py-12">
      <div className="max-w-lg text-center">
        <span className="mx-auto text-5xl text-cta" aria-hidden="true">
          !
        </span>
        <h1 className="font-display mt-5 text-3xl font-semibold text-ink-900">
          상품 정보를 불러오지 못했어요
        </h1>
        <p className="mt-3 leading-7 text-text-muted">
          브라우저 저장소에서 상품 정보를 읽지 못했어요. 잠시 후 다시 시도하거나 다른 악보를
          찾아보세요.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            className={secondaryLinkClass}
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            다시 시도
          </button>
          <Link className={primaryLinkClass} href="/scores">
            악보 검색으로
          </Link>
        </div>
      </div>
    </div>
  );
}
