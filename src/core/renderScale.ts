export interface RenderScaleInput {
  /** window.devicePixelRatio */
  dpr: number;
  /** 화면(전체화면 기준) CSS 크기 */
  screenWidth: number;
  screenHeight: number;
  /** 안전 영역(gameConfig.width/height) */
  baseWidth: number;
  baseHeight: number;
  /** 터치 위주 기기(휴대폰·태블릿)인지 */
  coarse: boolean;
  /** 기기 종류별 상한. GPU가 칠하는 화소 수는 배율의 제곱으로 늘어난다. */
  max: { desktop: number; mobile: number };
}

/**
 * 렌더 배율 k를 고른다. 게임은 width·k × height·k 화소로 그리고 카메라 zoom k로 보여 주므로
 * 장면 좌표는 그대로 안전 영역 단위다. 전체화면에서 실제 화소에 가까운 값을 목표로 하되
 * 1 이상, 기기별 상한 이하로 0.25 단위 반올림한다.
 */
export function chooseRenderScale(input: RenderScaleInput): number {
  const long = Math.max(input.screenWidth, input.screenHeight);
  const short = Math.min(input.screenWidth, input.screenHeight);
  const baseLong = Math.max(input.baseWidth, input.baseHeight);
  const baseShort = Math.min(input.baseWidth, input.baseHeight);
  const fit = Math.min(long / baseLong, short / baseShort);
  const cap = input.coarse ? input.max.mobile : input.max.desktop;
  const raw = Math.round(input.dpr * fit * 4) / 4;
  return Math.min(Math.max(raw || 1, 1), Math.max(cap, 1));
}
