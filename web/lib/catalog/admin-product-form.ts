import { z } from "zod";

import {
  GENRES,
  INSTRUMENTS,
  LEVELS,
  NOTATION_FORMATS,
  PRODUCT_TYPE,
  PRODUCT_TYPES,
} from "@/lib/catalog/taxonomy";
import type { CatalogProduct, LicenseStatus, ProductStatus } from "@/lib/catalog/types";

const instrumentIdSchema = z.enum(INSTRUMENTS.map((instrument) => instrument.id));
const notationFormatSchema = z.enum(NOTATION_FORMATS.map((format) => format.id));
const genreSchema = z.enum(GENRES.map((genre) => genre.id));
const productTypeSchema = z.enum(PRODUCT_TYPES.map((type) => type.id));
const levelSchema = z.union(LEVELS.map((level) => z.literal(level.id)));

function integerText(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function addFieldIssue(context: z.RefinementCtx, path: string, message: string): void {
  context.addIssue({ code: "custom", path: [path], message });
}

export const adminProductFormSchema = z
  .object({
    id: z.number().int().positive(),
    type: productTypeSchema,
    title: z.string().trim().min(1, "제목을 입력해 주세요."),
    artist: z.string(),
    instrumentIds: z.array(instrumentIdSchema),
    formats: z.array(notationFormatSchema).min(1, "기보 형식을 하나 이상 선택해 주세요."),
    genre: genreSchema,
    levelRhythm: z.union([levelSchema, z.literal("")]),
    levelTechnique: z.union([levelSchema, z.literal("")]),
    listPrice: z.string(),
    salePrice: z.string(),
    saleEndsAt: z.string(),
    pages: z.string(),
    keySignature: z.string(),
    bpm: z.string(),
    status: z.enum(["draft", "published", "hidden"]),
    licenseStatus: z.enum(["cleared", "pending", "blocked"]),
    itemIds: z.array(z.number().int().positive()),
  })
  .superRefine((form, context) => {
    if (form.type === PRODUCT_TYPE.BAND_SET) {
      if (form.instrumentIds.length < 2) {
        addFieldIssue(context, "instrumentIds", "밴드세트는 악기를 두 개 이상 선택해 주세요.");
      }
    } else if (form.instrumentIds.length === 0) {
      addFieldIssue(context, "instrumentIds", "악기를 하나 이상 선택해 주세요.");
    }

    if (form.type === PRODUCT_TYPE.BUNDLE && form.itemIds.length === 0) {
      addFieldIssue(context, "itemIds", "악보집 수록곡을 하나 이상 선택해 주세요.");
    }

    const listPrice = integerText(form.listPrice);
    if (!form.listPrice.trim()) {
      addFieldIssue(context, "listPrice", "정가를 입력해 주세요.");
    } else if (listPrice === null) {
      addFieldIssue(context, "listPrice", "정가는 0 이상의 정수로 입력해 주세요.");
    }

    const hasSalePrice = Boolean(form.salePrice.trim());
    const salePrice = hasSalePrice ? integerText(form.salePrice) : null;
    if (hasSalePrice && salePrice === null) {
      addFieldIssue(context, "salePrice", "할인가는 0 이상의 정수로 입력해 주세요.");
    } else if (salePrice !== null && listPrice !== null) {
      if (listPrice === 0) {
        addFieldIssue(
          context,
          "salePrice",
          "0원 상품은 무료로 처리되므로 할인가를 입력할 수 없습니다.",
        );
      } else if (salePrice >= listPrice) {
        addFieldIssue(context, "salePrice", "할인가는 정가보다 낮아야 합니다.");
      }
    }

    if (hasSalePrice) {
      if (!form.saleEndsAt) {
        addFieldIssue(context, "saleEndsAt", "할인 종료 시각을 입력해 주세요.");
      } else if (Number.isNaN(Date.parse(form.saleEndsAt))) {
        addFieldIssue(context, "saleEndsAt", "올바른 할인 종료 시각을 입력해 주세요.");
      }
    }

    for (const [field, label, value] of [
      ["pages", "페이지 수", form.pages],
      ["bpm", "BPM", form.bpm],
    ] as const) {
      if (value.trim()) {
        const parsed = integerText(value);
        if (parsed === null || parsed < 1) {
          addFieldIssue(context, field, `${label}는 1 이상의 정수로 입력해 주세요.`);
        }
      }
    }

    if (form.status === "published" && form.licenseStatus !== "cleared") {
      addFieldIssue(context, "status", "이용허락 확인 완료 상품만 게시할 수 있습니다.");
      addFieldIssue(
        context,
        "licenseStatus",
        "게시하려면 이용허락 상태를 확인 완료로 변경해 주세요.",
      );
    }
  });

export type AdminProductFormState = z.infer<typeof adminProductFormSchema>;
export type AdminProductFormField = keyof AdminProductFormState;
export type AdminProductFormErrors = Partial<Record<AdminProductFormField, string>>;

export function getAdminProductFormErrors(error: z.ZodError): AdminProductFormErrors {
  const errors: AdminProductFormErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    const formField = field as AdminProductFormField;
    if (!errors[formField]) errors[formField] = issue.message;
  }
  return errors;
}

