import { expect, it } from 'vitest';
import { chooseRenderScale } from '../../src/core/renderScale';

const base = {
  baseWidth: 960,
  baseHeight: 540,
  max: { desktop: 2, mobile: 1.5 },
};

it.each([
  ['full HD monitor', 1, 1920, 1080, false, 2],
  ['1366×768 laptop', 1, 1366, 768, false, 1.5],
  ['retina laptop, capped', 2, 1440, 900, false, 2],
  ['small low-DPI window', 1, 800, 600, false, 1],
  ['iPhone, mobile cap', 3, 390, 844, true, 1.5],
  ['low-end Android 1x', 1, 360, 640, true, 1],
] as const)('%s → %s', (_name, dpr, w, h, coarse, expected) => {
  expect(
    chooseRenderScale({
      ...base,
      dpr,
      screenWidth: w,
      screenHeight: h,
      coarse,
    }),
  ).toBe(expected);
});

it('never drops below 1 or exceeds the cap, even with bad input', () => {
  const input = { ...base, screenWidth: 0, screenHeight: 0, coarse: false };
  expect(chooseRenderScale({ ...input, dpr: 0 })).toBe(1);
  expect(chooseRenderScale({ ...input, dpr: NaN })).toBe(1);
  expect(
    chooseRenderScale({
      ...base,
      dpr: 4,
      screenWidth: 3840,
      screenHeight: 2160,
      coarse: false,
      max: { desktop: 0.5, mobile: 1 },
    }),
  ).toBe(1);
});
