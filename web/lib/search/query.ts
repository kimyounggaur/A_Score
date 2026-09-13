import {
  isGenre,
  isInstrumentGroup,
  isInstrumentId,
  isLevel,
  isNotationFormat,
  isProductType,
  type Genre,
  type InstrumentGroup,
  type InstrumentId,
  type Level,
  type NotationFormat,
  type ProductType,
} from "@/lib/catalog/taxonomy";

export const PRICE_FILTERS = ["all", "free", "paid", "under2000"] as const;
export const SORT_OPTIONS = ["popular", "new", "price-asc", "price-desc"] as const;

export type PriceFilter = (typeof PRICE_FILTERS)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];

export interface SearchQuery {
  q: string;
  instrument: InstrumentId | null;
  group: InstrumentGroup | null;
  format: NotationFormat | null;
  type: ProductType | null;
  genre: Genre | null;
  level: Level | null;
  price: PriceFilter;
  sort: SortOption;
  page: number;
}

export interface SearchParamsLike {
  get(name: string): string | null;
}

export const DEFAULT_SEARCH_QUERY: Readonly<SearchQuery> = Object.freeze({
  q: "",
  instrument: null,
  group: null,
  format: null,
  type: null,
  genre: null,
  level: null,
  price: "all",
  sort: "popular",
  page: 1,
});

const MAX_PAGE = 10_000;

export function parsePageValue(value: string | null | undefined): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= MAX_PAGE ? page : 1;
}

function memberOf<const T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === "string" && values.includes(value as T[number]);
}

export function parseSearchParams(params: SearchParamsLike): SearchQuery {
  const rawLevel = Number.parseInt(params.get("level") ?? "", 10);
  const instrument = params.get("instrument");
  const group = params.get("group");
  const format = params.get("format");
  const type = params.get("type");
  const genre = params.get("genre");
  const price = params.get("price");
  const sort = params.get("sort");

  return {
    q: (params.get("q") ?? "").trim().slice(0, 100),
    instrument: isInstrumentId(instrument) ? instrument : null,
    group: isInstrumentGroup(group) ? group : null,
    format: isNotationFormat(format) ? format : null,
    type: isProductType(type) ? type : null,
    genre: isGenre(genre) ? genre : null,
    level: isLevel(rawLevel) ? rawLevel : null,
    price: memberOf(PRICE_FILTERS, price) ? price : DEFAULT_SEARCH_QUERY.price,
    sort: memberOf(SORT_OPTIONS, sort) ? sort : DEFAULT_SEARCH_QUERY.sort,
    page: parsePageValue(params.get("page")),
  };
}

export function mergeSearchQuery(query: Partial<SearchQuery> = {}): SearchQuery {
  return { ...DEFAULT_SEARCH_QUERY, ...query };
}
