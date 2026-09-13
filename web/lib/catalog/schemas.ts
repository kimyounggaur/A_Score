import { z } from "zod";

import {
  GENRES,
  INSTRUMENTS,
  LEVELS,
  NOTATION_FORMATS,
  PRODUCT_TYPE,
} from "@/lib/catalog/taxonomy";
import type { Arranger, CatalogProduct } from "@/lib/catalog/types";

const instrumentIdSchema = z.enum(INSTRUMENTS.map((instrument) => instrument.id));
const notationFormatSchema = z.enum(NOTATION_FORMATS.map((format) => format.id));
const genreSchema = z.enum(GENRES.map((genre) => genre.id));
const levelSchema = z.union(LEVELS.map((level) => z.literal(level.id)));
const nullableIsoDateSchema = z.string().datetime({ offset: true }).nullable();

const baseProductShape = {
  id: z.number().int().positive(),
  title: z.string().trim().min(1),
  artist: z.string().trim().min(1).nullable(),
  arrangerId: z.string().trim().min(1).nullable(),
  instrumentIds: z.array(instrumentIdSchema).min(1),
  formats: z.array(notationFormatSchema).min(1),
  genre: genreSchema,
  levelRhythm: levelSchema.nullable(),
  levelTechnique: levelSchema.nullable(),
  listPrice: z.number().int().nonnegative(),
  salePrice: z.number().int().nonnegative().nullable(),
  saleEndsAt: nullableIsoDateSchema,
  pages: z.number().int().positive().nullable(),
  keySignature: z.string().trim().min(1).nullable(),
  bpm: z.number().int().positive().nullable(),
  tags: z.array(z.string().trim().min(1)),
  publishedAt: nullableIsoDateSchema,
  status: z.enum(["draft", "published", "hidden"]),
  licenseStatus: z.enum(["cleared", "pending", "blocked"]),
  sampleAssetId: z.string().trim().min(1).nullable(),
  previewAudioId: z.string().trim().min(1).nullable(),
  salesCount: z.number().int().nonnegative(),
};

const scoreProductSchema = z.object({
  ...baseProductShape,
  type: z.literal(PRODUCT_TYPE.SCORE),
});

const bundleProductSchema = z.object({
  ...baseProductShape,
  type: z.literal(PRODUCT_TYPE.BUNDLE),
  itemIds: z.array(z.number().int().positive()).min(1),
  itemCount: z.number().int().positive(),
});

const bandSetProductSchema = z.object({
  ...baseProductShape,
  type: z.literal(PRODUCT_TYPE.BAND_SET),
  parts: z
    .array(
      z.object({
        instrumentId: instrumentIdSchema,
        label: z.string().trim().min(1),
        sampleAssetId: z.string().trim().min(1).nullable().optional(),
      }),
    )
    .min(2),
});

export const productSchema = z
  .discriminatedUnion("type", [scoreProductSchema, bundleProductSchema, bandSetProductSchema])
  .superRefine((product, context) => {
    if (product.listPrice === 0 && product.salePrice !== null) {
      context.addIssue({
        code: "custom",
        path: ["salePrice"],
        message: "무료 상품의 할인가는 null이어야 합니다.",
      });
    }
    if (product.salePrice !== null && product.salePrice >= product.listPrice) {
      context.addIssue({
        code: "custom",
        path: ["salePrice"],
        message: "할인가는 정가보다 낮아야 합니다.",
      });
    }
    if (new Set(product.instrumentIds).size !== product.instrumentIds.length) {
      context.addIssue({
        code: "custom",
        path: ["instrumentIds"],
        message: "악기를 중복해서 지정할 수 없습니다.",
      });
    }
    if (new Set(product.formats).size !== product.formats.length) {
      context.addIssue({
        code: "custom",
        path: ["formats"],
        message: "기보 형식을 중복해서 지정할 수 없습니다.",
      });
    }
    if (product.type === PRODUCT_TYPE.BUNDLE) {
      if (new Set(product.itemIds).size !== product.itemIds.length) {
        context.addIssue({
          code: "custom",
          path: ["itemIds"],
          message: "악보집 수록곡을 중복해서 지정할 수 없습니다.",
        });
      }
      if (product.itemCount !== product.itemIds.length) {
        context.addIssue({
          code: "custom",
          path: ["itemCount"],
          message: "itemCount는 실제 수록곡 수와 같아야 합니다.",
        });
      }
    }
  });

export const productArraySchema = z.array(productSchema);

export const arrangerSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  specialties: z.array(z.string().trim().min(1)).min(1),
  bio: z.string().trim().min(1),
  instrumentIds: z.array(instrumentIdSchema).min(1),
});

export const arrangerArraySchema = z.array(arrangerSchema);

export function parseProduct(value: unknown): CatalogProduct {
  return productSchema.parse(value) as CatalogProduct;
}

export function parseProducts(value: unknown): CatalogProduct[] {
  return productArraySchema.parse(value) as CatalogProduct[];
}

export function parseArrangers(value: unknown): Arranger[] {
  return arrangerArraySchema.parse(value) as Arranger[];
}
