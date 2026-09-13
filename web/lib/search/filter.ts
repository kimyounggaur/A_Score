import {
  getInstrument,
  INSTRUMENTS,
  INSTRUMENT_GROUPS,
  type Genre,
  type InstrumentGroup,
  type InstrumentId,
  type Level,
  type NotationFormat,
  type ProductType,
} from "@/lib/catalog/taxonomy";
import type { Arranger, CatalogProduct } from "@/lib/catalog/types";
import { isPurchasable } from "@/lib/catalog/types";
import { SEARCH_PAGE_SIZE } from "@/lib/config/search";
import { effectivePrice } from "@/lib/pricing";
import { matches } from "@/lib/search/normalize";
import { mergeSearchQuery, type PriceFilter, type SearchQuery } from "@/lib/search/query";

export interface SearchFacets {
  instruments: Partial<Record<InstrumentId, number>>;
  groups: Partial<Record<InstrumentGroup, number>>;
  formats: Partial<Record<NotationFormat, number>>;
  types: Partial<Record<ProductType, number>>;
  genres: Partial<Record<Genre, number>>;
  levels: Partial<Record<Level, number>>;
  prices: Partial<Record<PriceFilter, number>>;
}

export interface SearchResult {
  items: CatalogProduct[];
  total: number;
  facets: SearchFacets;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface SearchOptions {
  arrangers?: readonly Arranger[];
  pageSize?: number;
}

function increment<K extends PropertyKey>(target: Partial<Record<K, number>>, key: K): void {
  target[key] = (target[key] ?? 0) + 1;
}

function matchesPrice(product: CatalogProduct, price: PriceFilter, now: Date): boolean {
  const amount = effectivePrice(product, now);
  if (price === "free") return amount === 0;
  if (price === "paid") return amount > 0;
  if (price === "under2000") return amount > 0 && amount < 2_000;
  return true;
}

function buildSearchText(
  product: CatalogProduct,
  arrangerNames: ReadonlyMap<string, string>,
): string[] {
  const instruments = product.instrumentIds.flatMap((id) => {
    const instrument = getInstrument(id);
    return instrument ? [instrument.label, ...instrument.aliases] : [];
  });
  const arrangerName = product.arrangerId ? arrangerNames.get(product.arrangerId) : null;
  return [product.title, product.artist ?? "", arrangerName ?? "", ...product.tags, ...instruments];
}

function createFacets(products: readonly CatalogProduct[], now: Date): SearchFacets {
  const facets: SearchFacets = {
    instruments: {},
    groups: {},
    formats: {},
    types: {},
    genres: {},
    levels: {},
    prices: { all: products.length },
  };

  for (const product of products) {
    for (const instrumentId of new Set(product.instrumentIds)) {
      increment(facets.instruments, instrumentId);
    }
    const groups = new Set(
      product.instrumentIds
        .map((instrumentId) => getInstrument(instrumentId)?.group)
        .filter((group): group is InstrumentGroup => Boolean(group)),
    );
    for (const group of groups) increment(facets.groups, group);
    for (const format of new Set(product.formats)) increment(facets.formats, format);
    increment(facets.types, product.type);
    increment(facets.genres, product.genre);
    if (product.levelRhythm) increment(facets.levels, product.levelRhythm);
    if (product.levelTechnique && product.levelTechnique !== product.levelRhythm) {
      increment(facets.levels, product.levelTechnique);
    }
    const amount = effectivePrice(product, now);
    if (amount === 0) increment(facets.prices, "free");
    if (amount > 0) increment(facets.prices, "paid");
    if (amount > 0 && amount < 2_000) increment(facets.prices, "under2000");
  }
  return facets;
}

export function applySearch(
  products: readonly CatalogProduct[],
  inputQuery: SearchQuery | Partial<SearchQuery>,
  now: Date = new Date(),
  options: SearchOptions = {},
): SearchResult {
  const query = mergeSearchQuery(inputQuery);
  const arrangerNames = new Map(
    (options.arrangers ?? []).map((arranger) => [arranger.id, arranger.name]),
  );

  const filtered = products.filter((product) => {
    if (!isPurchasable(product)) return false;
    if (query.q && !matches(buildSearchText(product, arrangerNames), query.q)) return false;
    if (query.instrument && !product.instrumentIds.includes(query.instrument)) return false;
    if (
      query.group &&
      !product.instrumentIds.some((id) => getInstrument(id)?.group === query.group)
    ) {
      return false;
    }
    if (query.format && !product.formats.includes(query.format)) return false;
    if (query.type && product.type !== query.type) return false;
    if (query.genre && product.genre !== query.genre) return false;
    if (
      query.level &&
      product.levelRhythm !== query.level &&
      product.levelTechnique !== query.level
    ) {
      return false;
    }
    return matchesPrice(product, query.price, now);
  });

  const sorted = filtered.toSorted((a, b) => {
    if (query.sort === "new") {
      return (
        Date.parse(b.publishedAt ?? "1970-01-01") - Date.parse(a.publishedAt ?? "1970-01-01") ||
        b.id - a.id
      );
    }
    if (query.sort === "price-asc") {
      return effectivePrice(a, now) - effectivePrice(b, now) || a.id - b.id;
    }
    if (query.sort === "price-desc") {
      return effectivePrice(b, now) - effectivePrice(a, now) || a.id - b.id;
    }
    return b.salesCount - a.salesCount || b.id - a.id;
  });

  const pageSize = Math.max(1, Math.floor(options.pageSize ?? SEARCH_PAGE_SIZE));
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total: sorted.length,
    facets: createFacets(sorted, now),
    page,
    pageSize,
    pageCount,
  };
}

export function instrumentsWithProducts(facets: SearchFacets) {
  return INSTRUMENTS.filter((instrument) => (facets.instruments[instrument.id] ?? 0) > 0);
}

export function groupsWithProducts(facets: SearchFacets) {
  return INSTRUMENT_GROUPS.filter((group) => (facets.groups[group.id] ?? 0) > 0);
}