const firstInstrument = INSTRUMENTS[0];
const firstFormat = NOTATION_FORMATS[0];
const firstGenre = GENRES[0];

export function createEmptyAdminProductForm(nextId: number): AdminProductFormState {
  return {
    id: nextId,
    type: PRODUCT_TYPE.SCORE,
    title: "",
    artist: "",
    instrumentIds: firstInstrument ? [firstInstrument.id] : [],
    formats: firstFormat ? [firstFormat.id] : [],
    genre: firstGenre?.id ?? "etc",
    levelRhythm: "",
    levelTechnique: "",
    listPrice: "0",
    salePrice: "",
    saleEndsAt: "",
    pages: "",
    keySignature: "",
    bpm: "",
    status: "draft",
    licenseStatus: "pending",
    itemIds: [],
  };
}

export function adminProductFormFromProduct(product: CatalogProduct): AdminProductFormState {
  return {
    id: product.id,
    type: product.type,
    title: product.title,
    artist: product.artist ?? "",
    instrumentIds: [...product.instrumentIds],
    formats: [...product.formats],
    genre: product.genre,
    levelRhythm: product.levelRhythm ?? "",
    levelTechnique: product.levelTechnique ?? "",
    listPrice: String(product.listPrice),
    salePrice: product.salePrice == null ? "" : String(product.salePrice),
    saleEndsAt: product.saleEndsAt?.slice(0, 16) ?? "",
    pages: product.pages == null ? "" : String(product.pages),
    keySignature: product.keySignature ?? "",
    bpm: product.bpm == null ? "" : String(product.bpm),
    status: product.status,
    licenseStatus: product.licenseStatus,
    itemIds: product.type === PRODUCT_TYPE.BUNDLE ? [...product.itemIds] : [],
  };
}

function optionalPositiveInteger(value: string): number | null {
  return value.trim() ? Number(value) : null;
}

export function buildAdminProduct(
  input: AdminProductFormState,
  previous: CatalogProduct | null,
): CatalogProduct {
  const form = adminProductFormSchema.parse(input);
  const listPrice = Number(form.listPrice);
  const salePrice = form.salePrice.trim() ? Number(form.salePrice) : null;
  const base = {
    id: form.id,
    title: form.title,
    artist: form.type === PRODUCT_TYPE.BUNDLE ? null : form.artist.trim() || null,
    arrangerId: previous?.arrangerId ?? null,
    instrumentIds: form.instrumentIds,
    formats: form.formats,
    genre: form.genre,
    levelRhythm: form.levelRhythm || null,
    levelTechnique: form.levelTechnique || null,
    listPrice,
    salePrice,
    saleEndsAt: salePrice === null ? null : new Date(form.saleEndsAt).toISOString(),
    pages: optionalPositiveInteger(form.pages),
    keySignature: form.keySignature.trim() || null,
    bpm: optionalPositiveInteger(form.bpm),
    tags: previous?.tags ?? [],
    publishedAt: previous?.publishedAt ?? new Date().toISOString(),
    status: form.status as ProductStatus,
    licenseStatus: form.licenseStatus as LicenseStatus,
    sampleAssetId: previous?.sampleAssetId ?? null,
    previewAudioId: previous?.previewAudioId ?? null,
    salesCount: previous?.salesCount ?? 0,
  };

  if (form.type === PRODUCT_TYPE.BUNDLE) {
    return {
      ...base,
      type: PRODUCT_TYPE.BUNDLE,
      itemIds: form.itemIds,
      itemCount: form.itemIds.length,
    };
  }
  if (form.type === PRODUCT_TYPE.BAND_SET) {
    return {
      ...base,
      type: PRODUCT_TYPE.BAND_SET,
      parts: form.instrumentIds.map((instrumentId) => ({
        instrumentId,
        label:
          INSTRUMENTS.find((instrument) => instrument.id === instrumentId)?.label ?? instrumentId,
      })),
    };
  }
  return { ...base, type: PRODUCT_TYPE.SCORE };
}
