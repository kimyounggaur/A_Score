import { MOCK_ARRANGERS } from "@/data/mock/arrangers";
import { MOCK_PRODUCTS } from "@/data/mock/products";
import { isCatalogProductPurchasable, isPurchasableScore } from "@/lib/catalog/integrity";
import { NOTATION_FORMAT, PRODUCT_TYPE, type InstrumentId } from "@/lib/catalog/taxonomy";
import type { Arranger, CatalogProduct } from "@/lib/catalog/types";
import { isBundleProduct } from "@/lib/catalog/types";
import { effectivePrice } from "@/lib/pricing";
import type { CatalogRepository, HomeCatalog } from "@/lib/repositories/interfaces";
import { applySearch, type SearchResult } from "@/lib/search/filter";
import { mergeSearchQuery, type SearchQuery } from "@/lib/search/query";

import { MOCK_STORAGE_KEYS, type VersionedMockStorage } from "@/lib/repositories/mock/storage";

export class MockCatalogRepository implements CatalogRepository {
  constructor(
    private readonly store: VersionedMockStorage,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async readProducts(): Promise<CatalogProduct[]> {
    const stored = this.store.read<CatalogProduct[]>(MOCK_STORAGE_KEYS.products, MOCK_PRODUCTS);
    // Seed는 CI의 Zod 스키마 테스트를, 관리자 저장값은 MockAdminRepository의
    // Zod write boundary를 통과한다. 공개 카탈로그에서는 그 검증된 문서를 읽기만 해
    // 폼 전용 Zod 런타임을 초기 번들에 싣지 않는다.
    return Array.isArray(stored) ? stored : structuredClone(MOCK_PRODUCTS);
  }

  async listProducts(query: Partial<SearchQuery> = {}): Promise<SearchResult> {
    const products = await this.readProducts();
    const purchasableProducts = products.filter((product) =>
      isCatalogProductPurchasable(product, products),
    );
    return applySearch(purchasableProducts, mergeSearchQuery(query), this.now(), {
      arrangers: MOCK_ARRANGERS,
    });
  }

  async listProductsIncludingUnavailable(): Promise<CatalogProduct[]> {
    return structuredClone(await this.readProducts());
  }

  async getProduct(id: number): Promise<CatalogProduct | null> {
    const products = await this.readProducts();
    const product = products.find((candidate) => candidate.id === id) ?? null;
    return product && isCatalogProductPurchasable(product, products) ? product : null;
  }

  /** 관리자와 주문 저장소가 검증·권한 판정에 사용하는 원본 조회다. */
  async getProductIncludingUnavailable(id: number): Promise<CatalogProduct | null> {
    return (await this.readProducts()).find((candidate) => candidate.id === id) ?? null;
  }

  async getBundleItems(bundleId: number): Promise<CatalogProduct[]> {
    const products = await this.readProducts();
    const bundle = products.find((candidate) => candidate.id === bundleId) ?? null;
    if (!bundle || !isBundleProduct(bundle) || !isCatalogProductPurchasable(bundle, products)) {
      return [];
    }
    return bundle.itemIds
      .map((itemId) => products.find((candidate) => candidate.id === itemId) ?? null)
      .filter(isPurchasableScore);
  }

  async listByInstrument(
    instrumentId: InstrumentId,
    options: Partial<SearchQuery> = {},
  ): Promise<SearchResult> {
    return this.listProducts({ ...options, instrument: instrumentId });
  }

  async listArrangers(): Promise<Arranger[]> {
    return structuredClone(MOCK_ARRANGERS);
  }

  async getArranger(id: string): Promise<Arranger | null> {
    return structuredClone(MOCK_ARRANGERS.find((arranger) => arranger.id === id) ?? null);
  }

  async listHome(): Promise<HomeCatalog> {
    const allProducts = await this.readProducts();
    const products = allProducts.filter((product) =>
      isCatalogProductPurchasable(product, allProducts),
    );
    const newest = products.toSorted(
      (a, b) =>
        Date.parse(b.publishedAt ?? "1970-01-01") - Date.parse(a.publishedAt ?? "1970-01-01"),
    );
    const popular = products.toSorted((a, b) => b.salesCount - a.salesCount);
    return {
      free: products.filter((product) => effectivePrice(product, this.now()) === 0).slice(0, 8),
      new: newest.slice(0, 8),
      popular: popular.slice(0, 8),
      bundles: products.filter((product) => product.type === PRODUCT_TYPE.BUNDLE),
      bandSets: products.filter((product) => product.type === PRODUCT_TYPE.BAND_SET),
      colorScores: products.filter(
        (product) =>
          product.type === PRODUCT_TYPE.SCORE && product.formats.includes(NOTATION_FORMAT.COLOR),
      ),
    };
  }
}
