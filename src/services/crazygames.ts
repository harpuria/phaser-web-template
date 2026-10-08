import type { StoragePort } from '../core/store';
import type { AdCallbacks, CrazyGamesSdk } from './crazygames-sdk';
import type { PlatformAdapter, ServiceResult } from './platform';

export class CrazyGamesAdapter implements PlatformAdapter {
  readonly environment: 'local' | 'crazygames';
  readonly capabilities;
  readonly storage: StoragePort;
  private gameplay = false;
  private loading = false;
  private destroyed = false;
  private adPending = false;
  private cancelAd?: () => void;

  constructor(
    private sdk: CrazyGamesSdk,
    launch: 'basic' | 'full',
    private adTimeoutMs = 180_000,
  ) {
    if (sdk.environment === 'disabled')
      throw new Error('CrazyGames SDK disabled');
    this.environment = sdk.environment;
    this.capabilities = {
      ads: launch === 'full' || this.environment === 'local',
      billing: false,
      analytics: false,
    };
    // Preserve the SDK method receiver and never fall back after a Data read error.
    this.storage = {
      getItem: (key) => sdk.data.getItem(key),
      setItem: (key, value) => sdk.data.setItem(key, value),
      removeItem: (key) => sdk.data.removeItem(key),
    };
  }

  private call(action: () => void) {
    try {
      action();
    } catch (error) {
      console.warn('[CrazyGames SDK]', error);
    }
  }
  loadingStart() {
    if (this.destroyed || this.loading) return;
    this.call(() => this.sdk.game.loadingStart());
    this.loading = true;
  }
  loadingStop() {
    if (this.destroyed || !this.loading) return;
    this.call(() => this.sdk.game.loadingStop());
    this.loading = false;
  }
  setGameplay(active: boolean) {
    if (this.destroyed || this.gameplay === active) return;
    this.call(() =>
      active ? this.sdk.game.gameplayStart() : this.sdk.game.gameplayStop(),
    );
    this.gameplay = active;
  }
  listenMute(listener: (muted: boolean) => void) {
    const changed = (settings: { muteAudio: boolean }) =>
      listener(settings.muteAudio);
    changed(this.sdk.game.settings);
    this.sdk.game.addSettingsChangeListener(changed);
    return () =>
      this.call(() => this.sdk.game.removeSettingsChangeListener(changed));
  }
  rewarded(onStarted: () => void) {
    return this.requestAd('rewarded', onStarted);
  }
  midgame(onStarted: () => void) {
    return this.requestAd('midgame', onStarted);
  }
  private requestAd(
    type: 'rewarded' | 'midgame',
    onStarted: () => void,
  ): Promise<ServiceResult> {
    if (this.destroyed || !this.capabilities.ads)
      return Promise.resolve({ status: 'unavailable' });
    if (this.adPending) return Promise.resolve({ status: 'busy' });
    this.adPending = true;
    return new Promise((resolve) => {
      let settled = false;
      let started = false;
      const finish = (result: ServiceResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.cancelAd = undefined;
        this.adPending = false;
        resolve(result);
      };
      const timer = setTimeout(
        () => finish({ status: 'error' }),
        this.adTimeoutMs,
      );
      this.cancelAd = () => finish({ status: 'cancelled' });
      const callbacks: AdCallbacks = {
        adStarted: () => {
          if (settled || started) return;
          started = true;
          onStarted();
        },
        adFinished: () =>
          finish({ status: 'completed', mock: this.environment === 'local' }),
        adError: (error) =>
          finish({
            status: [
              'adsDisabledBasicLaunch',
              'unfilled',
              'adblock',
              'adCooldown',
            ].includes(error.code)
              ? 'unavailable'
              : 'error',
          }),
      };
      try {
        const requested = this.sdk.ad.requestAd(type, callbacks);
        void Promise.resolve(requested).catch(() =>
          finish({ status: 'error' }),
        );
      } catch {
        finish({ status: 'error' });
      }
    });
  }
  async purchase(): Promise<ServiceResult> {
    return { status: 'unavailable' };
  }
  track() {}
  destroy() {
    this.setGameplay(false);
    this.destroyed = true;
    this.cancelAd?.();
  }
}
