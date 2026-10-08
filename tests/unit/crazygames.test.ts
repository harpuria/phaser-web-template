import { afterEach, describe, expect, it, vi } from 'vitest';
import { Store, type StoragePort } from '../../src/core/store';
import { PauseState } from '../../src/core/pause';
import { progressSchema } from '../../src/game/save';
import { createPlatform } from '../../src/services/bootstrap';
import { CrazyGamesAdapter } from '../../src/services/crazygames';
import type {
  AdCallbacks,
  CrazyGamesSdk,
} from '../../src/services/crazygames-sdk';
import { PlatformServices } from '../../src/services/platform';

const options = {
  development: false,
  mock: true,
  ads: true,
  billing: true,
  analytics: true,
  crazyGames: { enabled: true, launch: 'full' as const },
};

function fakeSdk(environment: CrazyGamesSdk['environment'] = 'crazygames') {
  const values = new Map<string, string>();
  let callbacks: AdCallbacks | undefined;
  const sdk: CrazyGamesSdk = {
    environment,
    init: vi.fn(async () => {}),
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
      requestAd: vi.fn((_type, handlers) => {
        callbacks = handlers;
      }),
    },
    data: {
      getItem: vi.fn((key) => values.get(key) ?? null),
      setItem: vi.fn((key, value) => {
        values.set(key, value);
      }),
      removeItem: vi.fn((key) => {
        values.delete(key);
      }),
    },
  };
  return { sdk, values, callbacks: () => callbacks! };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CrazyGames initialization and storage', () => {
  it('awaits initialization before stores read cloud progress', async () => {
    const { sdk, values } = fakeSdk();
    values.set(
      'save',
      JSON.stringify({ version: 1, data: { best: 19, rounds: 7 } }),
    );
    let ready!: (sdk: CrazyGamesSdk) => void;
    const pending = createPlatform(
      options,
      () =>
        new Promise((resolve) => {
          ready = resolve;
        }),
    );
    expect(sdk.data.getItem).not.toHaveBeenCalled();
    ready(sdk);
    const context = await pending;
    const save = new Store(context.storage, 'save', progressSchema);
    expect(context.storageKind).toBe('crazygames');
    expect(save.data).toEqual({ best: 19, rounds: 7 });
    save.update((data) => ({ ...data, rounds: data.rounds + 1 }));
    expect(save.flush()).toBe(true);
    expect(JSON.parse(values.get('save')!).data.rounds).toBe(8);
  });
  it('uses standalone storage only when the SDK explicitly reports disabled', async () => {
    const storage: StoragePort = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal('window', { localStorage: storage });
    const { sdk } = fakeSdk('disabled');
    const context = await createPlatform(options, async () => sdk);
    expect(context.storage).toBe(storage);
    expect(context.storageKind).toBe('local');
    expect(await context.platform.rewarded()).toEqual({
      status: 'unavailable',
    });
    expect(sdk.data.getItem).not.toHaveBeenCalled();
  });
  it('protects progress and does not switch to local/mock when initialization fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const context = await createPlatform(
      { ...options, development: true },
      async () => {
        throw new Error('offline');
      },
    );
    expect(context.storage).toBeUndefined();
    expect(context.storageKind).toBe('unavailable');
    expect(context.platform.isMock).toBe(false);
    expect(context.warning).toContain('새로고침');
    expect(new Store(context.storage, 'save', progressSchema).status).toBe(
      'unavailable',
    );
  });
  it.each([
    'broken',
    JSON.stringify({ version: 999, data: { best: 1, rounds: 1 } }),
  ])('keeps unreadable SDK data intact: %s', (raw) => {
    const { sdk, values } = fakeSdk();
    values.set('save', raw);
    const adapter = new CrazyGamesAdapter(sdk, 'full');
    const save = new Store(adapter.storage, 'save', progressSchema);
    save.update(() => ({ best: 0, rounds: 1 }));
    expect(save.flush()).toBe(false);
    expect(values.get('save')).toBe(raw);
    expect(sdk.data.setItem).not.toHaveBeenCalled();
  });
  it('keeps Data read errors protected without falling back to another save', () => {
    const { sdk } = fakeSdk();
    vi.mocked(sdk.data.getItem).mockImplementation(() => {
      throw new Error('dataModuleDisabled');
    });
    const save = new Store(
      new CrazyGamesAdapter(sdk, 'full').storage,
      'save',
      progressSchema,
    );
    expect(save.status).toBe('unavailable');
    save.update(() => ({ best: 1, rounds: 1 }));
    expect(save.flush()).toBe(false);
    expect(sdk.data.setItem).not.toHaveBeenCalled();
  });
});

