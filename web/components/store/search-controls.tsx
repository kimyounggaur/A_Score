"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import { SEARCH_DEBOUNCE_MS } from "@/lib/config/search";
import type { SearchFacets } from "@/lib/search/filter";
import type { SearchQuery } from "@/lib/search/query";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FilterIcon() {
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
      <path d="M10 5H3m9 14H3m11-16v4m2 10v4m5-9h-9m9 7h-5M10 3v4m2 10v4" />
    </svg>
  );
}

const MobileSearchFilterSheet = dynamic(
  () =>
    import("@/components/store/mobile-search-filter-sheet").then(
      (module) => module.MobileSearchFilterSheet,
    ),
  {
    ssr: false,
    loading: () => (
      <button
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-4 text-sm font-medium disabled:opacity-50"
        type="button"
        disabled
        aria-label="필터 불러오는 중"
      >
        <FilterIcon /> 필터
      </button>
    ),
  },
);

const FilterFields = dynamic(
  () =>
    import("@/components/store/search-filter-fields").then((module) => module.SearchFilterFields),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-72 animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
        aria-busy="true"
      >
        <span className="sr-only">검색 필터를 불러오고 있어요.</span>
      </div>
    ),
  },
);

const ActiveFilterChips = dynamic(
  () =>
    import("@/components/store/search-active-filters").then((module) => module.SearchActiveFilters),
  { ssr: false },
);

const RecentSearches = dynamic(
  () =>
    import("@/components/store/search-recent-searches").then(
      (module) => module.SearchRecentSearches,
    ),
  { ssr: false },
);

const sortOptions = [
  { id: "popular", label: "인기순" },
  { id: "new", label: "최신순" },
  { id: "price-asc", label: "낮은 가격순" },
  { id: "price-desc", label: "높은 가격순" },
] as const;

type SearchControlsProps = {
  query: SearchQuery;
  facets: SearchFacets;
};

export function SearchControls({ query, facets }: SearchControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchText, setSearchText] = useState(query.q);
  const [recentRevision, setRecentRevision] = useState(0);

  const replaceParams = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutator(next);
      const queryString = next.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  function update(name: string, value: string | null) {
    replaceParams((params) => {
      if (value && value !== "all") params.set(name, value);
      else params.delete(name);
      params.delete("page");
    });
  }

  function rememberSearch(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    void import("@/components/store/search-recent-searches").then(({ saveRecentSearch }) => {
      saveRecentSearch(normalized);
      setRecentRevision((revision) => revision + 1);
    });
  }

  useEffect(() => {
    if (searchText === query.q) return;
    const timer = window.setTimeout(() => {
      replaceParams((params) => {
        const normalized = searchText.trim();
        if (normalized) params.set("q", normalized);
        else params.delete("q");
        params.delete("page");
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query.q, replaceParams, searchText]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    rememberSearch(searchText);
    update("q", searchText.trim() || null);
  }

  const activeFilterCount = [
    query.group,
    query.instrument,
    query.format,
    query.type,
    query.genre,
    query.level,
    query.price !== "all" ? query.price : null,
  ].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0;

  return (
    <>
      <form className="relative" role="search" onSubmit={submitSearch}>
        <label className="sr-only" htmlFor="score-search">
          악보 검색
        </label>
        <SearchIcon />
        <input
          className="h-12 w-full min-w-0 rounded-lg border border-input bg-surface py-2 pl-10 pr-12 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          id="score-search"
          name="q"
          placeholder="곡명, 아티스트, 악기를 검색해 보세요"
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          onBlur={() => rememberSearch(searchText)}
        />
        {searchText ? (
          <button
            className="absolute right-0 top-0 inline-flex size-12 items-center justify-center text-xl leading-none text-ink-600"
            type="button"
            aria-label="검색어 지우기"
            onClick={() => setSearchText("")}
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </form>

      {!query.q ? <RecentSearches onSelect={setSearchText} revision={recentRevision} /> : null}

      <div className="sticky top-[var(--header-h)] z-20 -mx-2 mt-5 flex items-center justify-between gap-3 border-y border-line bg-surface/95 px-2 py-2 backdrop-blur lg:hidden">
        <MobileSearchFilterSheet activeFilterCount={activeFilterCount}>
          <FilterFields facets={facets} idPrefix="mobile" query={query} update={update} />
        </MobileSearchFilterSheet>

        <select
          className="min-h-11 rounded-lg border border-input bg-surface px-3 text-sm"
          aria-label="정렬"
          value={query.sort}
          onChange={(event) => update("sort", event.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {hasFilters ? (
        <ActiveFilterChips
          query={query}
          onRemove={(name) => update(name, null)}
          onReset={() => router.replace(pathname)}
        />
      ) : null}

      <aside className="hidden lg:block" aria-label="검색 필터">
        <div className="mb-5 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink-900">필터</h2>
          {hasFilters ? (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium hover:bg-muted"
              type="button"
              onClick={() => router.replace(pathname)}
            >
              초기화
            </button>
          ) : null}
        </div>
        <div className="mb-6 space-y-2">
          <label className="text-sm font-medium" htmlFor="desktop-sort">
            정렬
          </label>
          <select
            className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"
            id="desktop-sort"
            value={query.sort}
            onChange={(event) => update("sort", event.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <FilterFields facets={facets} idPrefix="desktop" query={query} update={update} />
      </aside>
    </>
  );
}
