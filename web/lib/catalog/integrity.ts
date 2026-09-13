import { PRODUCT_TYPE } from "@/lib/catalog/taxonomy";
import type { BundleProduct, CatalogProduct, ScoreProduct } from "@/lib/catalog/types";
import { isPurchasable } from "@/lib/catalog/types";

export function isPurchasableScore(
  product: CatalogProduct | null | undefined,
): product is ScoreProduct {
  return Boolean(product && product.type === PRODUCT_TYPE.SCORE && isPurchasable(product));
}

export function getUnavailableBundleItemIds(
  bundle: BundleProduct,
  products: readonly CatalogProduct[],
): number[] {
  const productsById = new Map(products.map((product) => [product.id, product]));
  return bundle.itemIds.filter((itemId) => !isPurchasableScore(productsById.get(itemId)));
}

/**
 * 공개 카탈로그와 주문 경계에서 사용하는 최종 판매 가능 판정이다.
 * 악보집은 그 자체뿐 아니라 모든 수록곡도 현재 판매 가능한 단일 악보여야 한다.
 */
export function isCatalogProductPurchasable(
  product: CatalogProduct,
  products: readonly CatalogProduct[],
): boolean {
  if (!isPurchasable(product)) return false;
  if (product.type !== PRODUCT_TYPE.BUNDLE) return true;
  return getUnavailableBundleItemIds(product, products).length === 0;
}

/**
 * 구성곡이 숨김·비허가·삭제된 경우 기존 게시 악보집을 관리자 목록에서도 격리한다.
 * 공개 조회는 별도 판정을 다시 수행하므로 저장값이 직접 변조돼도 판매되지 않는다.
 */
export function quarantineIncompleteBundles(products: readonly CatalogProduct[]): CatalogProduct[] {
  return products.map((product) => {
    if (
      product.type === PRODUCT_TYPE.BUNDLE &&
      isPurchasable(product) &&
      getUnavailableBundleItemIds(product, products).length > 0
    ) {
      return { ...product, status: "hidden" as const };
    }
    return product;
  });
}
