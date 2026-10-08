import type { Page } from '@playwright/test';

/** Keep standalone/layout checks independent of external SDK availability. */
export async function disableSdk(page: Page) {
  await page.route('https://sdk.crazygames.com/crazygames-sdk-v3.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: "window.CrazyGames = { SDK: { init: async () => {}, environment: 'disabled' } };",
    }),
  );
}
