import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function loaderFixture() {
  vi.resetModules();
  const script = {
    src: '',
    async: false,
    onload: () => {},
    onerror: () => {},
    remove: vi.fn(),
  };
  const createElement = vi.fn(() => script);
  const appendChild = vi.fn();
  const windowStub: { CrazyGames?: { SDK: { init(): Promise<void> } } } = {};
  vi.stubGlobal('window', windowStub);
  vi.stubGlobal('document', { createElement, head: { appendChild } });
  const { initializeCrazyGames, crazyGamesSdkUrl } =
    await import('../../src/services/crazygames-sdk');
  return {
    script,
    createElement,
    appendChild,
    windowStub,
    initializeCrazyGames,
    crazyGamesSdkUrl,
  };
}

it('loads the official v3 endpoint once and awaits a shared initialization', async () => {
  const fixture = await loaderFixture();
  const first = fixture.initializeCrazyGames();
  expect(fixture.initializeCrazyGames()).toBe(first);
  expect(fixture.createElement).toHaveBeenCalledTimes(1);
  expect(fixture.appendChild).toHaveBeenCalledWith(fixture.script);
  expect(fixture.script.src).toBe(fixture.crazyGamesSdkUrl);
  let resolveInit!: () => void;
  const init = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        resolveInit = resolve;
      }),
  );
  fixture.windowStub.CrazyGames = { SDK: { init } };
  fixture.script.onload();
  resolveInit();
  expect(await first).toBe(fixture.windowStub.CrazyGames.SDK);
  expect(init).toHaveBeenCalledTimes(1);
});

it('rejects failed downloads and retains failure until reload', async () => {
  const fixture = await loaderFixture();
  const pending = fixture.initializeCrazyGames();
  const rejected = expect(pending).rejects.toThrow('could not be loaded');
  fixture.script.onerror();
  await rejected;
  expect(fixture.script.remove).toHaveBeenCalledTimes(1);
  expect(fixture.initializeCrazyGames()).toBe(pending);
});

it('bounds SDK initialization and does not adopt a late successful result', async () => {
  vi.useFakeTimers();
  const fixture = await loaderFixture();
  const pending = fixture.initializeCrazyGames();
  let resolveInit!: () => void;
  fixture.windowStub.CrazyGames = {
    SDK: {
      init: () =>
        new Promise<void>((resolve) => {
          resolveInit = resolve;
        }),
    },
  };
  fixture.script.onload();
  const rejected = expect(pending).rejects.toThrow('timed out');
  await vi.advanceTimersByTimeAsync(10_000);
  await rejected;
  resolveInit();
  await expect(fixture.initializeCrazyGames()).rejects.toThrow('timed out');
});
