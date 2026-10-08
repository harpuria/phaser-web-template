import type Phaser from 'phaser';
import { gameConfig } from './config/game';
import { AudioService } from './core/audio';
import { PauseState } from './core/pause';
import { settingsSchema } from './core/settings';
import { chooseRenderScale } from './core/renderScale';
import { browserStorage, Store } from './core/store';
import { progressSchema } from './game/save';
import { Session } from './game/session';
import { PlatformServices } from './services/platform';

export class App {
  readonly save = new Store(
    browserStorage(),
    `${gameConfig.storagePrefix}:save`,
    progressSchema,
  );
  readonly settings = new Store(
    browserStorage(),
    `${gameConfig.storagePrefix}:settings`,
    settingsSchema(matchMedia('(prefers-reduced-motion: reduce)').matches),
  );
  readonly platform = new PlatformServices({
    ...gameConfig.services,
    development: import.meta.env.DEV,
  });
  readonly pause = new PauseState((paused) => {
    for (const key of gameConfig.pausableScenes) {
      if (paused && this.game?.scene.isActive(key)) this.game.scene.pause(key);
      else if (!paused && this.game?.scene.isPaused(key))
        this.game.scene.resume(key);
    }
    this.audio?.suspend(paused);
    this.onState();
  });
  /** 렌더 배율. 게임은 기본 해상도 × 이 값으로 그리고 카메라 zoom으로 맞춘다. 시작 시 한 번 정한다. */
  readonly renderScale = chooseRenderScale({
    dpr: window.devicePixelRatio || 1,
    screenWidth: screen.width,
    screenHeight: screen.height,
    baseWidth: gameConfig.width,
    baseHeight: gameConfig.height,
    coarse: matchMedia('(pointer: coarse)').matches,
    max: gameConfig.maxRenderScale,
  });
  /** 개발 서버에서 `?debug`: 물리 충돌 영역과 렌더 배율·FPS 표시. 배포 빌드에서는 항상 false. */
  readonly debug =
    import.meta.env.DEV && new URLSearchParams(location.search).has('debug');
  /** 게임이 정의한 진행 중 상태(점수, 화면 모드 등). 저장하지 않는다. */
  readonly session = new Session();
  game?: Phaser.Game;
  audio?: AudioService;
  /** Preload가 필수 asset을 모두 불러오면 true. */
  ready = false;
  /** 사용자에게 보여줄 asset 로딩 실패 또는 처리되지 않은 오류. */
  loadingError = '';
  fatalError = '';
  onState = () => {};
  private cleanup: (() => void)[] = [];

  attach(game: Phaser.Game) {
    this.game = game;
    this.audio = new AudioService(game.sound, this.settings.data);
    const visibility = () => {
      if (document.hidden) this.flush();
      this.pause.set('hidden', document.hidden);
    };
    const flush = () => this.flush();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', flush);
    const timer = window.setInterval(flush, gameConfig.autosaveMs);
    this.cleanup.push(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', flush);
    });
    visibility();
  }
  flush() {
    this.save.flush();
    this.settings.flush();
    this.onState();
  }
  get transitionMs() {
    return this.settings.data.reducedMotion ? 0 : gameConfig.transitionMs;
  }
  destroy() {
    this.flush();
    this.cleanup.forEach((fn) => fn());
    this.audio?.destroy();
  }
}
