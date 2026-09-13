"use client";

import { useEffect } from "react";

import type { BrowserProductData } from "@/components/store/browser-product-detail";
import { ProductDetailView } from "@/components/store/product-detail-view";
import { useSiteName } from "@/hooks/use-site-name";
import type { ProductType } from "@/lib/catalog/taxonomy";
import { hasCanonicalProductRoute } from "@/lib/catalog/types";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import { productMetaDescription } from "@/lib/seo/metadata";

const NEW_PRODUCT_WINDOW_MS = 30 * 24 * 60 * 60 * 1_000;

export async function loadBrowserProductData(
  id: number,
  expectedType: ProductType,
): Promise<{ data: BrowserProductData; canonical: boolean } | null> {
  const product = await catalogRepository.getProduct(id);
  if (!product || product.type !== expectedType) return null;

  const instrumentId = product.instrumentIds[0];
  const publishedAt = product.publishedAt ? Date.parse(product.publishedAt) : Number.NaN;
  const publishedAge = Date.now() - publishedAt;
  const [arranger, relatedResult, bundleItems] = await Promise.all([
    product.arrangerId ? catalogRepository.getArranger(product.arrangerId) : Promise.resolve(null),
    instrumentId
      ? catalogRepository.listByInstrument(instrumentId, {
          sort: "popular",
          type: product.type,
        })
      : Promise.resolve(null),
    product.type === "bundle" ? catalogRepository.getBundleItems(product.id) : Promise.resolve([]),
  ]);

  return {
    canonical: hasCanonicalProductRoute(product),
    data: {
      product,
      arranger,
      bundleItems,
      recentlyPublished:
        Number.isFinite(publishedAt) && publishedAge >= 0 && publishedAge <= NEW_PRODUCT_WINDOW_MS,
      related: (relatedResult?.items ?? []).filter((item) => item.id !== product.id).slice(0, 4),
    },
  };
}

export function BrowserProductDetailRuntime({ data }: { data: BrowserProductData }) {
  const siteName = useSiteName();

  useEffect(() => {
    const description = productMetaDescription(data.product);
    const title = `${data.product.title} | ${siteName}`;
    const apply = () => {
      if (document.title !== title) document.title = title;
      for (const element of document.head.querySelectorAll<HTMLMetaElement>(
        'meta[name="description"], meta[property="og:description"]',
      )) {
        if (element.content !== description) element.content = description;
      }
      for (const element of document.head.querySelectorAll<HTMLMetaElement>(
        'meta[property="og:title"]',
      )) {
        if (element.content !== title) element.content = title;
      }
    };

    apply();
    const timer = window.setTimeout(apply, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [data, siteName]);

  return <ProductDetailView {...data} browserBacked />;
}
