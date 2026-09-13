import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { resolveSampleImage } from "@/lib/catalog/assets";
import {
  INSTRUMENT_GROUP,
  INSTRUMENT_ID,
  NOTATION_FORMAT,
  NOTATION_FORMATS,
  PRODUCT_TYPE,
  getInstrument,
  type InstrumentGroup,
  type NotationFormat,
} from "@/lib/catalog/taxonomy";
import type { CatalogProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

const toneClasses: Record<InstrumentGroup, string> = {
  [INSTRUMENT_GROUP.GUITAR]: "bg-brand-50 text-brand-800",
  [INSTRUMENT_GROUP.KEYBOARD]: "bg-point-bg text-point-ink",
  [INSTRUMENT_GROUP.PERCUSSION]: "bg-sale-bg text-sale",
  [INSTRUMENT_GROUP.STRINGS]: "bg-secondary text-ink-700",
  [INSTRUMENT_GROUP.WINDS]: "bg-canvas text-ink-700",
  [INSTRUMENT_GROUP.TRADITIONAL]: "bg-free-bg text-free",
  [INSTRUMENT_GROUP.ETC]: "bg-muted text-ink-700",
};

function primaryFormat(formats: NotationFormat[]): NotationFormat {
  const priority = [
    NOTATION_FORMAT.COLOR,
    NOTATION_FORMAT.TAB,
    NOTATION_FORMAT.DRUM_NOTATION,
    NOTATION_FORMAT.CHORD_CHART,
    NOTATION_FORMAT.NUMBER,
    NOTATION_FORMAT.STANDARD,
    NOTATION_FORMAT.MELODY,
  ] as const;
  return priority.find((format) => formats.includes(format)) ?? NOTATION_FORMAT.STANDARD;
}

function productBadge(product: CatalogProduct) {
  if (product.type === PRODUCT_TYPE.BUNDLE) return <Badge variant="bundle">악보집</Badge>;
  if (product.type === PRODUCT_TYPE.BAND_SET) return <Badge variant="band-set">밴드세트</Badge>;
  if (product.formats.includes(NOTATION_FORMAT.COLOR)) {
    return <Badge variant="color-score">색깔악보</Badge>;
  }
  return null;
}

function StaffNotation({ seed }: { seed: number }) {
  const noteXs = [42, 60, 78, 96, 114];
  return (
    <>
      {[35, 44, 53, 62, 71].map((y) => (
        <line className="stroke-current opacity-45" key={y} x1="14" x2="126" y1={y} y2={y} />
      ))}
      <text className="fill-current" fontSize="34" x="14" y="69">
        𝄞
      </text>
      {noteXs.map((x, index) => {
        const y = 39 + ((seed + index * 7) % 4) * 9;
        return (
          <g key={x}>
            <ellipse className="fill-current" cx={x} cy={y} rx="4.5" ry="3.5" />
            <line className="stroke-current" x1={x + 4} x2={x + 4} y1={y} y2={y - 18} />
          </g>
        );
      })}
    </>
  );
}

function TabNotation({ lines, seed }: { lines: number; seed: number }) {
  return (
    <>
      {Array.from({ length: lines }, (_, index) => 30 + index * (42 / Math.max(lines - 1, 1))).map(
        (y) => (
          <line className="stroke-current opacity-50" key={y} x1="14" x2="126" y1={y} y2={y} />
        ),
      )}
      {[28, 56, 84, 112].map((x, index) => (
        <text
          className="fill-current text-xs font-bold"
          key={x}
          textAnchor="middle"
          x={x}
          y={42 + ((seed + index) % 3) * 12}
        >
          {(seed + index * 2) % 9}
        </text>
      ))}
      <text className="fill-current text-xs font-bold" x="14" y="20">
        TAB
      </text>
    </>
  );
}

function DrumNotation({ seed }: { seed: number }) {
  return (
    <>
      {[34, 44, 54, 64, 74].map((y) => (
        <line className="stroke-current opacity-45" key={y} x1="14" x2="126" y1={y} y2={y} />
      ))}
      {[28, 52, 76, 100].map((x, index) => {
        const y = 34 + ((seed + index) % 5) * 10;
        return (
          <g key={x}>
            <line className="stroke-current" x1={x - 4} x2={x + 4} y1={y - 4} y2={y + 4} />
            <line className="stroke-current" x1={x + 4} x2={x - 4} y1={y - 4} y2={y + 4} />
            <line className="stroke-current" x1={x + 4} x2={x + 4} y1={y} y2={y - 18} />
          </g>
        );
      })}
    </>
  );
}

function ChordNotation() {
  return (
    <>
      {[34, 48, 62, 76, 90, 104].map((x) => (
        <line className="stroke-current opacity-55" key={x} x1={x} x2={x} y1="26" y2="82" />
      ))}
      {[26, 40, 54, 68, 82].map((y) => (
        <line className="stroke-current opacity-55" key={y} x1="34" x2="104" y1={y} y2={y} />
      ))}
      <circle className="fill-current" cx="48" cy="47" r="4" />
      <circle className="fill-current" cx="76" cy="61" r="4" />
      <circle className="fill-current" cx="90" cy="33" r="4" />
    </>
  );
}

function ColorNotation({ seed }: { seed: number }) {
  const tones = ["text-sale", "text-brand-600", "text-point-ink", "text-free", "text-ink-700"];
  return (
    <>
      {[26, 48, 70, 92, 114].map((x, index) => (
        <g className={tones[(seed + index) % tones.length]} key={x}>
          <circle className="fill-current" cx={x} cy={68 - ((seed + index) % 3) * 13} r="7" />
          <line
            className="stroke-current"
            strokeWidth="3"
            x1={x + 6}
            x2={x + 6}
            y1={68 - ((seed + index) % 3) * 13}
            y2={30 - ((seed + index) % 3) * 8}
          />
        </g>
      ))}
    </>
  );
}

function NumberNotation({ seed }: { seed: number }) {
  return (
    <>
      <text
        className="fill-current text-2xl font-bold tracking-[0.2em]"
        textAnchor="middle"
        x="70"
        y="60"
      >
        {`${(seed % 7) + 1} ${(seed % 5) + 2} ${(seed % 6) + 1}`}
      </text>
      <line className="stroke-current opacity-50" x1="24" x2="116" y1="72" y2="72" />
    </>
  );
}

export function NotationThumbnail({
  product,
  className,
  priority = false,
}: {
  product: CatalogProduct;
  className?: string;
  priority?: boolean;
}) {
  const instrument = getInstrument(product.instrumentIds[0] ?? "");
  const format = primaryFormat(product.formats);
  const formatLabel = NOTATION_FORMATS.find((item) => item.id === format)?.label ?? "오선";
  const label = `${instrument?.label ?? "악기"} ${formatLabel} 악보 미리보기`;
  const isFourString =
    product.instrumentIds.includes(INSTRUMENT_ID.BASS) ||
    product.instrumentIds.includes(INSTRUMENT_ID.UKULELE);
  const sampleImage = resolveSampleImage(product.sampleAssetId);

  return (
    <div
      className={cn(
        "relative aspect-[4/5] overflow-hidden rounded-xl border border-line",
        toneClasses[instrument?.group ?? INSTRUMENT_GROUP.ETC],
        className,
      )}
    >
      {sampleImage ? (
        <Image
          className="object-cover object-top"
          src={sampleImage}
          alt={label}
          fill
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          sizes={
            priority
              ? "(max-width: 1024px) calc(100vw - 2rem), 22rem"
              : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          }
        />
      ) : (
        <svg className="h-full w-full" role="img" aria-label={label} viewBox="0 0 140 112">
          <title>{label}</title>
          {format === NOTATION_FORMAT.TAB ? (
            <TabNotation lines={isFourString ? 4 : 6} seed={product.id} />
          ) : format === NOTATION_FORMAT.DRUM_NOTATION ? (
            <DrumNotation seed={product.id} />
          ) : format === NOTATION_FORMAT.CHORD_CHART ? (
            <ChordNotation />
          ) : format === NOTATION_FORMAT.COLOR ? (
            <ColorNotation seed={product.id} />
          ) : format === NOTATION_FORMAT.NUMBER ? (
            <NumberNotation seed={product.id} />
          ) : (
            <StaffNotation seed={product.id} />
          )}
        </svg>
      )}
      <div className="absolute right-2 top-2">{productBadge(product)}</div>
      <span className="absolute bottom-2 left-2 rounded-md bg-surface/90 px-2 py-1 text-xs font-semibold text-ink-700">
        {formatLabel}
      </span>
    </div>
  );
}
