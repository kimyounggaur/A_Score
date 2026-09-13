"use client";

import {
  HomeCatalogContent,
  type HomeCatalogViewData,
} from "@/components/store/home-catalog-content";
import { catalogRepository } from "@/lib/repositories/catalog-repository";

export async function loadBrowserHomeCatalog(): Promise<HomeCatalogViewData> {
  const [home, searchResult, arrangers] = await Promise.all([
    catalogRepository.listHome(),
    catalogRepository.listProducts(),
    catalogRepository.listArrangers(),
  ]);
  const arrangerCounts = await Promise.all(
    arrangers.map((arranger) =>
      catalogRepository
        .listProducts({ q: arranger.name })
        .then((result) => ({ id: arranger.id, count: result.total })),
    ),
  );
  const countByArranger = new Map(arrangerCounts.map((item) => [item.id, item.count]));

  return {
    home,
    instrumentCounts: searchResult.facets.instruments,
    arrangers: arrangers.map((arranger) => ({
      ...arranger,
      productCount: countByArranger.get(arranger.id) ?? 0,
    })),
  };
}

export function HomeCatalogRuntime({ data }: { data: HomeCatalogViewData }) {
  return <HomeCatalogContent data={data} browserBacked />;
}
