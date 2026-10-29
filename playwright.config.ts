import { defineConfig, devices } from '@playwright/test';

const preview = process.env.E2E_PREVIEW === '1';
const port = preview ? 4274 : 4273;
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: `test-results/e2e/${preview ? 'preview' : 'dev'}`,
  fullyParallel: true,
  workers: 1,
  timeout: 45_000,
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: '**/responsive.spec.ts',
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: '**/responsive.spec.ts',
    },
  ],
  webServer: {
    command: preview
      ? `npm run build:crazygames -- --outDir test-results/builds/e2e && npm run preview -- --host 127.0.0.1 --port ${port} --strictPort --outDir test-results/builds/e2e`
      : `npm run dev:crazygames -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