describe('CrazyGames advertisements', () => {
  it('completes real ads only on adFinished and serializes requests', async () => {
    const { sdk, callbacks } = fakeSdk();
    const platform = new PlatformServices(
      options,
      new CrazyGamesAdapter(sdk, 'full'),
    );
    const states: string[] = [];
    platform.onAdState = (state) => states.push(state);
    const pending = platform.rewarded();
    expect(states).toEqual(['requesting']);
    expect(await platform.midgame()).toEqual({ status: 'busy' });
    callbacks().adStarted();
    callbacks().adStarted();
    expect(states).toEqual(['requesting', 'playing']);
    callbacks().adFinished();
    callbacks().adFinished();
    expect(await pending).toEqual({ status: 'completed', mock: false });
    expect(states).toEqual(['requesting', 'playing', 'idle']);
    expect(await platform.purchase('product')).toEqual({
      status: 'unavailable',
    });
    expect(platform.track('event')).toBe(false);
  });
  it.each([
    'unfilled',
    'adblock',
    'adCooldown',
    'adsDisabledBasicLaunch',
    'other',
  ])('recovers from %s without granting a reward', async (code) => {
    const { sdk, callbacks } = fakeSdk();
    const platform = new PlatformServices(
      options,
      new CrazyGamesAdapter(sdk, 'full'),
    );
    const states: string[] = [];
    platform.onAdState = (state) => states.push(state);
    const pending = platform.rewarded();
    callbacks().adError({ code, message: code });
    callbacks().adFinished();
    expect(await pending).toEqual({
      status: code === 'other' ? 'error' : 'unavailable',
    });
    expect(states).toEqual(['requesting', 'idle']);
  });
  it('gates Basic Launch and feature switches before requesting ads', async () => {
    const { sdk } = fakeSdk();
    const basic = new PlatformServices(
      options,
      new CrazyGamesAdapter(sdk, 'basic'),
    );
    expect(await basic.midgame()).toEqual({ status: 'unavailable' });
    expect(await basic.rewarded()).toEqual({ status: 'unavailable' });
    const disabled = new PlatformServices(
      { ...options, ads: false },
      new CrazyGamesAdapter(sdk, 'full'),
    );
    expect(await disabled.midgame()).toEqual({ status: 'unavailable' });
    expect(sdk.ad.requestAd).not.toHaveBeenCalled();
  });
  it('marks local demo completion as mock even in a production build', async () => {
    const { sdk, callbacks } = fakeSdk('local');
    const platform = new PlatformServices(
      options,
      new CrazyGamesAdapter(sdk, 'basic'),
    );
    const pending = platform.rewarded();
    callbacks().adFinished();
    expect(await pending).toEqual({ status: 'completed', mock: true });
  });
  it('releases a timed out request, ignores stale callbacks, and accepts a new request', async () => {
    vi.useFakeTimers();
    const { sdk, callbacks } = fakeSdk();
    const platform = new PlatformServices(
      options,
      new CrazyGamesAdapter(sdk, 'full', 100),
    );
    const states: string[] = [];
    platform.onAdState = (state) => states.push(state);
    const pending = platform.rewarded();
    const stale = callbacks();
    await vi.advanceTimersByTimeAsync(100);
    expect(await pending).toEqual({ status: 'error' });
    const next = platform.midgame();
    stale.adStarted();
    stale.adFinished();
    expect(states).toEqual(['requesting', 'idle', 'requesting']);
    callbacks().adError({ code: 'unfilled', message: '' });
    expect(await next).toEqual({ status: 'unavailable' });
  });
  it('handles synchronous SDK exceptions and cancels pending work on destruction', async () => {
    const { sdk, callbacks } = fakeSdk();
    const platform = new PlatformServices(
      options,
      new CrazyGamesAdapter(sdk, 'full'),
    );
    vi.mocked(sdk.ad.requestAd).mockImplementationOnce(() => {
      throw new Error('bad SDK');
    });
    expect(await platform.rewarded()).toEqual({ status: 'error' });
    const pending = platform.midgame();
    const states = vi.fn();
    platform.onAdState = states;
    platform.destroy();
    expect(await pending).toEqual({ status: 'cancelled' });
    callbacks().adStarted();
    callbacks().adFinished();
    expect(states).not.toHaveBeenCalled();
    expect(await platform.rewarded()).toEqual({ status: 'unavailable' });
  });
  it('converts rejected SDK promises to errors without an unhandled rejection', async () => {
    const { sdk } = fakeSdk();
    vi.mocked(sdk.ad.requestAd).mockRejectedValueOnce(
      new Error('async SDK error'),
    );
    const platform = new PlatformServices(
      options,
      new CrazyGamesAdapter(sdk, 'full'),
    );
    expect(await platform.rewarded()).toEqual({ status: 'error' });
  });
});

