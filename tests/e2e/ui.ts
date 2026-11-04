import type { FrameLocator, Page } from '@playwright/test';

/**
 * 검사가 사용하는 HTML UI 요소. 문구가 아니라 id로 찾으므로 언어를 바꿔도 검사가 유지된다.
 * 데모 Shell을 교체하면 이 파일의 id만 새 UI에 맞추고, contract/crazygames 검사는 그대로 사용한다.
 */
export function ui(root: Page | FrameLocator) {
  const id = (value: string) => root.locator(`#${value}`);
  return {
    app: id('app'),
    game: id('game'),
    canvas: root.locator('#game canvas'),
    /** 'MENU' | 'PLAYING' | 'RESULT' | 'PAUSED' (언어와 무관) */
    mode: id('mode-label'),
    play: id('play'),
    /** aria-pressed="true"면 수동 일시정지 상태 */
    pause: id('pause'),
    home: id('home'),
    fullscreen: id('fullscreen'),
    exitFullscreen: id('exit-fullscreen'),
    settings: id('settings'),
    settingsDialog: id('settings-dialog'),
    settingsDone: id('settings-done'),
    muted: id('muted'),
    reducedMotion: id('reducedMotion'),
    resetSave: id('reset'),
    resetSettings: id('reset-settings'),
    retrySave: id('retry-save'),
    best: id('best'),
    rounds: id('rounds'),
    storageKind: id('storage-kind'),
    /** data-state: 'ready' | 'retrying' | 'protected' | 'platform-unavailable' */
    storageStatus: id('storage-status'),
    /** data-kind: 'info' | 'loading-error'. 서비스 결과 코드(completed 등)를 그대로 포함한다. */
    notice: id('notice'),
    pauseOverlay: id('pause-overlay'),
    errorOverlay: id('error-overlay'),
    reload: id('reload'),
    consent: id('consent'),
    outcome: id('outcome'),
    reward: id('reward'),
    purchase: id('purchase'),
    sound: id('sound'),
  };
}

/** 데모 asset 경로. asset 실패 검사가 사용한다. 내 게임의 asset 경로로 바꾼다. */
export const gameAssetPattern = '**/assets/demo/**';

/** 저장 키 접두사(`gameConfig.storagePrefix`). 새 게임에서 같은 값으로 바꾼다. */
export const storagePrefix = 'phaser-web-template';
