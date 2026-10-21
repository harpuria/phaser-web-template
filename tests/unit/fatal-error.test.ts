import type Phaser from 'phaser';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../../src/app';
import { AudioService } from '../../src/core/audio';
import {
  PlatformServices,
  type PlatformAdapter,
  type ServiceResult,
} from '../../src/services/platform';

afterEach(() => vi.unstubAllGlobals());

function fixture() {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('window', { devicePixelRatio: 1 });
  vi.stubGlobal('screen', { width: 1280, height: 720 });
  vi.stubGlobal('location', { search: '' });
  let finishAd!: (result: ServiceResult) => void;
  const adapter: PlatformAdapter = {
    environment: 'crazygames',
    capabilities: { ads: true, billing: false, analytics: false },
    setGameplay: vi.fn(),
    rewarded: (started) => {
      started();
      return new Promise((resolve) => {
        finishAd = resolve;
      });
    },
    midgame: async () => ({ status: 'unavailable' }),
    purchase: async () => ({ status: 'unavailable' }),
    track() {},
  };
  const storage = {
    getItem: () => null,
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
  const app = new App({
    platform: new PlatformServices(
      {
        development: false,
        mock: false,
        ads: true,
        billing: false,
        analytics: false,
      },
      adapter,
    ),
    storage,
    storageKind: 'crazygames',
    warning: '',
  });
  const sound = { mute: false, volume: 1 };
  app.audio = new AudioService(
    sound as Phaser.Sound.BaseSoundManager,
    app.settings.data,
  );
  const scene = {
    isActive: () => true,
    isPaused: () => true,
    pause: vi.fn(),
    resume: vi.fn(),
  };
  const input = { enabled: true };
  app.game = { scene, input } as unknown as Phaser.Game;
  return {
    app,
    adapter,
    storage,
    sound,
    scene,
    input,
    finishAd: () => finishAd({ status: 'completed', mock: false }),
  };
}

it('latches the first error, stops gameplay/audio/input, and prevents later flushes', () => {
  const { app, adapter, storage, sound, scene, input } = fixture();
  app.setGameplay(true);
  app.save.update(() => ({ best: 5, rounds: 1 }));
  app.settings.update((settings) => ({ ...settings, master: 0.5 }));
  app.fail('first failure');
  app.fail('secondary failure');
  expect(app.fatalError).toBe('first failure');
  expect(app.pause.has('fatal')).toBe(true);
  expect(scene.pause).toHaveBeenCalledWith('Game');
  expect(adapter.setGameplay).toHaveBeenLastCalledWith(false);
  expect(sound.mute).toBe(true);
  expect(input.enabled).toBe(false);
  app.flush();
  app.destroy();
  expect(storage.setItem).not.toHaveBeenCalled();
});

it('keeps a fatal pause through ad completion, tab return, and manual pause release', async () => {
  const { app, adapter, sound, scene, finishAd } = fixture();
  app.setGameplay(true);
  const pending = app.platform.rewarded();
  app.pause.set('manual', true);
  app.pause.set('hidden', true);
  app.fail('during advertisement');
  app.pause.set('manual', false);
  app.pause.set('hidden', false);
  // Complete the real asynchronous service path after the fatal state is latched.
  finishAd();
  expect(await pending).toEqual({ status: 'completed', mock: false });
  expect(app.pause.has('service')).toBe(false);
  expect(app.pause.has('fatal')).toBe(true);
  expect(adapter.setGameplay).toHaveBeenLastCalledWith(false);
  expect(sound.mute).toBe(true);
  expect(scene.resume).not.toHaveBeenCalled();
  app.destroy();
});
