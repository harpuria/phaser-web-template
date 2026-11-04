import { expect, it, vi } from 'vitest';
import { isFramed, resolveLayout } from '../../src/core/layout';
import { pickLocale } from '../../src/core/locale';
import { releaseOrientationOnExit } from '../../src/core/screen';
import { locales, resolveStrings } from '../../src/game/strings';

it('embeds inside iframes, lets the URL override, and honours a fixed layout', () => {
  expect(resolveLayout('auto', '', true)).toBe('embed');
  expect(resolveLayout('auto', '', false)).toBe('page');
  expect(resolveLayout('auto', '?layout=embed', false)).toBe('embed');
  expect(resolveLayout('embed', '?layout=page', true)).toBe('page');
  expect(resolveLayout('embed', '?layout=wide', false)).toBe('embed');
  expect(resolveLayout('page', '', true)).toBe('page');
});

it('treats an inaccessible parent window as an iframe', () => {
  const top = {} as Window;
  expect(isFramed({ self: top, top } as unknown as Window)).toBe(false);
  expect(isFramed({ self: {}, top } as unknown as Window)).toBe(true);
  const crossOrigin = {
    self: {},
    get top(): Window {
      throw new DOMException('Blocked', 'SecurityError');
    },
  };
  expect(isFramed(crossOrigin as unknown as Window)).toBe(true);
});

it('picks the first supported browser language, including regional tags', () => {
  const supported = ['ko', 'en'] as const;
  expect(pickLocale(supported, ['ko-KR', 'en-US'], 'en')).toBe('ko');
  expect(pickLocale(supported, ['fr-FR', 'EN-gb'], 'ko')).toBe('en');
  expect(pickLocale(supported, ['ja-JP'], 'en')).toBe('en');
  expect(pickLocale(supported, [], 'ko')).toBe('ko');
});

it('resolves strings for the configured or detected locale', () => {
  expect(resolveStrings('auto', 'en', ['ko-KR']).locale).toBe('ko');
  expect(resolveStrings('auto', 'en', ['de-DE']).locale).toBe('en');
  expect(resolveStrings('ko', 'en', ['en-US']).text).toBe(locales.ko);
  // Every locale supplies the same keys, including nested groups.
  const shape = (value: object): unknown =>
    Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        item && typeof item === 'object' && !Array.isArray(item)
          ? shape(item)
          : typeof item,
      ]),
    );
  expect(shape(locales.en)).toEqual(shape(locales.ko));
  expect(locales.en.shell.features).toHaveLength(
    locales.ko.shell.features.length,
  );
});

it('releases the orientation lock whenever fullscreen ends', () => {
  const listeners = new Map<string, () => void>();
  const scale = {
    on: vi.fn((event: string, listener: () => void) => {
      listeners.set(event, listener);
    }),
    off: vi.fn((event: string) => {
      listeners.delete(event);
    }),
  };
  const orientation = { unlock: vi.fn() };
  const stop = releaseOrientationOnExit(
    scale as never,
    orientation as unknown as ScreenOrientation,
  );
  listeners.get('leavefullscreen')?.();
  expect(orientation.unlock).toHaveBeenCalledTimes(1);
  orientation.unlock.mockImplementation(() => {
    throw new DOMException('Not supported', 'NotSupportedError');
  });
  expect(() => listeners.get('leavefullscreen')?.()).not.toThrow();
  stop();
  expect(listeners.has('leavefullscreen')).toBe(false);
});
