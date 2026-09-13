const CHOSUNG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;

const SEARCH_ALIASES: Readonly<Record<string, string>> = {
  플룻: "플루트",
  베이스기타: "베이스",
  일렉: "일렉기타",
  어쿠스틱기타: "통기타",
  통기타: "통기타",
};

export function normalizeText(value: string): string {
  return value
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\s\-_().,·:;'"!?[\]{}/]/g, "");
}

export function toChosung(value: string): string {
  let output = "";
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      output += CHOSUNG[Math.floor((code - 0xac00) / 588)] ?? character;
    } else {
      output += character;
    }
  }
  return output;
}

export function isChosungOnly(query: string): boolean {
  return /^[ㄱ-ㅎ]+$/.test(query);
}

export function matches(haystackParts: readonly string[], rawQuery: string): boolean {
  const normalizedInput = normalizeText(rawQuery);
  if (!normalizedInput) return true;
  const query = SEARCH_ALIASES[normalizedInput] ?? normalizedInput;
  const haystack = normalizeText(haystackParts.join(" "));
  if (isChosungOnly(query)) return toChosung(haystack).includes(query);
  return haystack.includes(normalizeText(query));
}
