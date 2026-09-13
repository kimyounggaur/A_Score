import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { SearchQuery } from "@/lib/search/query";

function queryHref(query: SearchQuery, page: number, basePath: string) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.instrument) params.set("instrument", query.instrument);
  if (query.group) params.set("group", query.group);
  if (query.format) params.set("format", query.format);
  if (query.type) params.set("type", query.type);
  if (query.genre) params.set("genre", query.genre);
  if (query.level) params.set("level", String(query.level));
  if (query.price !== "all") params.set("price", query.price);
  if (query.sort !== "popular") params.set("sort", query.sort);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return value ? `${basePath}?${value}` : basePath;
}

export function Pagination({
  query,
  page,
  pageCount,
  basePath = "/scores",
}: {
  query: SearchQuery;
  page: number;
  pageCount: number;
  basePath?: string;
}) {
  if (pageCount <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => start + index);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="검색 결과 페이지">
      {page > 1 ? (
        <Link
          className="inline-flex size-11 items-center justify-center rounded-lg border border-line bg-surface hover:border-brand-400"
          href={queryHref(query, page - 1, basePath)}
          aria-label="이전 페이지"
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      ) : null}
      {pages.map((item) => (
        <Link
          className={`inline-flex size-11 items-center justify-center rounded-lg text-sm font-semibold ${item === page ? "bg-cta text-surface" : "border border-line bg-surface text-ink-700 hover:border-brand-400"}`}
          href={queryHref(query, item, basePath)}
          key={item}
          aria-current={item === page ? "page" : undefined}
        >
          {item}
        </Link>
      ))}
      {page < pageCount ? (
        <Link
          className="inline-flex size-11 items-center justify-center rounded-lg border border-line bg-surface hover:border-brand-400"
          href={queryHref(query, page + 1, basePath)}
          aria-label="다음 페이지"
        >
          <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
