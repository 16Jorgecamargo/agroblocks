import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/howto',
  testMatch: '*.howto.ts',
  timeout: 300_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4180',
  },
  webServer: {
    command: 'npx vite --mode howto --port 4180 --strictPort',
    url: 'http://localhost:4180',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, headless: false, launchOptions: { args: ['--window-position=-2400,0'] } },
    },
  ],
})
