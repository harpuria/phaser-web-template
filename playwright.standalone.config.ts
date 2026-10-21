import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/standalone',
  outputDir: 'test-results/standalone',
  timeout: 45_000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4175', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command:
      'npm run build:standalone -- --outDir test-results/builds/standalone && npm run preview -- --host 127.0.0.1 --port 4175 --strictPort --outDir test-results/builds/standalone',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
