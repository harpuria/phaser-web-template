import { expect, it } from 'vitest';
import { resolvePlatformTarget } from '../../src/config/platform';

it('keeps CrazyGames as the default and supports explicit platform modes', () => {
  expect(resolvePlatformTarget(undefined)).toBe('crazygames');
  expect(resolvePlatformTarget(undefined, 'production')).toBe('crazygames');
  expect(resolvePlatformTarget(undefined, 'standalone')).toBe('standalone');
  expect(resolvePlatformTarget(undefined, 'crazygames')).toBe('crazygames');
  expect(resolvePlatformTarget('standalone', 'development')).toBe('standalone');
  expect(resolvePlatformTarget('crazygames', 'production')).toBe('crazygames');
});

it.each(['', 'Standalone', 'crazygame', 'false', false, null])(
  'rejects invalid target %s',
  (value) => {
    expect(() => resolvePlatformTarget(value)).toThrow('VITE_PLATFORM must be');
  },
);

it('rejects conflicting platform modes instead of building for an unexpected host', () => {
  expect(() => resolvePlatformTarget('crazygames', 'standalone')).toThrow(
    'conflicts',
  );
  expect(() => resolvePlatformTarget('standalone', 'crazygames')).toThrow(
    'conflicts',
  );
  expect(resolvePlatformTarget('standalone', 'standalone')).toBe('standalone');
});

it('requires an explicit target for deployment builds', () => {
  expect(() => resolvePlatformTarget(undefined, 'production', true)).toThrow(
    'Choose a deployment target',
  );
  expect(resolvePlatformTarget(undefined, 'standalone', true)).toBe(
    'standalone',
  );
  expect(resolvePlatformTarget(undefined, 'crazygames', true)).toBe(
    'crazygames',
  );
  expect(resolvePlatformTarget('standalone', 'production', true)).toBe(
    'standalone',
  );
});
