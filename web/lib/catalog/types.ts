import type {
  Genre,
  InstrumentId,
  Level,
  NotationFormat,
  ProductType,
} from "@/lib/catalog/taxonomy";
import { PRODUCT_TYPE } from "@/lib/catalog/taxonomy";

export type ProductStatus = "draft" | "published" | "hidden";
export type LicenseStatus = "cleared" | "pending" | "blocked";

export interface BaseProduct {
  id: number;
  type: ProductType;
  title: string;
  artist: string | null;
  arrangerId: string | null;
  instrumentIds: InstrumentId[];
  formats: NotationFormat[];
  genre: Genre;
  levelRhythm: Level | null;
  levelTechnique: Level | null;
  listPrice: number;
  salePrice: number | null;
  saleEndsAt: string | null;
  pages: number | null;
  keySignature: string | null;
  bpm: number | null;
  tags: string[];
  publishedAt: string | null;
  status: ProductStatus;
  licenseStatus: LicenseStatus;
  sampleAssetId: string | null;
  previewAudioId: string | null;
  salesCount: number;
}

export interface ScoreProduct extends BaseProduct {
  type: typeof PRODUCT_TYPE.SCORE;
}

export interface BundleProduct extends BaseProduct {
  type: typeof PRODUCT_TYPE.BUNDLE;
  itemIds: number[];
  itemCount: number;
}

export interface BandSetPart {
  instrumentId: InstrumentId;
  label: string;
  sampleAssetId?: string | null;
}

export interface BandSetProduct extends BaseProduct {
  type: typeof PRODUCT_TYPE.BAND_SET;
  parts: BandSetPart[];
}

export type CatalogProduct = ScoreProduct | BundleProduct | BandSetProduct;
export type Product = CatalogProduct;

// Stage B의 원본 seed 상품 식별자다. 브라우저 저장소는 seed와 관리자 생성 상품을
// 한 배열로 합치므로, 목록을 어디서 읽었는지가 아니라 유형과 ID로 provenance를
// 판별한다. 최초 판매 불가 seed는 canonical 정적 경로가 없어서 /local을 사용한다.
const SEEDED_SCORE_IDS = new Set(Array.from({ length: 34 }, (_, index) => 1001 + index));
const SEEDED_BUNDLE_IDS = new Set([2001, 2002, 2003, 2004]);
const SEEDED_BAND_SET_IDS = new Set([3001, 3002, 3003]);
const NON_CANONICAL_SEEDED_PRODUCTS = new Set(["score:1029", "score:1030", "score:1033"]);

export function isSeededCatalogProduct(product: Pick<CatalogProduct, "id" | "type">): boolean {
  if (product.type === PRODUCT_TYPE.BUNDLE) return SEEDED_BUNDLE_IDS.has(product.id);
  if (product.type === PRODUCT_TYPE.BAND_SET) return SEEDED_BAND_SET_IDS.has(product.id);
  return SEEDED_SCORE_IDS.has(product.id);
}

/** Whether Stage B emitted a canonical static route for this original seed. */
export function hasCanonicalProductRoute(product: Pick<CatalogProduct, "id" | "type">): boolean {
  return (
    isSeededCatalogProduct(product) &&
    !NON_CANONICAL_SEEDED_PRODUCTS.has(`${product.type}:${product.id}`)
  );
}

export interface Arranger {
  id: string;
  name: string;
  specialties: string[];
  bio: string;
  instrumentIds: InstrumentId[];
}

export function isPurchasable(product: CatalogProduct): boolean {
  return product.status === "published" && product.licenseStatus === "cleared";
}

export function isScoreProduct(product: CatalogProduct): product is ScoreProduct {
  return product.type === PRODUCT_TYPE.SCORE;
}

export function isBundleProduct(product: CatalogProduct): product is BundleProduct {
  return product.type === PRODUCT_TYPE.BUNDLE;
}

export function isBandSetProduct(product: CatalogProduct): product is BandSetProduct {
  return product.type === PRODUCT_TYPE.BAND_SET;
}

export function getProductPath(
  product: Pick<CatalogProduct, "id" | "type">,
  options: { browserBacked?: boolean } = {},
): string {
  const localSegment = options.browserBacked && !hasCanonicalProductRoute(product) ? "/local" : "";
  if (product.type === PRODUCT_TYPE.BUNDLE) return `/bundles${localSegment}/${product.id}`;
  if (product.type === PRODUCT_TYPE.BAND_SET) return `/band-sets${localSegment}/${product.id}`;
  return `/scores${localSegment}/${product.id}`;
}
