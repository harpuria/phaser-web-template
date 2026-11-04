/**
 * 선호 언어 목록(`navigator.languages` 등)에서 지원하는 첫 언어를 고른다.
 * `ko-KR`처럼 지역이 붙은 값은 기본 언어(`ko`)로도 비교한다. 없으면 `fallback`.
 */
export function pickLocale<T extends string>(
  supported: readonly T[],
  preferred: readonly string[],
  fallback: T,
): T {
  for (const tag of preferred) {
    const lower = tag.toLowerCase();
    const exact = supported.find((locale) => locale.toLowerCase() === lower);
    if (exact) return exact;
    const base = supported.find(
      (locale) => locale.toLowerCase() === lower.split('-')[0],
    );
    if (base) return base;
  }
  return fallback;
}
