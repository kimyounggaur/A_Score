import { createElement } from "react";
import { ImageResponse } from "next/og";

import { getInstrument } from "@/lib/catalog/taxonomy";
import type { CatalogProduct } from "@/lib/catalog/types";
import { effectivePrice, formatWon } from "@/lib/pricing";

export const OPEN_GRAPH_SIZE = { width: 1200, height: 630 } as const;
export const OPEN_GRAPH_CONTENT_TYPE = "image/png";

const palette = {
  canvas: "rgb(255 247 237)",
  surface: "rgb(255 255 255)",
  brand: "rgb(194 65 12)",
  brandSoft: "rgb(255 237 213)",
  ink: "rgb(28 25 23)",
  muted: "rgb(87 83 78)",
} as const;

const styles = {
  frame: {
    width: "100%",
    height: "100%",
    display: "flex",
    padding: 56,
    background: palette.canvas,
    color: palette.ink,
    fontFamily: "sans-serif",
  },
  card: {
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    borderRadius: 40,
    padding: 56,
    background: palette.surface,
    boxShadow: "0 24px 60px rgb(120 53 15 / 0.12)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    color: palette.brand,
    fontSize: 30,
    fontWeight: 700,
  },
  mark: {
    width: 48,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    background: palette.brand,
    color: palette.surface,
    fontSize: 30,
  },
  title: {
    maxWidth: 980,
    display: "flex",
    color: palette.ink,
    fontSize: 68,
    fontWeight: 700,
    lineHeight: 1.18,
    letterSpacing: -2,
  },
  details: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 32,
  },
  description: {
    display: "flex",
    color: palette.muted,
    fontSize: 30,
  },
  price: {
    display: "flex",
    borderRadius: 999,
    padding: "16px 28px",
    background: palette.brandSoft,
    color: palette.brand,
    fontSize: 34,
    fontWeight: 700,
  },
} as const;

function frame(children: ReturnType<typeof createElement>[]) {
  return createElement(
    "div",
    { style: styles.frame },
    createElement("div", { style: styles.card }, ...children),
  );
}

function brand() {
  return createElement(
    "div",
    { style: styles.brand },
    createElement("span", { style: styles.mark }, "♪"),
    createElement("span", null, "ScoreStore"),
  );
}

export function createHomeOpenGraphImage(): ImageResponse {
  return new ImageResponse(
    frame([
      brand(),
      createElement("div", { key: "title", style: styles.title }, "연주하고 싶은 악보를 한 곡부터"),
      createElement(
        "div",
        { key: "details", style: styles.details },
        createElement("span", { style: styles.description }, "악기별 디지털 악보 마켓"),
        createElement("span", { style: styles.price }, "ScoreStore"),
      ),
    ]),
    OPEN_GRAPH_SIZE,
  );
}

export function createProductOpenGraphImage(product: CatalogProduct): ImageResponse {
  const instrument = getInstrument(product.instrumentIds[0] ?? "")?.label ?? "디지털 악보";
  const price = effectivePrice(product);
  return new ImageResponse(
    frame([
      brand(),
      createElement("div", { key: "title", style: styles.title }, product.title),
      createElement(
        "div",
        { key: "details", style: styles.details },
        createElement("span", { style: styles.description }, instrument),
        createElement("span", { style: styles.price }, price === 0 ? "무료" : formatWon(price)),
      ),
    ]),
    OPEN_GRAPH_SIZE,
  );
}
