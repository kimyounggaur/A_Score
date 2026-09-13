import Link from "next/link";
import { ChevronDown, Guitar, Music2 } from "lucide-react";

import { MobileInstrumentSheet } from "@/components/layout/mobile-instrument-sheet";

import {
  INSTRUMENT_GROUPS,
  INSTRUMENT_GROUP,
  INSTRUMENT_ID,
  INSTRUMENTS,
  type InstrumentDefinition,
  type InstrumentId,
} from "@/lib/catalog/taxonomy";

const featuredIds = [
  INSTRUMENT_ID.ACOUSTIC_GUITAR,
  INSTRUMENT_ID.PIANO,
  INSTRUMENT_ID.DRUMS,
  INSTRUMENT_ID.ELECTRIC_GUITAR,
  INSTRUMENT_ID.BASS,
  INSTRUMENT_ID.UKULELE,
  INSTRUMENT_ID.KALIMBA,
  INSTRUMENT_ID.FLUTE,
] as const;

const featuredIdSet = new Set<InstrumentId>(featuredIds);

type InstrumentMenuProps = {
  counts: Partial<Record<InstrumentId, number>>;
};

function InstrumentLink({
  instrument,
  count,
}: {
  instrument: InstrumentDefinition;
  count: number;
}) {
  return (
    <Link
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink-700 shadow-sm hover:border-brand-400 hover:text-cta"
      href={`/instruments/${instrument.id}`}
    >
      {instrument.group === INSTRUMENT_GROUP.GUITAR ? (
        <Guitar className="size-5" strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <Music2 className="size-5" strokeWidth={1.5} aria-hidden="true" />
      )}
      <span>{instrument.label}</span>
      <span className="text-xs font-normal text-text-muted">{count}</span>
    </Link>
  );
}

function FullInstrumentList({ counts, idPrefix }: InstrumentMenuProps & { idPrefix: string }) {
  return (
    <div className="space-y-6">
      {INSTRUMENT_GROUPS.map((group) => {
        const instruments = INSTRUMENTS.filter(
          (instrument) => instrument.group === group.id && (counts[instrument.id] ?? 0) > 0,
        );
        if (instruments.length === 0) return null;

        return (
          <section key={group.id} aria-labelledby={`${idPrefix}-instrument-group-${group.id}`}>
            <h3
              className="mb-2 text-sm font-bold text-ink-900"
              id={`${idPrefix}-instrument-group-${group.id}`}
            >
              {group.label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {instruments.map((instrument) => (
                <InstrumentLink
                  count={counts[instrument.id] ?? 0}
                  instrument={instrument}
                  key={instrument.id}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function InstrumentMenu({ counts }: InstrumentMenuProps) {
  const featured = INSTRUMENTS.filter((instrument) => featuredIdSet.has(instrument.id)).filter(
    (instrument) => (counts[instrument.id] ?? 0) > 0,
  );

  return (
    <section
      className="border-y border-line bg-canvas py-4"
      aria-labelledby="instrument-menu-heading"
    >
      <div className="page-shell">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2
            className="font-display text-lg font-semibold text-ink-900"
            id="instrument-menu-heading"
          >
            악기로 찾아봐요
          </h2>

          <MobileInstrumentSheet>
            <div className="p-5">
              <p className="mb-4 text-sm text-text-muted">상품이 있는 악기만 보여드려요.</p>
              <FullInstrumentList counts={counts} idPrefix="mobile" />
            </div>
          </MobileInstrumentSheet>

          <div className="hidden md:block">
            <button
              className="flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-cta hover:bg-brand-50"
              type="button"
              popoverTarget="desktop-instrument-popover"
            >
              전체 악기 <ChevronDown className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
            <nav
              aria-label="전체 악기"
              className="fixed right-8 top-[calc(var(--header-h)+5rem)] m-0 max-h-[70vh] w-[min(44rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-xl xl:right-[calc((100vw-75rem)/2)]"
              id="desktop-instrument-popover"
              popover="auto"
            >
              <p className="mb-4 text-sm text-text-muted">상품이 있는 악기만 보여드려요.</p>
              <FullInstrumentList counts={counts} idPrefix="desktop" />
            </nav>
          </div>
        </div>

        <div className="-mx-2 flex snap-x gap-2 overflow-x-auto px-2 pb-1" role="list">
          {featured.map((instrument) => (
            <div className="shrink-0 snap-start" key={instrument.id} role="listitem">
              <InstrumentLink count={counts[instrument.id] ?? 0} instrument={instrument} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
