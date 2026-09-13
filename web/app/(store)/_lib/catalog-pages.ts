import { cache } from "react";

import type { ProductType } from "@/lib/catalog/taxonomy";
import type { CatalogProduct } from "@/lib/catalog/types";
import { catalogRepository } from "@/lib/repositories/catalog-repository";
import type { SearchQuery } from "@/lib/search/query";

const NEW_PRODUCT_WINDOW_MS = 30 * 24 * 60 * 60 * 1_000;

export const getCatalogProduct = cache(async (id: number) => catalogRepository.getProduct(id));

export const getCatalogProductIncludingUnavailable = cache(async (id: number) =>
  catalogRepository.getProductIncludingUnavailable(id),
);

export function parseProductId(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function listAllProducts(query: Partial<SearchQuery> = {}): Promise<CatalogProduct[]> {
  const first = await catalogRepository.listProducts({ ...query, page: 1 });
  if (first.pageCount <= 1) return first.items;

  const remaining = await Promise.all(
    Array.from({ length: first.pageCount - 1 }, (_, index) =>
      catalogRepository.listProducts({ ...query, page: index + 2 }),
    ),
  );
  return [first, ...remaining].flatMap((result) => result.items);
}

export async function staticProductParams(type: ProductType) {
  // Canonical routes are emitted only for products that are sellable in the
  // server seed. Browser-only drafts use the noindex /local route after publish.
  const products = (await listAllProducts()).filter((product) => product.type === type);
  return products.map((product) => ({ id: String(product.id) }));
}

export async function getProductPageData(product: CatalogProduct) {
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
    arranger,
    bundleItems,
    recentlyPublished:
      Number.isFinite(publishedAt) && publishedAge >= 0 && publishedAge <= NEW_PRODUCT_WINDOW_MS,
    related: (relatedResult?.items ?? []).filter((item) => item.id !== product.id).slice(0, 4),
  };
}
