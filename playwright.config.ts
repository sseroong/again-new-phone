import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 2,
  workers: process.env.CI ? 1 : 3,
  reporter: 'html',
  timeout: 60000,
  use: {
    trace: 'on-first-retry',
    actionTimeout: 15000,
  },
  projects: [
    {
      name: 'web-chromium',
      testDir: './e2e/web',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'admin-chromium',
      testDir: './e2e/admin',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3002' },
    },
  ],
  webServer: [
    {
      command: 'pnpm dev:api',
      port: 3001,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'pnpm dev:web',
      port: 3000,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'pnpm dev:admin',
      port: 3002,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
