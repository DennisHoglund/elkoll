// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const CI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: true,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  outputDir: 'test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'rapport/playwright', open: 'never' }],
    ['./tests/rapport-reporter.js', { outputDir: 'rapport' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    locale: 'sv-SE',
    timezoneId: 'Europe/Stockholm',
    geolocation: { latitude: 62.3925, longitude: 17.3060 },   // Sundsvall
    permissions: ['geolocation'],
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'iPhone (WebKit)', use: { ...devices['iPhone 14'] } },
    { name: 'Android (Chromium)', use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command: 'npx http-server . -p 4173 -a 127.0.0.1 -c-1 --silent',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !CI,
    timeout: 30000
  }
});
