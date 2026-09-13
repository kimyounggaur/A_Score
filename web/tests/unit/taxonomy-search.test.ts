import { describe, expect, it } from "vitest";

import { MOCK_ARRANGERS } from "@/data/mock/arrangers";
import { MOCK_PRODUCTS } from "@/data/mock/products";
import {
  INSTRUMENT_GROUPS,
  INSTRUMENT_ID,
  INSTRUMENTS,
  resolveInstrumentAlias,
} from "@/lib/catalog/taxonomy";
import { applySearch } from "@/lib/search/filter";
import { isChosungOnly, normalizeText, toChosung } from "@/lib/search/normalize";
import { parsePageValue, parseSearchParams } from "@/lib/search/query";

const now = new Date("2026-09-13T00:00:00Z");

describe("taxonomy", () => {
  it("has unique instrument ids and at least one instrument in every group", () => {
    expect(new Set(INSTRUMENTS.map((instrument) => instrument.id)).size).toBe(INSTRUMENTS.length);
    for (const group of INSTRUMENT_GROUPS) {
      expect(INSTRUMENTS.some((instrument) => instrument.group === group.id)).toBe(true);
    }
  });

  it("resolves legacy aliases to the canonical instrument", () => {
    expect(resolveInstrumentAlias("플룻")?.id).toBe(INSTRUMENT_ID.FLUTE);
    expect(resolveInstrumentAlias("베이스 기타")?.id).toBe(INSTRUMENT_ID.BASS);
  });
});

describe("Korean search", () => {
  it("normalizes punctuation and extracts Hangul initials", () => {
    expect(normalizeText(" 밤-편지! ")).toBe("밤편지");
    expect(toChosung("밤편지")).toBe("ㅂㅍㅈ");
    expect(isChosungOnly("ㅂㅍㅈ")).toBe(true);
  });

  it("matches chosung queries", () => {
    const result = applySearch(MOCK_PRODUCTS, { q: "ㅂㅍㅈ" }, now, {
      arrangers: MOCK_ARRANGERS,
    });
    expect(result.items.map((item) => item.title)).toContain("밤편지");
  });

  it("matches the legacy 플룻 alias to a flute product", () => {
    const result = applySearch(MOCK_PRODUCTS, { q: "플룻" }, now, {
      arrangers: MOCK_ARRANGERS,
    });
    expect(result.items.some((item) => item.instrumentIds.includes(INSTRUMENT_ID.FLUTE))).toBe(
      true,
    );
  });

  it("sorts new products by publishedAt and excludes unavailable facets", () => {
    const result = applySearch(MOCK_PRODUCTS, { sort: "new" }, now, {
      arrangers: MOCK_ARRANGERS,
    });
    expect(result.items[0]?.id).toBe(1001);
    expect(result.facets.instruments[INSTRUMENT_ID.BASSOON]).toBeUndefined();
  });

  it("falls back safely for invalid URL values", () => {
    const params = new URLSearchParams(
      "instrument=unknown&group=wat&level=99&price=nope&sort=wrong&page=-2",
    );
    expect(parseSearchParams(params)).toMatchObject({
      instrument: null,
      group: null,
      level: null,
      price: "all",
      sort: "popular",
      page: 1,
    });
  });

  it("accepts only canonical positive integer page values", () => {
    expect(parsePageValue("2")).toBe(2);
    expect(parsePageValue("2junk")).toBe(1);
    expect(parsePageValue("1.5")).toBe(1);
    expect(parsePageValue("0")).toBe(1);
    expect(parsePageValue("10001")).toBe(1);
  });
});
