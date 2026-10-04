import type Phaser from 'phaser';
import { gameConfig } from './config/game';
import { AudioService } from './core/audio';
import { PauseState } from './core/pause';
import { settingsSchema } from './core/settings';
import { browserStorage, Store } from './core/store';
import { progressSchema } from './game/save';
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
    if (this.game?.scene.isActive('Game') && paused)
      this.game.scene.pause('Game');
    else if (this.game?.scene.isPaused('Game') && !paused)
      this.game.scene.resume('Game');
    this.audio?.suspend(paused);
    this.onState();
  });
  game?: Phaser.Game;
  audio?: AudioService;
  mode: 'menu' | 'playing' | 'result' = 'menu';
  score = 0;
  ready = false;
  loadingError = '';
  onState = () => {};
  private cleanup: (() => void)[] = [];

  attach(game: Phaser.Game) {
    this.game = game;
    this.audio = new AudioService(game.sound);
    this.audio.apply(this.settings.data);
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
