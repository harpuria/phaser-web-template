import type { StoragePort } from '../core/store';

export const crazyGamesSdkUrl =
  'https://sdk.crazygames.com/crazygames-sdk-v3.js';

export interface CrazyGamesSettings {
  muteAudio: boolean;
  disableChat?: boolean;
}
export interface AdCallbacks {
  adStarted(): void;
  adFinished(): void;
  adError(error: { code: string; message: string }): void;
}
/** Only the documented v3 surface used by this template. */
export interface CrazyGamesSdk {
  init(): Promise<void>;
  readonly environment: 'local' | 'crazygames' | 'disabled';
  readonly game: {
    readonly settings: CrazyGamesSettings;
    loadingStart(): void;
    loadingStop(): void;
    gameplayStart(): void;
    gameplayStop(): void;
    addSettingsChangeListener(
      listener: (settings: CrazyGamesSettings) => void,
    ): void;
    removeSettingsChangeListener(
      listener: (settings: CrazyGamesSettings) => void,
    ): void;
  };
  readonly ad: {
    requestAd(
      type: 'rewarded' | 'midgame',
      callbacks: AdCallbacks,
    ): void | Promise<void>;
  };
  readonly data: StoragePort;
}

declare global {
  interface Window {
    CrazyGames?: { SDK: CrazyGamesSdk };
  }
}

let initialization: Promise<CrazyGamesSdk> | undefined;

/** Share one initialization across callers; failures require a page reload. */
export function initializeCrazyGames(): Promise<CrazyGamesSdk> {
  initialization ??= new Promise((resolve, reject) => {
    const script = window.CrazyGames?.SDK
      ? undefined
      : document.createElement('script');
    const timer = setTimeout(() => {
      script?.remove();
      reject(new Error('CrazyGames SDK initialization timed out'));
    }, 10_000);
    const finish = async () => {
      try {
        const sdk = window.CrazyGames?.SDK;
        if (!sdk) throw new Error('CrazyGames SDK is missing');
        await sdk.init();
        resolve(sdk);
      } catch (error) {
        reject(error);
      } finally {
        clearTimeout(timer);
      }
    };
    if (window.CrazyGames?.SDK) {
      void finish();
      return;
    }
    if (!script) return;
    script.src = crazyGamesSdkUrl;
    script.async = true;
    script.onload = () => void finish();
    script.onerror = () => {
      clearTimeout(timer);
      script?.remove();
      reject(new Error('CrazyGames SDK could not be loaded'));
    };
    document.head.appendChild(script);
  });
  return initialization;
}
