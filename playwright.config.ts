import { defineConfig, devices } from '@playwright/test'

// Tests the production build (matches what ships). The webServer builds + previews.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  use: { baseURL: 'http://localhost:4173', headless: true },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
