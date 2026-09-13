"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

export function MobileSearchFilterSheet({
  activeFilterCount,
  children,
}: {
  activeFilterCount: number;
  children: ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="min-h-11" variant="outline">
          <FilterIcon /> 필터
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-cta px-2 py-0.5 text-xs text-surface">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto" side="bottom">
        <SheetHeader>
          <SheetTitle>검색 필터</SheetTitle>
          <SheetDescription>결과가 있는 항목만 보여드려요.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-8">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
