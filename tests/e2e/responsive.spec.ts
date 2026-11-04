import { expect, test } from '@playwright/test';
import { disableSdk } from './platform-fixtures';

// [name, width, height, touch]. 화면 크기만 바꾸면 되므로 desktop 프로젝트에서만 실행한다.
const viewports = [
  ['desktop 1920x1080', 1920, 1080, false],
  ['desktop 1366x768', 1366, 768, false],
  ['tablet portrait 820x1180', 820, 1180, true],
  ['tablet landscape 1180x820', 1180, 820, true],
  ['phone portrait 390x844', 390, 844, true],
  ['phone landscape 844x390', 844, 390, true],
  ['phone landscape 640x360', 640, 360, true],
] as const;

for (const [name, width, height, touch] of viewports) {
  test(`game card fits the screen: ${name}`, async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'viewports are set here');
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: touch,
      // 휴대폰·태블릿은 고밀도 화면으로 렌더 배율(상한 1.5) 경로까지 검사한다.
      deviceScaleFactor: touch ? 3 : 1,
      hasTouch: touch,
    });
    const page = await context.newPage();
    await disableSdk(page);
    await page.goto('/');
    const play = page.locator('#play');
    await expect(play).toBeEnabled();
    await play.click();
    await expect(page.locator('#mode-label')).toHaveText('PLAYING');

    const layout = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('#game canvas')!;
      const box = canvas.getBoundingClientRect();
      const card = document
        .querySelector('.stage-card')!
        .getBoundingClientRect();
      const inView = (r: DOMRect) =>
        r.top >= -1 &&
        r.left >= -1 &&
        r.bottom <= innerHeight + 1 &&
        r.right <= innerWidth + 1;
      return {
        cardInView: inView(card),
        // CSS 픽셀 / 게임 단위. 안전 영역(960×540)이 실제로 그려지는 배율.
        scale:
          box.width /
          (canvas.width / Number(canvas.parentElement!.dataset.renderScale)),
        horizontalScroll: document.documentElement.scrollWidth > innerWidth,
        rotateTip: (() => {
          const tip = document.querySelector('.rotate-tip');
          return !!tip && getComputedStyle(tip).display !== 'none';
        })(),
      };
    });
    const renderScale = Number(
      await page.locator('#game').getAttribute('data-render-scale'),
    );
    expect(renderScale).toBeGreaterThanOrEqual(1);
    expect(renderScale).toBeLessThanOrEqual(touch ? 1.5 : 2);
    expect(layout.cardInView).toBe(true);
    expect(layout.horizontalScroll).toBe(false);
    const portraitPhone = touch && width < 600 && height > width;
    if (portraitPhone) expect(layout.rotateTip).toBe(true);
    else expect(layout.scale).toBeGreaterThanOrEqual(0.5);
    await page.screenshot({ path: testInfo.outputPath('playing.png') });
    await context.close();
  });
}
