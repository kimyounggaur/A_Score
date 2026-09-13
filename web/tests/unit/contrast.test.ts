import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { contrastRatio } from "@/lib/a11y/contrast";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const globalsCss = readFileSync(path.resolve(currentDirectory, "../../app/globals.css"), "utf8");

function token(name: string): string {
  const match = globalsCss.match(new RegExp(`${name}\\s*:\\s*(#[\\da-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`Missing color token: ${name}`);
  return match[1];
}

describe("design-token contrast", () => {
  it.each([
    ["white on CTA", "#FFFFFF", "--color-cta"],
    ["muted text on surface", "--color-text-muted", "--color-surface"],
    ["muted text on canvas", "--color-text-muted", "--color-canvas"],
    ["free text on surface", "--color-free", "--color-surface"],
    ["sale text on surface", "--color-sale", "--color-surface"],
    ["sale ink on sale background", "--color-sale-ink", "--color-sale-bg"],
    ["point ink on point", "--color-point-ink", "--color-point"],
  ])("keeps %s at WCAG AA", (_label, foreground, background) => {
    const foregroundColor = foreground.startsWith("#") ? foreground : token(foreground);
    expect(contrastRatio(foregroundColor, token(background))).toBeGreaterThanOrEqual(4.5);
  });
});
