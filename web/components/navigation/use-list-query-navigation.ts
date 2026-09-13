"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type ParamValue = string | number | null | undefined;

export function useListQueryNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (changes: Readonly<Record<string, ParamValue>>, mode: "replace" | "push") => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === undefined || value === "" || value === "all") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }
      const href = next.size > 0 ? `${pathname}?${next.toString()}` : pathname;
      router[mode](href, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const replaceFilters = useCallback(
    (changes: Readonly<Record<string, ParamValue>>) =>
      navigate({ ...changes, page: null }, "replace"),
    [navigate],
  );

  const pushPage = useCallback((page: number) => navigate({ page }, "push"), [navigate]);

  return { searchParams, replaceFilters, pushPage };
}
