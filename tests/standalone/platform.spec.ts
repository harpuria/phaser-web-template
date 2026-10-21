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
  await page.getByRole('button', { name: '플레이 시작' }).click();
  await expect(page.locator('#mode-label')).toHaveText('RESULT', {
    timeout: 15_000,
  });
  await expect(page.locator('#rounds')).toHaveText('1');
  await page.reload();
  await expect(page.locator('#rounds')).toHaveText('1');
  await page.getByRole('button', { name: '보상형 광고 테스트' }).click();
  await expect(page.getByRole('status')).toContainText('unavailable');
  expect(sdkRequests).toEqual([]);
  expect(await page.evaluate(() => window.CrazyGames)).toBeUndefined();
  expect(errors).toEqual([]);
});
