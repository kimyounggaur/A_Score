export interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

export function parseHexColor(hex: string): RgbColor {
  const normalized = hex.trim().replace(/^#/, "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => character.repeat(2))
          .join("")
      : normalized;
  if (!/^[\da-f]{6}$/i.test(expanded)) throw new Error(`INVALID_HEX_COLOR: ${hex}`);
  return {
    red: Number.parseInt(expanded.slice(0, 2), 16),
    green: Number.parseInt(expanded.slice(2, 4), 16),
    blue: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

function linearize(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: RgbColor): number {
  return (
    0.2126 * linearize(color.red) + 0.7152 * linearize(color.green) + 0.0722 * linearize(color.blue)
  );
}

export function contrastRatio(
  foreground: string | RgbColor,
  background: string | RgbColor,
): number {
  const foregroundColor = typeof foreground === "string" ? parseHexColor(foreground) : foreground;
  const backgroundColor = typeof background === "string" ? parseHexColor(background) : background;
  const light = Math.max(relativeLuminance(foregroundColor), relativeLuminance(backgroundColor));
  const dark = Math.min(relativeLuminance(foregroundColor), relativeLuminance(backgroundColor));
  return (light + 0.05) / (dark + 0.05);
}
