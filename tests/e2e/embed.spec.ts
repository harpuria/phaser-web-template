import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, test } from '@playwright/test';
import { disableSdk } from './platform-fixtures';
import { gameAssetPattern, ui } from './ui';

// iframe 배포(CrazyGames, itch.io)에서는 게임 화면이 iframe 전체를 채우고 페이지 스크롤이 없어야 한다.
// [name, width, height, touch]. 화면 크기를 여기서 정하므로 desktop 프로젝트에서만 실행한다.
const frames = [
  ['CrazyGames desktop 1040x585', 1040, 585, false],
  ['desktop 1280x720', 1280, 720, false],
  ['phone landscape 844x390', 844, 390, true],
  ['phone portrait 390x844', 390, 844, true],
] as const;

// Use localhost for cross-site embedding and 127.0.0.1 for same-site embedding.
// The parent page and game use different ports in both cases.
let host: Server;
let hostUrl = '';
test.beforeAll(async ({ baseURL }) => {
  host = createServer((request, response) => {
    const round = request.url === '/short-round' ? 1 : 30;
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.end(`<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1">
      <style>html,body{margin:0;height:100%}iframe{display:block;border:0;width:100%;height:100%}</style>
      <iframe src="${baseURL}/?round=${round}" allow="fullscreen; autoplay"></iframe>`);
  });
  await new Promise<void>((resolve) => host.listen(0, '127.0.0.1', resolve));
  hostUrl = `http://localhost:${(host.address() as AddressInfo).port}/`;
});
test.afterAll(() => {
  host?.close();
});

for (const [name, width, height, touch] of frames) {
  test(`embedded iframe fills the frame without scrolling: ${name}`, async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'viewports are set here');
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: touch,
      hasTouch: touch,
      deviceScaleFactor: touch ? 3 : 1,
    });
    const page = await context.newPage();
    await disableSdk(page);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(hostUrl);
    const frame = page.frameLocator('iframe');
    const u = ui(frame);
    await expect(u.app).toHaveAttribute('data-layout', 'embed');
    await expect(u.play).toBeEnabled();
    await u.play.click();
    await expect(u.mode).toHaveText('PLAYING');

    const layout = await page.frames()[1]!.evaluate(() => {
      const box = (selector: string) =>
        document.querySelector(selector)?.getBoundingClientRect();
      const inView = (r?: DOMRect) =>
        !!r &&
        r.width > 0 &&
        r.top >= -1 &&
        r.left >= -1 &&
        r.bottom <= innerHeight + 1 &&
        r.right <= innerWidth + 1;
      const canvas = box('#game canvas')!;
      return {
        scroll:
          document.documentElement.scrollHeight > innerHeight + 1 ||
          document.documentElement.scrollWidth > innerWidth + 1,
        canvasArea: (canvas.width * canvas.height) / (innerWidth * innerHeight),
        controls: ['#pause', '#home', '#settings'].every((selector) =>
          inView(box(selector)),
        ),
        pageChrome: ['.header', '.intro', '.sidebar', '.toolbox', 'footer']
          .map((selector) => document.querySelector(selector))
          .filter(Boolean).length,
      };
    });
    expect(layout.scroll).toBe(false);
    expect(layout.pageChrome).toBe(0);
    expect(layout.controls).toBe(true);
    // Toolbar and heading take the rest; the game uses most of the frame.
    expect(layout.canvasArea).toBeGreaterThan(0.6);

    await u.settings.click();
    await expect(u.settingsDialog).toBeVisible();
    await expect(u.storageStatus).toBeVisible();
    await u.settingsDone.click();
    await expect(u.settingsDialog).toBeHidden();
    await page.screenshot({ path: testInfo.outputPath('embed.png') });
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('a failed asset can be reloaded inside the iframe and play can resume', async ({
  page,
}) => {
  await disableSdk(page);
  await page.route(gameAssetPattern, (route) => route.abort());
  await page.goto(hostUrl);
  const u = ui(page.frameLocator('iframe'));
  await expect(u.errorOverlay).toBeVisible();
  await expect(u.play).toBeDisabled();
  await expect(u.reload).toBeEnabled();
  await page.unroute(gameAssetPattern);

  let parentNavigations = 0;
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) parentNavigations++;
  });
  await u.reload.click();
  await expect(u.play).toBeEnabled();
  await expect(u.errorOverlay).toBeHidden();
  await u.play.click();
  await expect(u.mode).toHaveText('PLAYING');
  expect(parentNavigations).toBe(0);
});

test('an iframe with blocked browser storage can finish a round and change settings for the session', async ({
  page,
}) => {
  await disableSdk(page);
  await page.addInitScript(() => {
    if (window === window.top) return;
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage access denied', 'SecurityError');
      },
    });
  });
  await page.goto(new URL('short-round', hostUrl).href);
  const frame = page.frameLocator('iframe');
  const u = ui(frame);
  const summary = frame.locator('#compact-stats');
  await expect(summary).toBeVisible();
  await expect(summary).toHaveText('Saving unavailable');
  await u.settings.click();
  await expect(u.storageStatus).toHaveAttribute('data-state', 'session-only');
  await expect(u.storageKind).toHaveText('SAVE UNAVAILABLE');
  await expect(u.resetSave).toBeDisabled();
  await expect(u.resetSettings).toBeDisabled();
  await u.muted.check();
  await u.settingsDone.click();
  await u.play.click();
  await expect(u.mode).toHaveText('RESULT', { timeout: 20_000 });
  await u.settings.click();
  await expect(u.muted).toBeChecked();
  await expect(frame.locator('#compact-stats-detail')).toContainText(/\b1\b/);
  await page.reload();
  await u.settings.click();
  await expect(u.muted).not.toBeChecked();
  await expect(frame.locator('#compact-stats-detail')).not.toContainText(
    /\b1\b/,
  );
});

test('?layout=embed previews the iframe layout in a normal tab', async ({
  page,
}) => {
  await disableSdk(page);
  const u = ui(page);
  await page.goto('/?layout=embed&round=1');
  await expect(u.app).toHaveAttribute('data-layout', 'embed');
  await u.play.click();
  await expect(u.mode).toHaveText('RESULT', { timeout: 20_000 });
  // Records live in the compact heading; the notice is a short toast.
  await expect(page.locator('#compact-stats')).toContainText(/· 1\b/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBe(true);
});

test('a same-site iframe restores saved rounds and settings after reload', async ({
  page,
}) => {
  await disableSdk(page);
  const url = new URL('short-round', hostUrl);
  url.hostname = '127.0.0.1';
  await page.goto(url.href);
  const frame = page.frameLocator('iframe');
  const u = ui(frame);
  await u.settings.click();
  await expect(u.storageStatus).toHaveAttribute('data-state', 'ready');
  await u.muted.check();
  await u.settingsDone.click();
  await u.play.click();
  await expect(u.mode).toHaveText('RESULT', { timeout: 20_000 });
  await page.reload();
  await expect(frame.locator('#compact-stats')).toContainText(/· 1\b/);
  await u.settings.click();
  await expect(u.muted).toBeChecked();
});
