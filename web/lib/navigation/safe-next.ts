const SAFE_BASE = "https://scorestore.invalid";
const MAX_DECODE_DEPTH = 8;

function isUnsafeRelativePath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return true;
  return /[\\\u0000-\u001f\u007f]/u.test(value);
}

/**
 * 로그인 뒤 이동할 same-origin 상대 경로만 반환한다.
 *
 * URLSearchParams가 한 번 디코딩한 값뿐 아니라 중첩 percent-encoding도 검사해
 * 브라우저가 `\\`를 authority 구분자로 해석하는 외부 이동을 차단한다.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/";

  let probe = raw;
  let fullyDecoded = false;
  for (let depth = 0; depth < MAX_DECODE_DEPTH; depth += 1) {
    if (isUnsafeRelativePath(probe)) return "/";

    try {
      if (new URL(probe, SAFE_BASE).origin !== SAFE_BASE) return "/";
      const decoded = decodeURIComponent(probe);
      if (decoded === probe) {
        fullyDecoded = true;
        break;
      }
      probe = decoded;
    } catch {
      return "/";
    }
  }

  if (!fullyDecoded) return "/";

  try {
    const parsed = new URL(raw, SAFE_BASE);
    if (parsed.origin !== SAFE_BASE) return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}
