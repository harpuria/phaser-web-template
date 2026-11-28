import type Phaser from 'phaser';
import { gameConfig } from './config/game';
import { AudioService } from './core/audio';
import { PauseState } from './core/pause';
import { settingsSchema, type Settings } from './core/settings';
import { Store } from './core/store';
import { progressSchema, type Progress } from './game/save';
import { chooseRenderScale } from './core/renderScale';
import { bindFullscreenOrientation } from './core/screen';
import { Session } from './game/session';
import { resolveStrings } from './game/strings';
import type { PlatformContext } from './services/bootstrap';

export class App {
  readonly save: Store<Progress>;
  readonly settings: Store<Settings>;
  readonly platform;
  readonly storageKind;
  readonly platformWarning;
  readonly pause = new PauseState(
    (paused) => {
      for (const key of gameConfig.pausableScenes) {
        if (paused && this.game?.scene.isActive(key))
          this.game.scene.pause(key);
        else if (!paused && this.game?.scene.isPaused(key))
          this.game.scene.resume(key);
      }
    },
    () => {
      // An ad request blocks controls; audio is muted only once the ad starts.
      this.audio?.suspend(this.pause.hasOtherThan('service'));
      this.syncGameplay();
      this.onState();
    },
  );
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
  /** 사용자에게 보여줄 언어와 문구(`src/game/strings.ts`). 시작 시 한 번 정한다. */
  readonly strings = resolveStrings(
    gameConfig.locale,
    gameConfig.fallbackLocale,
  );
  readonly locale = this.strings.locale;
  readonly text = this.strings.text;
  /** 게임이 정의한 진행 중 상태(점수, 화면 모드 등). 저장하지 않는다. */
  readonly session = new Session();
  game?: Phaser.Game;
  audio?: AudioService;
  /** Preload가 필수 asset을 모두 불러오면 true. */
  ready = false;
  /** 사용자에게 보여줄 asset 로딩 실패 또는 처리되지 않은 오류. */
  loadingError = '';
  private fatalMessage = '';
  onState = () => {};
  private cleanup: (() => void)[] = [];
  private playing = false;
  private settingsListeners = new Set<(settings: Readonly<Settings>) => void>();

  constructor(context: PlatformContext) {
    this.platform = context.platform;
    this.storageKind = context.storageKind;
    this.platformWarning = context.warning;
    this.save = new Store(
      context.storage,
      `${gameConfig.storagePrefix}:save`,
      progressSchema,
    );
    this.settings = new Store(
      context.storage,
      `${gameConfig.storagePrefix}:settings`,
      settingsSchema(matchMedia('(prefers-reduced-motion: reduce)').matches),
    );
    this.platform.onAdState = (state) => {
      this.audio?.setExternalMute('advertisement', state === 'playing');
      this.pause.set('service', state !== 'idle');
    };
  }

  /** Scenes report controllable gameplay, independent of the demo's session model. */
  setGameplay(active: boolean) {
    this.playing = active;
    this.syncGameplay();
  }
  /** 장면이 `setGameplay(true)`로 알린 조작 가능한 플레이 중인지. 일시정지 여부와 무관하다. */
  get gameplayActive() {
    return this.playing;
  }
  private syncGameplay() {
    // CrazyGames handles visibility/focus itself; only intentional breaks are reported.
    this.platform.setGameplay(
      this.playing && !this.fatalError && !this.pause.hasOtherThan('hidden'),
    );
  }

  get fatalError() {
    return this.fatalMessage;
  }
  /** Keep the first failure latched until reload; failed state must not be saved. */
  fail(message: string) {
    if (this.fatalError) return;
    this.fatalMessage = message || this.text.system.unknownError;
    if (this.game) this.game.input.enabled = false;
    this.pause.set('fatal', true);
  }

  attach(game: Phaser.Game) {
    this.game = game;
    this.audio = new AudioService(game.sound, this.settings.data);
    this.audio.suspend(this.pause.hasOtherThan('service'));
    if (this.fatalError) game.input.enabled = false;
    this.cleanup.push(
      this.platform.listenMute((muted) =>
        this.audio?.setExternalMute('platform', muted),
      ),
      bindFullscreenOrientation(game.scale, gameConfig.orientation),
    );
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
    if (this.fatalError) return;
    this.save.flush();
    this.settings.flush();
    this.onState();
  }
  get transitionMs() {
    return this.settings.data.reducedMotion ? 0 : gameConfig.transitionMs;
  }
  /** Apply settings to live consumers after updating or resetting the store. */
  applySettings() {
    const settings = this.settings.data;
    this.audio?.apply(settings);
    this.settingsListeners.forEach((listener) => listener(settings));
    this.onState();
  }
  listenSettings(listener: (settings: Readonly<Settings>) => void): () => void {
    this.settingsListeners.add(listener);
    listener(this.settings.data);
    return () => {
      this.settingsListeners.delete(listener);
    };
  }
  destroy() {
    this.flush();
    this.cleanup.forEach((fn) => fn());
    this.settingsListeners.clear();
    this.platform.destroy();
    this.audio?.destroy();
  }
}
