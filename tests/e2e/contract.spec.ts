import { expect, test } from '@playwright/test';
import { disableSdk } from './platform-fixtures';
import { gameAssetPattern, storagePrefix, ui } from './ui';

// 템플릿 공통 계약: 저장 보호·재시도, asset 실패, 오류 정지, 전체화면 조작.
// 데모를 교체해도 유지한다. 요소 위치가 바뀌면 ui.ts만 고친다.
const saveKey = `${storagePrefix}:save`;

test.beforeEach(async ({ page }) => {
  await disableSdk(page);
});

test('settings with an extra saved field can be edited and reopened', async ({
  page,
}) => {
  const u = ui(page);
  const key = `${storagePrefix}:settings`;
  await page.goto('/');
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        data: {
          muted: true,
          master: 0.5,
          music: 0.25,
          sfx: 0.75,
          reducedMotion: false,
          legacyOption: true,
        },
      }),
    );
  }, key);
  await page.reload();
  await u.settings.click();
  await expect(u.muted).toBeChecked();
  await u.muted.uncheck();
  await u.settingsDone.click();
  await page.reload();
  await u.settings.click();
  await expect(u.settingsDialog).toBeVisible();
  await expect(u.muted).not.toBeChecked();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).data,
      key,
    ),
  ).toMatchObject({
    muted: false,
    master: 0.5,
    legacyOption: true,
  });
});

test('corrupt data remains intact until explicit reset', async ({ page }) => {
  const u = ui(page);
  await page.goto('/');
  await page.evaluate((key) => localStorage.setItem(key, 'broken'), saveKey);
  await page.reload();
  await expect(u.storageStatus).toHaveAttribute('data-state', 'protected');
  await expect(u.storageStatus).toContainText('corrupt');
  await u.settings.click();
  expect(await page.evaluate((key) => localStorage.getItem(key), saveKey)).toBe(
    'broken',
  );
  page.once('dialog', (dialog) => dialog.accept());
  await u.resetSave.click();
  await expect(u.storageStatus).toHaveAttribute('data-state', 'ready');
});

test('a temporary save failure can be retried without losing the round', async ({
  page,
}) => {
  const u = ui(page);
  await page.goto('/?round=1');
  await expect(u.play).toBeEnabled();
  await page.evaluate((saveKey) => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === saveKey) {
        Storage.prototype.setItem = write;
        throw new DOMException(
          'Temporary storage failure',
          'QuotaExceededError',
        );
      }
      write.call(this, key, value);
    };
  }, saveKey);
  await u.play.click();
  // The round runs on game time; slow runners clamp frame delta.
  await expect(u.mode).toHaveText('RESULT', { timeout: 20_000 });
  await expect(u.rounds).toHaveText('1');
  await expect(u.storageStatus).toHaveAttribute('data-state', 'retrying');
  await u.retrySave.click();
  await expect(u.storageStatus).toHaveAttribute('data-state', 'ready');
  await page.reload();
  await expect(u.rounds).toHaveText('1');
});

test('fullscreen keeps start, pause, restart, and menu controls usable', async ({
  page,
}) => {
  const u = ui(page);
  await page.goto('/?round=3');
  await expect(u.play).toBeEnabled();
  test.skip(
    await u.fullscreen.isHidden(),
    'Fullscreen is not supported by this browser/device',
  );
  const observesOrientation = await page.evaluate(() => {
    if (!screen.orientation) return false;
    Object.defineProperty(screen.orientation, 'lock', {
      value: async () => {
        document.documentElement.dataset.fullscreenAtLock =
          document.fullscreenElement?.id ?? 'none';
        throw new DOMException('Orientation lock denied', 'SecurityError');
      },
    });
    return true;
  });
  await u.fullscreen.click();
  if (observesOrientation)
    await expect(page.locator('html')).toHaveAttribute(
      'data-fullscreen-at-lock',
      'stage',
    );
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement?.id))
    .toBe('stage');
  expect(
    await u.play.evaluate((button) =>
      document.fullscreenElement?.contains(button),
    ),
  ).toBe(true);
  await u.play.click();
  await u.pause.click();
  await expect(u.pauseOverlay).toBeVisible();
  await u.pause.click();
  await expect(u.mode).toHaveText('RESULT', { timeout: 20_000 });
  await page.screenshot({
    path: test.info().outputPath('fullscreen-result.png'),
  });
  await u.play.click();
  await expect(u.mode).toHaveText('PLAYING');
  await u.home.click();
  await expect(u.mode).toHaveText('MENU');
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement?.id))
    .toBe('stage');
  await u.exitFullscreen.click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement))
    .toBeNull();
});

test('asset failure keeps the game disabled and shows recovery instructions', async ({
  page,
}) => {
  const u = ui(page);
  await page.route(gameAssetPattern, (route) => route.abort());
  await page.goto('/');
  await expect(u.notice).toHaveAttribute('data-kind', 'loading-error');
  await expect(u.play).toBeDisabled();
});

test('uncaught game errors show a recovery screen', async ({ page }) => {
  const u = ui(page);
  await page.goto('/');
  await expect(u.play).toBeEnabled();
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error('demo failure');
    });
  });
  await expect(u.errorOverlay).toContainText('demo failure');
  await expect(u.reload).toBeVisible();
});

test('errors from other origins (ads, SDKs, extensions) do not stop the game', async ({
  page,
}) => {
  const u = ui(page);
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  await page.route('https://third-party.example/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `setTimeout(() => { throw new Error('third-party failure'); });
        Promise.reject(new Error('third-party rejection'));`,
    }),
  );
  await page.goto('/?round=30');
  await u.play.click();
  await expect(u.mode).toHaveText('PLAYING');
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.src = 'https://third-party.example/ads.js';
    document.head.append(script);
  });
  // Browsers mute cross-origin details ("Script error.") and may not report the rejection at all.
  await expect
    .poll(() => warnings.some((text) => text.includes('External error')))
    .toBe(true);
  await page.waitForTimeout(300);
  await expect(u.errorOverlay).toBeHidden();
  await expect(u.mode).toHaveText('PLAYING');
  await expect(u.pause).toBeEnabled();
});
