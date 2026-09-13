import type { MetadataRoute } from "next";

import { listAllProducts } from "@/app/(store)/_lib/catalog-pages";
import { getProductPath } from "@/lib/catalog/types";
import { catalogRepository } from "@/lib/repositories/catalog-repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [products, result, arrangers] = await Promise.all([
    listAllProducts(),
    catalogRepository.listProducts(),
    catalogRepository.listArrangers(),
  ]);
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/scores`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/legal/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/legal/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/legal/refund`, changeFrequency: "monthly", priority: 0.3 },
  ];
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}${getProductPath(product)}`,
    lastModified: product.publishedAt ?? undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  const instrumentRoutes: MetadataRoute.Sitemap = Object.entries(result.facets.instruments)
    .filter((entry): entry is [string, number] => (entry[1] ?? 0) > 0)
    .map(([instrument]) => ({
      url: `${siteUrl}/instruments/${instrument}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  const arrangerRoutes: MetadataRoute.Sitemap = arrangers.map((arranger) => ({
    url: `${siteUrl}/arrangers/${arranger.id}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  return [...staticRoutes, ...productRoutes, ...instrumentRoutes, ...arrangerRoutes];
}
