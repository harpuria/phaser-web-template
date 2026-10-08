import type Phaser from 'phaser';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../../src/app';
import { AudioService } from '../../src/core/audio';
import { settingsSchema } from '../../src/core/settings';
import { CrazyGamesAdapter } from '../../src/services/crazygames';
import type {
  AdCallbacks,
  CrazyGamesSdk,
} from '../../src/services/crazygames-sdk';
import { PlatformServices } from '../../src/services/platform';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('keeps platform/ad muting above player settings and pause recovery', () => {
  const sound = { mute: false, volume: 1 };
  const settings = settingsSchema().defaults();
  const audio = new AudioService(
    sound as Phaser.Sound.BaseSoundManager,
    settings,
  );
  audio.setExternalMute('platform', true);
  audio.apply({ ...settings, muted: false });
  expect(sound.mute).toBe(true);
  audio.setExternalMute('advertisement', true);
  audio.setExternalMute('platform', false);
  expect(sound.mute).toBe(true);
  audio.setExternalMute('advertisement', false);
  expect(sound.mute).toBe(false);
  audio.apply({ ...settings, muted: true });
  audio.suspend(true);
  audio.suspend(false);
  expect(sound.mute).toBe(true);
});

it('distinguishes focus changes, intentional pauses, and ad request/start/end', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('window', { devicePixelRatio: 2 });
  vi.stubGlobal('screen', { width: 1440, height: 900 });
  vi.stubGlobal('location', { search: '' });
  let callbacks!: AdCallbacks;
  const sdk: CrazyGamesSdk = {
    init: async () => {},
    environment: 'crazygames',
    game: {
      settings: { muteAudio: false },
      loadingStart: vi.fn(),
      loadingStop: vi.fn(),
      gameplayStart: vi.fn(),
      gameplayStop: vi.fn(),
      addSettingsChangeListener: vi.fn(),
      removeSettingsChangeListener: vi.fn(),
    },
    ad: {
      requestAd: (_type, handlers) => {
        callbacks = handlers;
      },
    },
    data: { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() },
  };
  const platform = new PlatformServices(
    {
      development: false,
      mock: true,
      ads: true,
      billing: false,
      analytics: false,
    },
    new CrazyGamesAdapter(sdk, 'full'),
  );
  const app = new App({
    platform,
    storage: sdk.data,
    storageKind: 'crazygames',
    warning: '',
  });
  const sound = { mute: false, volume: 1 };
  app.audio = new AudioService(
    sound as Phaser.Sound.BaseSoundManager,
    app.settings.data,
  );
  app.setGameplay(true);
  app.pause.set('hidden', true);
  expect(sdk.game.gameplayStop).not.toHaveBeenCalled();
  app.pause.set('manual', true);
  expect(sdk.game.gameplayStop).toHaveBeenCalledTimes(1);
  app.pause.set('hidden', false);
  expect(sound.mute).toBe(true);
  app.pause.set('manual', false);
  expect(sdk.game.gameplayStart).toHaveBeenCalledTimes(2);
  const pending = app.platform.rewarded();
  expect(app.pause.paused).toBe(true);
  expect(sound.mute).toBe(false);
  callbacks.adStarted();
  expect(sound.mute).toBe(true);
  app.pause.set('manual', true);
  callbacks.adFinished();
  expect(await pending).toEqual({ status: 'completed', mock: false });
  expect(app.pause.has('service')).toBe(false);
  expect(app.pause.paused).toBe(true);
  expect(sound.mute).toBe(true);
  expect(sdk.game.gameplayStart).toHaveBeenCalledTimes(2);
  app.pause.set('manual', false);
  expect(sdk.game.gameplayStart).toHaveBeenCalledTimes(3);
  expect(sound.mute).toBe(false);
  app.destroy();
});
