import type { Metadata } from "next";

import { PRODUCT_TYPE, getInstrument } from "@/lib/catalog/taxonomy";
import type { CatalogProduct } from "@/lib/catalog/types";

export const SEO_SITE_NAME = "ScoreStore";

export const DEFAULT_OPEN_GRAPH_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "ScoreStore 디지털 악보 마켓",
} as const;

export const COMMON_OPEN_GRAPH = {
  type: "website",
  locale: "ko_KR",
  siteName: SEO_SITE_NAME,
} as const;

export function createDefaultOpenGraph(
  title: string,
  description: string,
  url: string,
): NonNullable<Metadata["openGraph"]> {
  return {
    ...COMMON_OPEN_GRAPH,
    title,
    description,
    url,
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  };
}

export function createProductOpenGraphMetadata(
  title: string,
  description: string,
  url: string,
): NonNullable<Metadata["openGraph"]> {
  return {
    ...COMMON_OPEN_GRAPH,
    title,
    description,
    url,
  };
}

export function productMetaDescription(product: CatalogProduct): string {
  if (product.type === PRODUCT_TYPE.BUNDLE) {
    return `${product.title} · ${product.itemCount}곡을 담은 디지털 악보집이에요.`;
  }

  if (product.type === PRODUCT_TYPE.BAND_SET) {
    const parts = product.parts.map((part) => part.label).join(" · ");
    return `${product.title} · ${parts} 파트가 들어 있는 합주 악보예요.`;
  }

  const instrument = getInstrument(product.instrumentIds[0] ?? "");
  return [product.title, product.artist, instrument?.label, "디지털 악보"]
    .filter(Boolean)
    .join(" · ");
}
