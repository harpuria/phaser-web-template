import { expect, test } from '@playwright/test';

test('standalone saves and restores progress without requesting the SDK', async ({
  page,
}) => {
  const sdkRequests: string[] = [];
  const errors: string[] = [];
  await page.route('https://sdk.crazygames.com/**', (route) => {
    sdkRequests.push(route.request().url());
    return route.abort();
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?round=1');
  await expect(page.locator('#storage-kind')).toHaveText('LOCAL SAVE');
  await page.locator('#play').click();
  await expect(page.locator('#mode-label')).toHaveText('RESULT', {
    timeout: 15_000,
  });
  await expect(page.locator('#rounds')).toHaveText('1');
  await page.reload();
  await expect(page.locator('#rounds')).toHaveText('1');
  await page.locator('#reward').click();
  await expect(page.locator('#notice')).toContainText('unavailable');
  expect(sdkRequests).toEqual([]);
  expect(await page.evaluate(() => window.CrazyGames)).toBeUndefined();
  expect(errors).toEqual([]);
});
