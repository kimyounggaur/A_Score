import { describe, expect, it } from "vitest";

import {
  adminProductFormSchema,
  createEmptyAdminProductForm,
  getAdminProductFormErrors,
} from "@/lib/catalog/admin-product-form";
import { INSTRUMENT_ID, PRODUCT_TYPE } from "@/lib/catalog/taxonomy";

function errorsFor(overrides: Partial<ReturnType<typeof createEmptyAdminProductForm>>) {
  const result = adminProductFormSchema.safeParse({
    ...createEmptyAdminProductForm(4001),
    title: "검증 악보",
    listPrice: "2000",
    ...overrides,
  });
  if (result.success) return {};
  return getAdminProductFormErrors(result.error);
}

describe("admin product form schema", () => {
  it("accepts a valid draft score", () => {
    expect(errorsFor({})).toEqual({});
  });

  it("maps required fields and integer prices to their fields", () => {
    const errors = errorsFor({
      title: " ",
      instrumentIds: [],
      formats: [],
      listPrice: "-100",
    });

    expect(errors.title).toBe("제목을 입력해 주세요.");
    expect(errors.instrumentIds).toBe("악기를 하나 이상 선택해 주세요.");
    expect(errors.formats).toBe("기보 형식을 하나 이상 선택해 주세요.");
    expect(errors.listPrice).toBe("정가는 0 이상의 정수로 입력해 주세요.");
  });

  it("requires a lower sale price and an end time", () => {
    expect(errorsFor({ salePrice: "2000" })).toMatchObject({
      salePrice: "할인가는 정가보다 낮아야 합니다.",
      saleEndsAt: "할인 종료 시각을 입력해 주세요.",
    });
    expect(
      errorsFor({ listPrice: "0", salePrice: "100", saleEndsAt: "2026-10-01T12:00" }),
    ).toMatchObject({
      salePrice: "0원 상품은 무료로 처리되므로 할인가를 입력할 수 없습니다.",
    });
  });

  it("blocks publishing until the license is cleared", () => {
    expect(errorsFor({ status: "published", licenseStatus: "pending" })).toMatchObject({
      status: "이용허락 확인 완료 상품만 게시할 수 있습니다.",
      licenseStatus: "게시하려면 이용허락 상태를 확인 완료로 변경해 주세요.",
    });
  });

  it("enforces product-type-specific selections", () => {
    expect(errorsFor({ type: PRODUCT_TYPE.BUNDLE, itemIds: [] }).itemIds).toBe(
      "악보집 수록곡을 하나 이상 선택해 주세요.",
    );
    expect(
      errorsFor({
        type: PRODUCT_TYPE.BAND_SET,
        instrumentIds: [INSTRUMENT_ID.ACOUSTIC_GUITAR],
      }).instrumentIds,
    ).toBe("밴드세트는 악기를 두 개 이상 선택해 주세요.");
  });
});
