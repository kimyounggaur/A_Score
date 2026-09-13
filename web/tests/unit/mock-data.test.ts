import { describe, expect, it } from "vitest";

import { MOCK_BAND_SETS, MOCK_BUNDLES, MOCK_PRODUCTS, MOCK_SCORES } from "@/data/mock/products";
import { MOCK_ARRANGERS } from "@/data/mock/arrangers";
import { isPurchasableScore } from "@/lib/catalog/integrity";
import { arrangerArraySchema, productArraySchema, productSchema } from "@/lib/catalog/schemas";
import {
  getInstrument,
  INSTRUMENT_GROUPS,
  NOTATION_FORMAT,
  PRODUCT_TYPE,
} from "@/lib/catalog/taxonomy";
import {
  getProductPath,
  hasCanonicalProductRoute,
  isPurchasable,
  isSeededCatalogProduct,
} from "@/lib/catalog/types";
import { productMetaDescription } from "@/lib/seo/metadata";

describe("mock catalog", () => {
  it("loads every product through the Zod schema", () => {
    expect(productArraySchema.parse(MOCK_PRODUCTS)).toHaveLength(MOCK_PRODUCTS.length);
    expect(arrangerArraySchema.parse(MOCK_ARRANGERS)).toHaveLength(MOCK_ARRANGERS.length);
  });

  it("contains the required distribution", () => {
    expect(MOCK_PRODUCTS.length).toBeGreaterThanOrEqual(40);
    expect(MOCK_SCORES.length).toBeGreaterThanOrEqual(30);
    expect(MOCK_BUNDLES).toHaveLength(4);
    expect(MOCK_BAND_SETS).toHaveLength(3);
    expect(
      MOCK_SCORES.filter((product) => product.formats.includes(NOTATION_FORMAT.COLOR)).length,
    ).toBeGreaterThanOrEqual(5);
  });

  it("has at least two products represented in every instrument group", () => {
    for (const group of INSTRUMENT_GROUPS) {
      const count = MOCK_PRODUCTS.filter((product) =>
        product.instrumentIds.some((id) => getInstrument(id)?.group === group.id),
      ).length;
      expect(count, group.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("points every bundle item at an existing purchasable score", () => {
    const productsById = new Map(MOCK_PRODUCTS.map((product) => [product.id, product]));
    for (const bundle of MOCK_BUNDLES) {
      expect(bundle.itemIds.every((id) => isPurchasableScore(productsById.get(id)))).toBe(true);
    }
  });

  it("contains exactly two pending demo products and no legacy title flags", () => {
    expect(MOCK_PRODUCTS.filter((product) => product.licenseStatus === "pending")).toHaveLength(2);
    expect(MOCK_PRODUCTS.some((product) => /\[무료\]|기타\)/.test(product.title))).toBe(false);
  });

  it("gives every public product a unique SEO description", () => {
    const descriptions = MOCK_PRODUCTS.filter(
      (product) => product.status === "published" && product.licenseStatus === "cleared",
    ).map(productMetaDescription);

    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("rejects invalid sale prices and duplicate bundle items", () => {
    const base = MOCK_BUNDLES[0];
    expect(base).toBeDefined();
    expect(() =>
      productSchema.parse({
        ...base,
        salePrice: base?.listPrice,
        itemIds: [1001, 1001],
        itemCount: 2,
      }),
    ).toThrow();
  });

  it("decides canonical versus local routes from each product's provenance", () => {
    const score = { id: 4100, type: PRODUCT_TYPE.SCORE } as const;
    const bundle = { id: 4101, type: PRODUCT_TYPE.BUNDLE } as const;
    const bandSet = { id: 4102, type: PRODUCT_TYPE.BAND_SET } as const;

    expect(MOCK_PRODUCTS.every(isSeededCatalogProduct)).toBe(true);
    expect(MOCK_PRODUCTS.filter(isPurchasable).every(hasCanonicalProductRoute)).toBe(true);
    expect(MOCK_PRODUCTS.filter((product) => !isPurchasable(product))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1029 }),
        expect.objectContaining({ id: 1030 }),
        expect.objectContaining({ id: 1033 }),
      ]),
    );
    expect(
      MOCK_PRODUCTS.filter((product) => !isPurchasable(product)).every(
        (product) => !hasCanonicalProductRoute(product),
      ),
    ).toBe(true);
    expect(isSeededCatalogProduct(score)).toBe(false);
    expect(getProductPath(MOCK_SCORES[0]!, { browserBacked: true })).toBe("/scores/1001");
    expect(getProductPath(MOCK_BUNDLES[0]!, { browserBacked: true })).toBe("/bundles/2001");
    expect(getProductPath(MOCK_BAND_SETS[0]!, { browserBacked: true })).toBe("/band-sets/3001");
    expect(
      getProductPath(
        MOCK_PRODUCTS.find((product) => product.id === 1029)!,
        {
          browserBacked: true,
        },
      ),
    ).toBe("/scores/local/1029");
    expect(getProductPath(score)).toBe("/scores/4100");
    expect(getProductPath(score, { browserBacked: true })).toBe("/scores/local/4100");
    expect(getProductPath(bundle, { browserBacked: true })).toBe("/bundles/local/4101");
    expect(getProductPath(bandSet, { browserBacked: true })).toBe("/band-sets/local/4102");
  });
});
