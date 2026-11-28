import { EventEmitter } from 'node:events';
import type Phaser from 'phaser';
import { expect, it, onTestFinished, vi } from 'vitest';
import { isFramed, resolveLayout } from '../../src/core/layout';
import { pickLocale } from '../../src/core/locale';
import { bindFullscreenOrientation } from '../../src/core/screen';
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

it('locks orientation when the game enters fullscreen and releases it on exit or teardown', () => {
  const stage = {};
  const doc = { fullscreenElement: null as object | null };
  vi.stubGlobal('document', doc);
  onTestFinished(() => {
    vi.unstubAllGlobals();
  });
  const scale = Object.assign(new EventEmitter(), { fullscreenTarget: stage });
  const orientation = {
    lock: vi.fn().mockResolvedValue(undefined),
    unlock: vi.fn(),
  };
  const stop = bindFullscreenOrientation(
    scale as unknown as Phaser.Scale.ScaleManager,
    'portrait',
    orientation,
  );
  scale.emit('fullscreenfailed');
  doc.fullscreenElement = {};
  scale.emit('enterfullscreen');
  expect(orientation.lock).not.toHaveBeenCalled();
  doc.fullscreenElement = stage;
  scale.emit('enterfullscreen');
  expect(orientation.lock).toHaveBeenCalledExactlyOnceWith('portrait');
  doc.fullscreenElement = null;
  scale.emit('leavefullscreen');
  expect(orientation.unlock).toHaveBeenCalledTimes(1);

  doc.fullscreenElement = stage;
  orientation.lock.mockRejectedValue(
    new DOMException('Denied', 'SecurityError'),
  );
  scale.emit('enterfullscreen');
  orientation.unlock.mockImplementation(() => {
    throw new DOMException('Not supported', 'NotSupportedError');
  });
  stop();
  expect(orientation.unlock).toHaveBeenCalledTimes(2);
  expect(scale.listenerCount('enterfullscreen')).toBe(0);
  expect(scale.listenerCount('leavefullscreen')).toBe(0);
});
