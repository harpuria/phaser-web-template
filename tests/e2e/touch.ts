import type { Page } from '@playwright/test';

/** Chromium-only held touch; common browser flows use keyboard input. */
export async function holdTouchUntil(
  page: Page,
  point: { x: number; y: number },
  until: () => Promise<void>,
) {
  const touch = await page.context().newCDPSession(page);
  try {
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [point],
    });
    await until();
  } finally {
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await touch.detach();
  }
}
