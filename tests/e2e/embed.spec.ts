import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, test } from '@playwright/test';
import { disableSdk } from './platform-fixtures';
import { ui } from './ui';

// iframe 배포(CrazyGames, itch.io)에서는 게임 화면이 iframe 전체를 채우고 페이지 스크롤이 없어야 한다.
// [name, width, height, touch]. 화면 크기를 여기서 정하므로 desktop 프로젝트에서만 실행한다.
const frames = [
  ['CrazyGames desktop 1040x585', 1040, 585, false],
  ['desktop 1280x720', 1280, 720, false],
  ['phone landscape 844x390', 844, 390, true],
  ['phone portrait 390x844', 390, 844, true],
] as const;

// The platform page that embeds the game. It is served from a real loopback server on another
// origin (localhost vs 127.0.0.1): browsers deny iframe storage under about:blank, and block
// loopback iframes inside pages that do not come from the local network.
let host: Server;
let hostUrl = '';
test.beforeAll(async ({ baseURL }) => {
  host = createServer((_request, response) => {
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.end(`<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1">
      <style>html,body{margin:0;height:100%}iframe{display:block;border:0;width:100%;height:100%}</style>
      <iframe src="${baseURL}/?round=30" allow="fullscreen; autoplay"></iframe>`);
  });
  await new Promise<void>((resolve) => host.listen(0, 'localhost', resolve));
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
    await expect(u.storageStatus).toHaveAttribute('data-state', 'ready');
    await u.settingsDone.click();
    await expect(u.settingsDialog).toBeHidden();
    await page.screenshot({ path: testInfo.outputPath('embed.png') });
    expect(errors).toEqual([]);
    await context.close();
  });
}

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
