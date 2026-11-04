export interface ErrorWatchOptions {
  /** 게임 코드의 origin. 다른 origin(광고·플랫폼 SDK, 브라우저 확장)의 오류는 치명 오류로 보지 않는다. */
  origin?: string;
  /** 무시한 외부 오류를 알린다. 기본값은 console.warn. */
  onIgnored?: (message: string) => void;
}

/**
 * 처리되지 않은 오류와 Promise 거부를 받아 사용자에게 알린다.
 * 기본 콘솔 출력은 막지 않는다. 반환 함수로 listener를 제거한다.
 * 같은 문서에서 실행되는 외부 스크립트의 오류는 `onIgnored`로만 전달한다.
 */
export function watchUncaughtErrors(
  onError: (message: string) => void,
  target: EventTarget = window,
  options: ErrorWatchOptions = {},
): () => void {
  const origin =
    options.origin ??
    (typeof location === 'undefined' ? 'null' : location.origin);
  const ignored =
    options.onIgnored ??
    ((message: string) => console.warn('[External error ignored]', message));
  const controller = new AbortController();
  const listen = { signal: controller.signal };
  target.addEventListener(
    'error',
    (event) => {
      const error = event as ErrorEvent;
      const message = describe(error.error ?? error);
      if (isForeignError(error, origin)) ignored(message);
      else onError(message);
    },
    listen,
  );
  target.addEventListener(
    'unhandledrejection',
    (event) => {
      const { reason } = event as PromiseRejectionEvent;
      const message = describe(reason);
      if (isForeignRejection(reason, origin)) ignored(message);
      else onError(message);
    },
    listen,
  );
  return () => controller.abort();
}

/**
 * 오류가 다른 origin의 스크립트에서 왔는지 판단한다.
 * 브라우저는 다른 origin 스크립트의 오류를 세부 정보 없이 "Script error."로 가린다.
 * 파일 위치를 알 수 없는 게임 오류는 보수적으로 게임 오류로 본다.
 */
export function isForeignError(
  event: Pick<ErrorEvent, 'filename' | 'message' | 'error'>,
  origin: string,
): boolean {
  if (event.filename) return originOf(event.filename, origin) !== origin;
  return !event.error && /^script error\.?$/i.test(event.message ?? '');
}

/** stack의 모든 위치가 다른 origin일 때만 외부 거부로 본다. 위치가 없으면 게임 오류로 본다. */
export function isForeignRejection(reason: unknown, origin: string): boolean {
  const stack = reason instanceof Error ? reason.stack : undefined;
  const urls = stack?.match(/\b[a-z][\w+.-]*:\/\/[^\s)]+/gi) ?? [];
  return urls.length > 0 && urls.every((url) => originOf(url) !== origin);
}

function originOf(url: string, base?: string): string {
  try {
    return new URL(url, base).origin;
  } catch {
    return 'null';
  }
}

function describe(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'message' in value)
    return String(value.message);
  return '';
}
