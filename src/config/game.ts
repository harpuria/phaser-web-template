export const gameConfig = {
  title: 'Phaser Web Template',
  version: '0.3.0',
  storagePrefix: 'phaser-web-template', // 새 게임마다 고유한 값으로 변경
  width: 960,
  height: 540,
  background: '#101827',
  /** 픽셀아트 게임은 true: 텍스처 보간을 끄고 좌표를 정수로 맞춘다. */
  pixelArt: false,
  /** 전체화면에서 시도할 방향 고정. 지원하지 않는 브라우저는 안내만 표시한다. */
  orientation: 'landscape' as 'landscape' | 'portrait',
  /**
   * 고해상도 화면에서 선명하게 그리기 위한 렌더 배율 상한. 2면 GPU가 칠하는 화소가 최대 4배.
   * 저가 휴대폰에서 프레임이 떨어지면 mobile 값을 낮춘다(1이면 기본 해상도 그대로).
   */
  maxRenderScale: { desktop: 2, mobile: 1.5 },
  startScene: 'Menu',
  /** 일시정지 이유가 있는 동안 멈출 장면. 메뉴 연출처럼 계속 움직여도 되는 장면은 넣지 않는다. */
  pausableScenes: ['Game'],
  autosaveMs: 15_000,
  transitionMs: 180,
  services: { mock: true, ads: true, billing: true, analytics: true },
} as const;
