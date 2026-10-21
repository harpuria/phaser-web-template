import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { crazyGamesSdkUrl } from '../../src/services/crazygames-sdk';

interface SmokeProbe {
  gains: GainNode[];
  ads: string[];
}

declare global {
  interface Window {
    sdkSmoke?: SmokeProbe;
  }
}

test('official SDK initializes, preserves mute, completes local ads, and restores Data', async ({
  page,
  browser,
}, testInfo) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const gameplay: string[] = [];
  const runtime: { version: string; environment: string }[] = [];
  const consoleTasks: Promise<void>[] = [];
  const observation: Record<string, unknown> = {
    testedAt: new Date().toISOString(),
    browser: browser.version(),
    sdkUrl: crazyGamesSdkUrl,
    runtime,
    pageErrors,
    consoleErrors,
    checks: [],
  };
  const checked = (name: string) => (observation.checks as string[]).push(name);
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
    const gameplayEvent = message
      .text()
      .match(/Requesting gameplay (start|stop) \(local\)/);
    if (gameplayEvent) gameplay.push(gameplayEvent[1]!);
    if (!message.text().includes('CrazyGames HTML SDK initialized')) return;
    consoleTasks.push(
      (async () => {
        for (const argument of message.args()) {
          const value: unknown = await argument.jsonValue().catch(() => null);
          if (
            value &&
            typeof value === 'object' &&
            'version' in value &&
            'environment' in value
          ) {
            runtime.push({
              version: String(value.version),
              environment: String(value.environment),
            });
          }
        }
      })(),
    );
  });

  try {
    // Observe Web Audio in the test page; no production debug hooks or SDK doubles.
    await page.addInitScript(() => {
      const probe: SmokeProbe = { gains: [], ads: [] };
      window.sdkSmoke = probe;
      const createGain = AudioContext.prototype.createGain;
      AudioContext.prototype.createGain = function () {
        const gain = createGain.call(this);
        probe.gains.push(gain);
        return gain;
      };
    });
    const [response] = await Promise.all([
      page.waitForResponse((response) => response.url() === crazyGamesSdkUrl),
      page.goto('/?round=2&muteAudio=true'),
    ]);
    const body = await response.body();
    const headers = await response.allHeaders();
    observation.download = {
      status: response.status(),
      bytes: body.length,
      sha256: createHash('sha256').update(body).digest('hex'),
      lastModified: headers['last-modified'],
      etag: headers.etag,
    };
    expect(response.ok()).toBe(true);
    await expect(page.locator('#storage-kind')).toHaveText('SDK LOCAL SAVE', {
      timeout: 20_000,
    });
    expect(await page.evaluate(() => window.CrazyGames?.SDK.environment)).toBe(
      'local',
    );
    await Promise.all(consoleTasks);
    expect(runtime[0]?.version).toMatch(/^3\.\d+\.\d+/);
    checked('official CDN download and local initialization');

    // Phaser 4.2.1 creates its master mute gain before its master volume gain.
    const muteGain = () =>
      page.evaluate(() => window.sdkSmoke!.gains[0]?.gain.value);
    expect(await muteGain()).toBe(0);
    await page.getByRole('button', { name: '설정 열기' }).click();
    await page.getByLabel('전체 음소거', { exact: true }).check();
    await page.getByLabel('전체 음소거', { exact: true }).uncheck();
    expect(
      await page.evaluate(() => window.CrazyGames!.SDK.game.settings.muteAudio),
    ).toBe(true);
    expect(await muteGain()).toBe(0);
    await page.getByRole('button', { name: '완료', exact: true }).click();
    expect(await muteGain()).toBe(0);
    checked('SDK mute retains priority after user settings and dialog close');

    await page.evaluate(() => {
      const sdk = window.CrazyGames!.SDK;
      const probe = window.sdkSmoke!;
      const requestAd = sdk.ad.requestAd.bind(sdk.ad);
      sdk.ad.requestAd = (type, callbacks) =>
        requestAd(type, {
          adStarted: () => {
            probe.ads.push(type + ':adStarted');
            callbacks.adStarted();
          },
          adFinished: () => {
            probe.ads.push(type + ':adFinished');
            callbacks.adFinished();
          },
          adError: (error) => {
            probe.ads.push(type + ':adError:' + error.code);
            callbacks.adError(error);
          },
        });
    });
    await page.getByRole('button', { name: '보상형 광고 테스트' }).click();
    await expect(
      page.getByRole('button', { name: '플레이 시작' }),
    ).toBeDisabled();
    await expect(page.getByRole('status')).toContainText('completed (Mock', {
      timeout: 30_000,
    });
    await expect(
      page.getByRole('button', { name: '플레이 시작' }),
    ).toBeEnabled();
    checked('rewarded local ad completes as mock and releases controls');

    await page.getByRole('button', { name: '플레이 시작' }).click();
    await expect(page.locator('#mode-label')).toHaveText('RESULT', {
      timeout: 30_000,
    });
    await expect(
      page.getByRole('button', { name: '다시 플레이' }),
    ).toBeEnabled();
    const probe = await page.evaluate(() => ({
      ads: window.sdkSmoke!.ads,
    }));
    observation.events = { ...probe, gameplay };
    expect(probe.ads).toEqual([
      'rewarded:adStarted',
      'rewarded:adFinished',
      'midgame:adStarted',
      'midgame:adFinished',
    ]);
    // The local SDK returns a new game facade on each access; observe its real logs.
    expect(gameplay).toEqual(['start', 'stop']);
    checked('midgame local ad completes and gameplay events remain paired');

    const progress = await page.evaluate(() =>
      window.CrazyGames!.SDK.data.getItem('phaser-web-template:save'),
    );
    expect(JSON.parse(progress!)).toEqual({
      version: 1,
      data: { best: 0, rounds: 1 },
    });
    await page.reload();
    await expect(page.locator('#rounds')).toHaveText('1', { timeout: 20_000 });
    await expect(page.locator('#storage-kind')).toHaveText('SDK LOCAL SAVE');
    checked('SDK Data progress survives reload');
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    observation.failure = String(error);
    throw error;
  } finally {
    await Promise.all(consoleTasks);
    const json = JSON.stringify(observation, null, 2);
    await writeFile(testInfo.outputPath('sdk-observation.json'), json);
    await testInfo.attach('sdk-observation', {
      body: json,
      contentType: 'application/json',
    });
    await page
      .screenshot({ path: testInfo.outputPath('sdk.png'), fullPage: true })
      .catch(() => {});
    console.info('[SDK observation]', json);
  }
});
