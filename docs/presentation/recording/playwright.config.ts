import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: '*.recording.ts',
  outputDir: process.env.RECORDING_OUTPUT ?? '/tmp/agroblocks-recording-output',
  timeout: 300_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4181',
  },
  webServer: {
    command: 'npx vite --port 4181 --strictPort',
    cwd: '../../..',
    url: 'http://localhost:4181',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: null,
        headless: false,
        launchOptions: { args: ['--window-position=-2400,0', '--window-size=1280,860', '--force-device-scale-factor=2'] },
      },
    },
  ],
})
