"use client";

import { useEffect, useState } from "react";

import { RECENT_SEARCH_LIMIT } from "@/lib/config/search";

const RECENT_SEARCH_KEY = "ss.mock.recent-searches.v1";

function readRecentSearches(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(value: string) {
  const normalized = value.trim();
  if (!normalized) return;
  const next = [normalized, ...readRecentSearches().filter((item) => item !== normalized)].slice(
    0,
    RECENT_SEARCH_LIMIT,
  );
  window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
}

export function SearchRecentSearches({
  onSelect,
  revision,
}: {
  onSelect: (value: string) => void;
  revision: number;
}) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setRecentSearches(readRecentSearches()), 0);
    return () => window.clearTimeout(timer);
  }, [revision]);

  if (recentSearches.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="최근 검색어">
      <span className="text-xs font-medium text-text-muted">최근 검색</span>
      {recentSearches.map((item) => (
        <button
          className="min-h-11 rounded-full bg-muted px-3 text-sm text-ink-700 hover:bg-brand-50"
          type="button"
          key={item}
          onClick={() => onSelect(item)}
        >
          {item}
        </button>
      ))}
      <button
        className="min-h-11 px-2 text-xs font-semibold text-text-muted hover:text-cta"
        type="button"
        onClick={() => {
          window.localStorage.removeItem(RECENT_SEARCH_KEY);
          setRecentSearches([]);
        }}
      >
        모두 삭제
      </button>
    </div>
  );
}
