import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/sdk',
  outputDir: 'test-results/sdk/artifacts',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/sdk/report.json' }],
  ],
  timeout: 90_000,
  workers: 1,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:4176', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      'npm run build:crazygames -- --outDir test-results/builds/sdk && npm run preview -- --host 127.0.0.1 --port 4176 --strictPort --outDir test-results/builds/sdk',
    url: 'http://127.0.0.1:4176',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
