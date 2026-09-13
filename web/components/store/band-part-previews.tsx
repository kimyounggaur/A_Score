"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { resolveSampleImage } from "@/lib/catalog/assets";
import type { BandSetPart } from "@/lib/catalog/types";

export function BandPartPreviews({ parts, title }: { parts: BandSetPart[]; title: string }) {
  const available = useMemo(
    () =>
      parts.flatMap((part) => {
        const src = resolveSampleImage(part.sampleAssetId ?? null);
        return src ? [{ ...part, src }] : [];
      }),
    [parts],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const active = available[activeIndex] ?? available[0];

  useEffect(() => {
    const syncFromUrl = () => {
      const requestedPart = new URL(window.location.href).searchParams.get("part");
      const requestedIndex = available.findIndex((part) => part.instrumentId === requestedPart);
      setActiveIndex(requestedIndex >= 0 ? requestedIndex : 0);

      if (requestedPart && requestedIndex < 0) {
        const url = new URL(window.location.href);
        url.searchParams.delete("part");
        window.history.replaceState(window.history.state, "", url);
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [available]);

  if (!active) return null;

  const selectPart = (index: number, pushHistory = true) => {
    const nextIndex = (index + available.length) % available.length;
    setActiveIndex(nextIndex);
    if (pushHistory) {
      const url = new URL(window.location.href);
      const nextPart = available[nextIndex];
      if (nextPart) url.searchParams.set("part", nextPart.instrumentId);
      window.history.pushState(window.history.state, "", url);
    }
    return nextIndex;
  };

  const moveFocus = (index: number) => {
    const nextIndex = selectPart(index);
    window.requestAnimationFrame(() => document.getElementById(`part-tab-${nextIndex}`)?.focus());
  };

  return (
    <div className="mt-5">
      <div
        className="flex max-w-full gap-2 overflow-x-auto"
        role="tablist"
        aria-label="파트별 미리보기"
      >
        {available.map((part, index) => (
          <button
            className={`inline-flex min-h-11 shrink-0 items-center rounded-lg border px-3 text-sm font-semibold ${
              index === activeIndex
                ? "border-cta bg-brand-50 text-cta"
                : "border-line bg-surface text-ink-700"
            }`}
            id={`part-tab-${index}`}
            key={`${part.instrumentId}-${part.label}`}
            type="button"
            role="tab"
            aria-controls={`part-panel-${index}`}
            aria-selected={index === activeIndex}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => selectPart(index)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveFocus(index + 1);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveFocus(index - 1);
              } else if (event.key === "Home") {
                event.preventDefault();
                moveFocus(0);
              } else if (event.key === "End") {
                event.preventDefault();
                moveFocus(available.length - 1);
              }
            }}
          >
            {part.label}
          </button>
        ))}
      </div>
      <div
        className="mt-3 max-w-md overflow-hidden rounded-xl border border-line bg-surface"
        id={`part-panel-${activeIndex}`}
        role="tabpanel"
        aria-labelledby={`part-tab-${activeIndex}`}
      >
        <Image
          className="h-auto w-full"
          src={active.src}
          alt={`${title} ${active.label} 파트 워터마크 미리보기`}
          width={768}
          height={1000}
        />
      </div>
    </div>
  );
}
