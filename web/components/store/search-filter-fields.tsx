"use client";

import { Label } from "@/components/ui/label";
import {
  GENRES,
  INSTRUMENT_GROUPS,
  INSTRUMENTS,
  LEVELS,
  NOTATION_FORMATS,
  PRODUCT_TYPES,
} from "@/lib/catalog/taxonomy";
import type { SearchFacets } from "@/lib/search/filter";
import type { SearchQuery } from "@/lib/search/query";

const priceOptions = [
  { id: "all", label: "전체 가격" },
  { id: "free", label: "무료" },
  { id: "paid", label: "유료" },
  { id: "under2000", label: "2,000원 미만" },
] as const;

export function SearchFilterFields({
  query,
  facets,
  update,
  idPrefix,
}: {
  query: SearchQuery;
  facets: SearchFacets;
  update: (name: string, value: string | null) => void;
  idPrefix: string;
}) {
  const instrumentOptions = INSTRUMENTS.filter(
    (instrument) => (facets.instruments[instrument.id] ?? 0) > 0,
  );
  const groupOptions = INSTRUMENT_GROUPS.filter((group) => (facets.groups[group.id] ?? 0) > 0);
  const formatOptions = NOTATION_FORMATS.filter((format) => (facets.formats[format.id] ?? 0) > 0);
  const typeOptions = PRODUCT_TYPES.filter((type) => (facets.types[type.id] ?? 0) > 0);
  const genreOptions = GENRES.filter((genre) => (facets.genres[genre.id] ?? 0) > 0);
  const levelOptions = LEVELS.filter((level) => (facets.levels[level.id] ?? 0) > 0);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-group-filter`}>악기군</Label>
        <select
          className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
          id={`${idPrefix}-group-filter`}
          value={query.group ?? ""}
          onChange={(event) => update("group", event.target.value || null)}
        >
          <option value="">전체 악기군</option>
          {groupOptions.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label} ({facets.groups[group.id]})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-instrument-filter`}>악기</Label>
        <select
          className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
          id={`${idPrefix}-instrument-filter`}
          value={query.instrument ?? ""}
          onChange={(event) => update("instrument", event.target.value || null)}
        >
          <option value="">전체 악기</option>
          {instrumentOptions.map((instrument) => (
            <option key={instrument.id} value={instrument.id}>
              {instrument.label} ({facets.instruments[instrument.id]})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-format-filter`}>기보 형식</Label>
        <select
          className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
          id={`${idPrefix}-format-filter`}
          value={query.format ?? ""}
          onChange={(event) => update("format", event.target.value || null)}
        >
          <option value="">전체 형식</option>
          {formatOptions.map((format) => (
            <option key={format.id} value={format.id}>
              {format.label} ({facets.formats[format.id]})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-type-filter`}>상품 유형</Label>
        <select
          className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
          id={`${idPrefix}-type-filter`}
          value={query.type ?? ""}
          onChange={(event) => update("type", event.target.value || null)}
        >
          <option value="">전체 유형</option>
          {typeOptions.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label} ({facets.types[type.id]})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-genre-filter`}>장르</Label>
        <select
          className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
          id={`${idPrefix}-genre-filter`}
          value={query.genre ?? ""}
          onChange={(event) => update("genre", event.target.value || null)}
        >
          <option value="">전체 장르</option>
          {genreOptions.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.label} ({facets.genres[genre.id]})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-level-filter`}>난이도</Label>
        <select
          className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
          id={`${idPrefix}-level-filter`}
          value={query.level ?? ""}
          onChange={(event) => update("level", event.target.value || null)}
        >
          <option value="">전체 난이도</option>
          {levelOptions.map((level) => (
            <option key={level.id} value={level.id}>
              {level.label} ({facets.levels[level.id]})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-price-filter`}>가격</Label>
        <select
          className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
          id={`${idPrefix}-price-filter`}
          value={query.price}
          onChange={(event) => update("price", event.target.value)}
        >
          {priceOptions
            .filter((option) => option.id === "all" || (facets.prices[option.id] ?? 0) > 0)
            .map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
                {option.id === "all" ? "" : ` (${facets.prices[option.id]})`}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}
