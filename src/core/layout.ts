export type Layout = 'page' | 'embed';

/**
 * HTML 배치를 정한다. URL의 `?layout=page|embed`가 설정보다 우선한다(배포 전 확인용).
 * 'auto'는 다른 페이지의 iframe 안(CrazyGames, itch.io 등)이면 embed, 단독 페이지면 page.
 */
export function resolveLayout(
  setting: 'auto' | Layout,
  search: string,
  framed: boolean,
): Layout {
  const requested = new URLSearchParams(search).get('layout');
  if (requested === 'page' || requested === 'embed') return requested;
  if (setting !== 'auto') return setting;
  return framed ? 'embed' : 'page';
}

/** 다른 origin의 부모 창에 접근할 때도 예외 없이 iframe 여부를 확인한다. */
export function isFramed(win: Window = window): boolean {
  try {
    return win.self !== win.top;
  } catch {
    return true;
  }
}
