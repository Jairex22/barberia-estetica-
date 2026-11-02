import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', timeout: 60_000, retries: 0, workers: 1, reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    // En este entorno Chromium está preinstalado en /opt/pw-browsers; en tu PC ejecuta `pnpm exec playwright install chromium` y borra PW_EXECUTABLE.
    launchOptions: process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : {} },
  projects: [
    { name: 'movil-360', use: { ...devices['Pixel 5'], browserName: 'chromium', viewport: { width: 360, height: 740 } } },
    { name: 'movil-390', use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'escritorio-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
});
