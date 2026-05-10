
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,

  use: {
    baseURL: 'https://demo.spreecommerce.org/us/en/',
    trace: 'on-first-retry',
    headless: !!process.env.CI,
  },


  projects: [
    {
      name: 'chromium',
      use: {
        viewport: null,
        launchOptions: process.env.CI ? {} : { args: ['--start-maximized'] }
      },
    }
  ]
});
