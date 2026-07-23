import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './scripts/visual-regression/components',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/visual-regression-results.xml' }],
    ['html', { open: 'never' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chrome-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'chrome-tablet',
      use: {
        ...devices['Tablet Chrome'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'chrome-mobile',
      use: {
        ...devices['Mobile Chrome'],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox-tablet',
      use: {
        ...devices['Tablet Firefox'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'firefox-mobile',
      use: {
        ...devices['Mobile Firefox'],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit-tablet',
      use: {
        ...devices['Tablet Safari'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'webkit-mobile',
      use: {
        ...devices['Mobile Safari'],
        viewport: { width: 375, height: 667 },
      },
    },
  ],
  snapshotOptions: {
    threshold: 0.2,
    maxDiffPixels: 1000,
  },
  expect: {
    toHaveScreenshot: {
      threshold: 0.3,
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      mask: [],
      style: [],
    },
  },
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
});