"use client";

import { Button } from "@/components/ui/button";
import {
  GENRES,
  INSTRUMENT_GROUPS,
  INSTRUMENTS,
  LEVELS,
  NOTATION_FORMATS,
  PRODUCT_TYPES,
} from "@/lib/catalog/taxonomy";
import type { SearchQuery } from "@/lib/search/query";

const priceOptions = [
  { id: "free", label: "무료" },
  { id: "paid", label: "유료" },
  { id: "under2000", label: "2,000원 미만" },
] as const;

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export function SearchActiveFilters({
  query,
  onRemove,
  onReset,
}: {
  query: SearchQuery;
  onRemove: (name: string) => void;
  onReset: () => void;
}) {
  const candidates: Array<{ name: string; label: string | null | undefined }> = [
    {
      name: "group",
      label: query.group ? INSTRUMENT_GROUPS.find((item) => item.id === query.group)?.label : null,
    },
    {
      name: "instrument",
      label: query.instrument
        ? INSTRUMENTS.find((item) => item.id === query.instrument)?.label
        : null,
    },
    {
      name: "format",
      label: query.format ? NOTATION_FORMATS.find((item) => item.id === query.format)?.label : null,
    },
    {
      name: "type",
      label: query.type ? PRODUCT_TYPES.find((item) => item.id === query.type)?.label : null,
    },
    {
      name: "genre",
      label: query.genre ? GENRES.find((item) => item.id === query.genre)?.label : null,
    },
    {
      name: "level",
      label: query.level ? LEVELS.find((item) => item.id === query.level)?.label : null,
    },
    {
      name: "price",
      label:
        query.price !== "all" ? priceOptions.find((item) => item.id === query.price)?.label : null,
    },
  ];
  const filters = candidates.filter((filter): filter is { name: string; label: string } =>
    Boolean(filter.label),
  );

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <button
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand-50 px-3 text-sm font-medium text-brand-800 hover:bg-brand-100"
          key={filter.name}
          type="button"
          aria-label={`${filter.label} 필터 해제`}
          onClick={() => onRemove(filter.name)}
        >
          {filter.label}
          <CloseIcon />
        </button>
      ))}
      <Button className="min-h-11" variant="ghost" onClick={onReset}>
        <ResetIcon /> 필터 초기화
      </Button>
    </div>
  );
}
