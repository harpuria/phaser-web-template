import { expect, test } from '@playwright/test';
import { disableSdk } from './platform-fixtures';
import { holdTouchUntil } from './touch';
import { ui } from './ui';

// 예제(별 모으기) 흐름 검사. 데모를 내 게임으로 바꾸면 이 파일을 내 게임 흐름으로 교체한다.
// 템플릿 공통 계약은 contract.spec.ts와 crazygames.spec.ts에 있다.
test.beforeEach(async ({ page }) => {
  await disableSdk(page);
});

test('play, pause, settings, save, restart, and menu navigation', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const u = ui(page);
  // `?round=4` shortens the demo round so the full flow runs in seconds.
  await page.goto('/?round=4');
  await expect(u.canvas).toBeVisible();
  await expect(u.mode).toHaveText('MENU');
  // The canvas exists before preload ends; wait for actual UI readiness.
  await expect(u.play).toBeEnabled();
  await u.play.click();
  await expect(u.mode).toHaveText('PLAYING');
  await u.pause.click();
  await expect(u.pause).toHaveAttribute('aria-pressed', 'true');
  await expect(u.pauseOverlay).toBeVisible();
  await u.settings.click();
  await u.muted.check();
  await u.settingsDone.click();
  await expect(u.pauseOverlay).toBeVisible();
  await u.pause.click();
  await expect(u.pauseOverlay).toBeHidden();
  const box = (await u.canvas.boundingBox())!;
  // EXPAND may widen the game; the 960×540 safe area stays centered inside it.
  // Canvas pixels = game units × render scale (see core/renderScale.ts).
  const k = Number(await u.game.getAttribute('data-render-scale'));
  const gameWidth =
    (await u.canvas.evaluate((c: HTMLCanvasElement) => c.width)) / k;
  const gameHeight =
    (await u.canvas.evaluate((c: HTMLCanvasElement) => c.height)) / k;
  const unit = box.width / gameWidth;
  const toScreen = (x: number, y: number) => ({
    x: box.x + (x + (gameWidth - 960) / 2) * unit,
    y: box.y + (y + (gameHeight - 540) / 2) * unit,
  });
  // Hold the input until the round ends. Round time and movement both use game
  // time, so a slow runner (where Phaser clamps frame delta) cannot miss the
  // star the way a fixed real-time hold could.
  const roundEnds = () =>
    expect(u.mode).toHaveText('RESULT', {
      timeout: 20_000,
    });
  if (testInfo.project.name === 'mobile') {
    await holdTouchUntil(page, toScreen(650, 300), roundEnds);
  } else {
    await page.keyboard.down('ArrowRight');
    await roundEnds();
    await page.keyboard.up('ArrowRight');
  }
  await expect(u.best).not.toHaveText('0');
  await expect(u.rounds).toHaveText('1');
  await page.screenshot({
    path: testInfo.outputPath('result.png'),
    fullPage: true,
  });
  await u.play.click();
  await expect(u.mode).toHaveText('PLAYING');
  await u.home.click();
  await expect(u.mode).toHaveText('MENU');
  await page.reload();
  await expect(u.rounds).toHaveText('1');
  await u.settings.click();
  await expect(u.muted).toBeChecked();
  expect(errors).toEqual([]);
});

test('service gates and responsive layout', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const u = ui(page);
  const preview = process.env.E2E_PREVIEW === '1';
  await page.goto('/');
  await u.reward.click();
  await expect(u.notice).toContainText(
    preview ? 'unavailable' : 'consent-required',
  );
  await u.consent.check();
  await u.reward.click();
  await expect(u.notice).toContainText(preview ? 'unavailable' : 'completed');
  await u.outcome.selectOption('cancelled');
  await u.purchase.click();
  await expect(u.notice).toContainText(preview ? 'unavailable' : 'cancelled');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('menu.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test('Escape toggles the manual pause during play', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Escape needs a keyboard');
  const u = ui(page);
  await page.goto('/');
  await u.play.click();
  await expect(u.mode).toHaveText('PLAYING');
  await u.game.focus();
  await page.keyboard.press('Escape');
  await expect(u.pause).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(u.pauseOverlay).toBeHidden();
});

test('reduced motion immediately freezes the menu and resets with settings', async ({
  page,
}) => {
  const u = ui(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(u.play).toBeEnabled();
  await u.settings.click();
  await u.reducedMotion.check();
  await u.settingsDone.click();
  // Compare the same running canvas across time, without browser-specific golden images.
  const frozen = await u.canvas.screenshot();
  await page.waitForTimeout(400);
  expect((await u.canvas.screenshot()).equals(frozen)).toBe(true);
  expect(
    await u.play.evaluate(
      (button) => getComputedStyle(button).transitionDuration,
    ),
  ).toBe('0s');
  await u.settings.click();
  await u.reducedMotion.uncheck();
  await u.settingsDone.click();
  await expect
    .poll(async () => (await u.canvas.screenshot()).equals(frozen))
    .toBe(false);
  await u.settings.click();
  await u.reducedMotion.check();
  page.once('dialog', (dialog) => dialog.accept());
  await u.resetSettings.click();
  await expect(u.app).toHaveAttribute('data-reduced-motion', 'false');
  const resetFrame = await u.canvas.screenshot();
  await expect
    .poll(async () => (await u.canvas.screenshot()).equals(resetFrame))
    .toBe(false);
});

for (const [locale, lang, play] of [
  ['ko-KR', 'ko', '플레이 시작'],
  ['en-US', 'en', 'Play'],
] as const) {
  test(`uses the browser language: ${locale}`, async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'locale is set here');
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    await disableSdk(page);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(ui(page).play).toContainText(play);
    await context.close();
  });
}