it('reports paired loading/gameplay events once, and blocks gameplay during ads', async () => {
  const { sdk, callbacks } = fakeSdk();
  const platform = new PlatformServices(
    options,
    new CrazyGamesAdapter(sdk, 'full'),
  );
  platform.loadingStart();
  platform.loadingStart();
  platform.loadingStop();
  platform.loadingStop();
  expect(sdk.game.loadingStart).toHaveBeenCalledTimes(1);
  expect(sdk.game.loadingStop).toHaveBeenCalledTimes(1);
  platform.setGameplay(true);
  platform.setGameplay(true);
  expect(sdk.game.gameplayStart).toHaveBeenCalledTimes(1);
  const pending = platform.rewarded();
  expect(sdk.game.gameplayStop).toHaveBeenCalledTimes(1);
  callbacks().adStarted();
  platform.setGameplay(true);
  expect(sdk.game.gameplayStart).toHaveBeenCalledTimes(1);
  callbacks().adFinished();
  await pending;
  expect(sdk.game.gameplayStart).toHaveBeenCalledTimes(2);
  platform.destroy();
  expect(sdk.game.gameplayStop).toHaveBeenCalledTimes(2);
});

it('reads initial platform mute, forwards changes, and removes the listener', () => {
  const { sdk } = fakeSdk();
  sdk.game.settings.muteAudio = true;
  const adapter = new CrazyGamesAdapter(sdk, 'full');
  const changed = vi.fn();
  const stop = adapter.listenMute(changed);
  expect(changed).toHaveBeenCalledWith(true);
  const listener = vi.mocked(sdk.game.addSettingsChangeListener).mock
    .calls[0]![0];
  listener({ muteAudio: false });
  expect(changed).toHaveBeenLastCalledWith(false);
  stop();
  expect(sdk.game.removeSettingsChangeListener).toHaveBeenCalledWith(listener);
});

it('observes pause reason changes even while another reason keeps the game paused', () => {
  const paused = vi.fn();
  const reasons = vi.fn();
  const state = new PauseState(paused, reasons);
  state.set('hidden', true);
  expect(state.hasOtherThan('hidden')).toBe(false);
  state.set('manual', true);
  state.set('manual', true);
  expect(paused).toHaveBeenCalledTimes(1);
  expect(reasons).toHaveBeenCalledTimes(2);
  expect(state.hasOtherThan('hidden')).toBe(true);
});
