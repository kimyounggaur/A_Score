import Link from "next/link";
import Image from "next/image";
import { FileMusic, Headphones, Music, PackageOpen, UsersRound } from "lucide-react";

import { LevelMeter } from "@/components/store/level-meter";
import { BandPartPreviews } from "@/components/store/band-part-previews";
import { DeferredPurchasePanel } from "@/components/store/deferred-purchase-panel";
import { NotationThumbnail } from "@/components/store/notation-thumbnail";
import { ProductGrid } from "@/components/store/product-grid";
import { SaleCountdown } from "@/components/store/sale-countdown";
import { Badge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/ui/coming-soon";
import { SectionHeader } from "@/components/ui/section-header";
import { GENRES, NOTATION_FORMATS, PRODUCT_TYPE, getInstrument } from "@/lib/catalog/taxonomy";
import { resolvePreviewAudio, resolveSampleImage } from "@/lib/catalog/assets";
import {
  getProductPath,
  isBandSetProduct,
  isBundleProduct,
  isScoreProduct,
  type Arranger,
  type CatalogProduct,
} from "@/lib/catalog/types";
import {
  effectivePrice,
  formatWon,
  isFree,
  isOnSale,
  savingsAmount,
  sumPayable,
} from "@/lib/pricing";

function ProductBadges({
  product,
  recentlyPublished,
}: {
  product: CatalogProduct;
  recentlyPublished: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {isFree(product) ? <Badge variant="free">무료</Badge> : null}
      {isOnSale(product) ? <Badge variant="sale">할인</Badge> : null}
      {recentlyPublished ? <Badge variant="new">신규</Badge> : null}
      {product.type === PRODUCT_TYPE.BUNDLE ? (
        <Badge variant="bundle">악보집</Badge>
      ) : product.type === PRODUCT_TYPE.BAND_SET ? (
        <Badge variant="band-set">밴드세트</Badge>
      ) : (
        <Badge variant="secondary">단일 악보</Badge>
      )}
    </div>
  );
}

function ScoreDetails({ product }: { product: CatalogProduct }) {
  if (!isScoreProduct(product)) return null;
  const formats = product.formats
    .map((format) => NOTATION_FORMATS.find((item) => item.id === format)?.label)
    .filter((label): label is NonNullable<typeof label> => label != null);
  const genre = GENRES.find((item) => item.id === product.genre)?.label;
  const facts = [
    product.keySignature ? { label: "조성", value: product.keySignature } : null,
    product.bpm != null ? { label: "BPM", value: String(product.bpm) } : null,
    product.pages != null ? { label: "페이지", value: `${product.pages}쪽` } : null,
    formats.length > 0 ? { label: "기보 형식", value: formats.join(" + ") } : null,
    genre ? { label: "장르", value: genre } : null,
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  return (
    <section
      className="rounded-2xl border border-line bg-surface p-5"
      aria-labelledby="score-information-heading"
    >
      <h2 className="text-lg font-bold text-ink-900" id="score-information-heading">
        악보 정보
      </h2>
      <LevelMeter
        className="mt-4"
        rhythm={product.levelRhythm}
        technique={product.levelTechnique}
      />
      {facts.length > 0 ? (
        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs font-medium text-text-muted">{fact.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-ink-900">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

function BundleDetails({
  product,
  items,
  browserBacked,
}: {
  product: CatalogProduct;
  items: CatalogProduct[];
  browserBacked: boolean;
}) {
  if (!isBundleProduct(product)) return null;
  const separateTotal = sumPayable(items);
  const savings = savingsAmount(separateTotal, effectivePrice(product));

  return (
    <section
      className="rounded-2xl border border-line bg-surface p-5"
      aria-labelledby="bundle-information-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink-900" id="bundle-information-heading">
            수록곡
          </h2>
          <p className="mt-1 text-sm text-text-muted">총 {product.itemCount}곡이 들어 있어요.</p>
        </div>
        {savings > 0 ? <Badge variant="sale">낱권보다 {formatWon(savings)} 절약</Badge> : null}
      </div>
      <ol className="mt-4 divide-y divide-line">
        {items.map((item, index) => (
          <li className="flex items-center gap-3 py-3" key={item.id}>
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-ink-600"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <Link
              className="min-h-11 flex-1 content-center font-semibold text-ink-900 hover:text-cta"
              href={getProductPath(item, { browserBacked })}
            >
              {item.title}
            </Link>
            <span className="text-sm text-text-muted">{formatWon(effectivePrice(item))}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function BandSetDetails({ product }: { product: CatalogProduct }) {
  if (!isBandSetProduct(product)) return null;

  return (
    <section
      className="rounded-2xl border border-line bg-surface p-5"
      aria-labelledby="band-information-heading"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-cta"
          aria-hidden="true"
        >
          <UsersRound className="size-6" strokeWidth={1.5} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink-900" id="band-information-heading">
            파트 구성
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {product.parts.length}개 파트를 한 번에 맞춰 연주할 수 있어요.
          </p>
        </div>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {product.parts.map((part) => {
          const instrument = getInstrument(part.instrumentId);
          return (
            <li
              className="flex min-h-12 items-center gap-3 rounded-xl bg-muted px-4"
              key={`${part.instrumentId}-${part.label}`}
            >
              <Music className="size-5 text-cta" strokeWidth={1.5} aria-hidden="true" />
              <span className="font-semibold text-ink-900">{part.label}</span>
              {instrument && part.label !== instrument.label ? (
                <span className="text-xs text-ink-600">{instrument.label}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm leading-6 text-ink-600">
        파트별 악보를 같은 마디 기준으로 정리해 합주 준비 시간을 줄였어요.
      </p>
      <BandPartPreviews parts={product.parts} title={product.title} />
    </section>
  );
}

function SamplePreview({ product }: { product: CatalogProduct }) {
  const sampleImage = resolveSampleImage(product.sampleAssetId);
  const previewAudio = resolvePreviewAudio(product.previewAudioId);

  return (
    <section
      className="rounded-2xl border border-line bg-surface p-5"
      aria-labelledby="preview-heading"
    >
      <h2 className="text-lg font-bold text-ink-900" id="preview-heading">
        샘플 확인
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-canvas p-4">
          <FileMusic className="size-7 text-cta" strokeWidth={1.5} aria-hidden="true" />
          <h3 className="mt-3 font-bold text-ink-900">악보 미리보기</h3>
          <p className="mt-1 text-sm leading-6 text-text-muted">
            구매 전에 기보 형식과 난이도를 확인해 보세요.
          </p>
          <div className="mt-4">
            {sampleImage ? (
              <div className="overflow-hidden rounded-lg border border-line bg-surface">
                <Image
                  className="h-auto w-full"
                  src={sampleImage}
                  alt={`${product.title} 악보 1쪽 워터마크 미리보기`}
                  width={768}
                  height={1000}
                />
              </div>
            ) : (
              <ComingSoon label="샘플 준비" />
            )}
          </div>
        </div>
        {previewAudio ? (
          <div className="rounded-xl bg-canvas p-4">
            <Headphones className="size-7 text-cta" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-3 font-bold text-ink-900">미리듣기</h3>
            <p className="mt-1 text-sm leading-6 text-text-muted">
              저작권 음원이 아닌 30초 합성 멜로디로 재생 컨트롤을 확인해요.
            </p>
            <audio className="mt-4 w-full" controls preload="none" src={previewAudio}>
              <track
                default
                kind="captions"
                src="/samples/demo-tone.vtt"
                srcLang="ko"
                label="데모 음 설명"
              />
              브라우저가 오디오 재생을 지원하지 않습니다.
            </audio>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ProductDetailView({
  product,
  arranger,
  related,
  bundleItems = [],
  recentlyPublished = false,
  browserBacked = false,
}: {
  product: CatalogProduct;
  arranger: Arranger | null;
  related: CatalogProduct[];
  bundleItems?: CatalogProduct[];
  recentlyPublished?: boolean;
  browserBacked?: boolean;
}) {
  const productPath = getProductPath(product, { browserBacked });
  const instruments = product.instrumentIds
    .map((id) => getInstrument(id)?.label)
    .filter((label): label is NonNullable<typeof label> => label != null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    category: product.type,
    offers: {
      "@type": "Offer",
      price: effectivePrice(product),
      priceCurrency: "KRW",
      availability: "https://schema.org/InStock",
      url: productPath,
    },
  };

  return (
    <div className="page-shell pb-60 pt-8 lg:pb-16 lg:pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)_18rem] lg:items-start">
        <NotationThumbnail className="w-full" product={product} priority />

        <article className="min-w-0">
          <ProductBadges product={product} recentlyPublished={recentlyPublished} />
          <h1 className="mt-3 text-3xl font-bold leading-tight text-ink-900 md:text-4xl">
            {product.title}
          </h1>
          {product.artist ? <p className="mt-3 text-lg text-ink-600">{product.artist}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-muted">
            {instruments.length > 0 ? <span>{instruments.join(" · ")}</span> : null}
            {arranger ? (
              <Link
                className="inline-flex min-h-11 items-center px-1 font-semibold text-cta hover:text-cta-hover"
                href={`/arrangers/${arranger.id}`}
              >
                편곡 {arranger.name}
              </Link>
            ) : null}
          </div>
          {isOnSale(product) && product.saleEndsAt ? (
            <div className="mt-4">
              <SaleCountdown endAt={product.saleEndsAt} />
            </div>
          ) : null}

          {product.tags.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="상품 태그">
              {product.tags.map((tag) => (
                <li className="rounded-full bg-muted px-3 py-1.5 text-sm text-ink-600" key={tag}>
                  #{tag}
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <DeferredPurchasePanel product={product} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <ScoreDetails product={product} />
          <BundleDetails product={product} items={bundleItems} browserBacked={browserBacked} />
          <BandSetDetails product={product} />
          <SamplePreview product={product} />
        </div>
        <aside className="hidden rounded-2xl bg-brand-50 p-5 lg:block">
          <PackageOpen className="size-7 text-cta" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="mt-3 font-bold text-ink-900">디지털 상품 안내</h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            결제 후 보관함에서 받아요. 실제 PDF 다운로드는 Stage C에서 제공해요.
          </p>
          <Link
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-cta"
            href="/legal/refund"
          >
            환불정책 보기
          </Link>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-14" aria-labelledby="related-products-heading">
          <div id="related-products-heading">
            <SectionHeader
              title="같은 악기의 다른 악보"
              href={
                product.instrumentIds[0] ? `/instruments/${product.instrumentIds[0]}` : "/scores"
              }
            />
          </div>
          <ProductGrid products={related} browserBacked={browserBacked} />
        </section>
      ) : null}
    </div>
  );
}
