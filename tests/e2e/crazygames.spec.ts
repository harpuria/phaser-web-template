import { expect, test, type Page } from '@playwright/test';
import type {
  AdCallbacks,
  CrazyGamesSdk,
  CrazyGamesSettings,
} from '../../src/services/crazygames-sdk';

interface SdkProbe {
  sdkEvents: string[];
  sdkAdCallbacks: AdCallbacks;
  sdkSettingsChanged?: (settings: CrazyGamesSettings) => void;
}

/** Served as JavaScript to exercise the real loader without external network access. */
function sdkDouble(options: {
  environment: 'crazygames' | 'local';
  corrupt: boolean;
}) {
  const probe = window as unknown as SdkProbe;
  const events: string[] = [];
  probe.sdkEvents = events;
  const sdk: CrazyGamesSdk = {
    environment: options.environment,
    init: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      events.push('init');
    },
    game: {
      settings: { muteAudio: true },
      loadingStart: () => {
        events.push('loadingStart');
      },
      loadingStop: () => {
        events.push('loadingStop');
      },
      gameplayStart: () => {
        events.push('gameplayStart');
      },
      gameplayStop: () => {
        events.push('gameplayStop');
      },
      addSettingsChangeListener: (listener) => {
        probe.sdkSettingsChanged = listener;
      },
      removeSettingsChangeListener: () => {
        probe.sdkSettingsChanged = undefined;
      },
    },
    ad: {
      requestAd: (type, callbacks) => {
        events.push(type);
        probe.sdkAdCallbacks = callbacks;
      },
    },
    data: {
      getItem: (key) => {
        events.push('get:' + key);
        const value = localStorage.getItem('sdk:' + key);
        return (
          value ??
          (key.endsWith(':save')
            ? options.corrupt
              ? 'broken'
              : JSON.stringify({ version: 1, data: { best: 12, rounds: 3 } })
            : null)
        );
      },
      setItem: (key, value) => {
        events.push('set:' + key);
        localStorage.setItem('sdk:' + key, value);
      },
      removeItem: (key) => localStorage.removeItem('sdk:' + key),
    },
  };
  window.CrazyGames = { SDK: sdk };
}

async function installSdk(
  page: Page,
  environment: 'crazygames' | 'local' = 'crazygames',
  corrupt = false,
) {
  await page.route('https://sdk.crazygames.com/crazygames-sdk-v3.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `(${sdkDouble.toString()})(${JSON.stringify({ environment, corrupt })});`,
    }),
  );
}
const events = (page: Page) =>
  page.evaluate(() => (window as unknown as SdkProbe).sdkEvents);

test('SDK initializes before Data, then reports loading, gameplay, pause, result and restart', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await installSdk(page);
  await page.goto('/?round=2');
  await expect(page.locator('#mode-label')).toHaveText('MENU');
  await expect(page.locator('#best')).toHaveText('12');
  await expect(page.locator('#rounds')).toHaveText('3');
  await expect(page.locator('#storage-kind')).toHaveText('CRAZYGAMES SAVE');
  expect(await events(page)).toEqual([
    'init',
    'get:phaser-web-template:save',
    'get:phaser-web-template:settings',
    'loadingStart',
    'loadingStop',
  ]);
  await expect(
    page.getByRole('button', { name: '보상형 광고 테스트' }),
  ).toBeHidden();
  await page.getByRole('button', { name: '플레이 시작' }).click();
  await expect(page.locator('#mode-label')).toHaveText('PLAYING');
  await page.getByRole('button', { name: '일시정지', exact: true }).click();
  await page.getByRole('button', { name: '설정 열기' }).click();
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.locator('#pause-overlay')).toBeVisible();
  await page.getByRole('button', { name: '계속하기' }).click();
  await expect(page.locator('#mode-label')).toHaveText('RESULT', {
    timeout: 15_000,
  });
  await expect(page.locator('#rounds')).toHaveText('4');
  const calls = await events(page);
  expect(calls.filter((event) => event.startsWith('gameplay'))).toEqual([
    'gameplayStart',
    'gameplayStop',
    'gameplayStart',
    'gameplayStop',
  ]);
  expect(calls).not.toContain('midgame');
  expect(
    await page.evaluate(() => localStorage.getItem('phaser-web-template:save')),
  ).toBeNull();
  await page.reload();
  await expect(page.locator('#rounds')).toHaveText('4');
  expect(errors).toEqual([]);
});

test('local demo ads block interaction, recover from failure, and keep demo completion marked mock', async ({
  page,
}) => {
  await installSdk(page, 'local');
  await page.goto('/');
  const request = page.getByRole('button', { name: '보상형 광고 테스트' });
  await request.click();
  await expect(
    page.getByRole('button', { name: '플레이 시작' }),
  ).toBeDisabled();
  await expect(page.getByRole('button', { name: '설정 열기' })).toBeDisabled();
  await page.evaluate(() =>
    (window as unknown as SdkProbe).sdkAdCallbacks.adError({
      code: 'unfilled',
      message: '',
    }),
  );
  await expect(page.getByRole('status')).toContainText('unavailable');
  await expect(request).toBeEnabled();
  await request.click();
  await page.evaluate(() => {
    const { sdkAdCallbacks } = window as unknown as SdkProbe;
    sdkAdCallbacks.adStarted();
    sdkAdCallbacks.adFinished();
    sdkAdCallbacks.adFinished();
  });
  await expect(page.getByRole('status')).toContainText('completed (Mock');
  await expect(page.getByRole('button', { name: '플레이 시작' })).toBeEnabled();
});

test('SDK cloud corruption remains protected through gameplay', async ({
  page,
}) => {
  await installSdk(page, 'crazygames', true);
  await page.goto('/?round=1');
  await expect(page.locator('#storage-status')).toContainText('corrupt');
  await page.getByRole('button', { name: '플레이 시작' }).click();
  await expect(page.locator('#mode-label')).toHaveText('RESULT', {
    timeout: 15_000,
  });
  expect(await events(page)).not.toContain('set:phaser-web-template:save');
});

test('failed SDK loading leaves a playable session without overwriting local progress', async ({
  page,
}) => {
  await page.route('https://sdk.crazygames.com/crazygames-sdk-v3.js', (route) =>
    route.abort(),
  );
  await page.addInitScript(() =>
    localStorage.setItem('phaser-web-template:save', 'original'),
  );
  await page.goto('/?round=1');
  await expect(page.locator('#storage-status')).toContainText(
    '플랫폼에 연결하지 못해',
  );
  await page.getByRole('button', { name: '플레이 시작' }).click();
  await expect(page.locator('#mode-label')).toHaveText('RESULT', {
    timeout: 15_000,
  });
  expect(
    await page.evaluate(() => localStorage.getItem('phaser-web-template:save')),
  ).toBe('original');
});
