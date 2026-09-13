const SAMPLE_IMAGES: Readonly<Record<string, string>> = {
  "demo-score-page": "/samples/score-demo.svg",
};

const PREVIEW_AUDIO: Readonly<Record<string, string>> = {
  "demo-tone": "/samples/demo-tone.wav",
};

export function resolveSampleImage(assetId: string | null): string | null {
  return assetId ? (SAMPLE_IMAGES[assetId] ?? null) : null;
}

export function resolvePreviewAudio(assetId: string | null): string | null {
  return assetId ? (PREVIEW_AUDIO[assetId] ?? null) : null;
}
