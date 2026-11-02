import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node', testTimeout: 30000, hookTimeout: 90000, fileParallelism: false, setupFiles: ['./test/setup.ts'],
    env: {
      NODE_ENV: 'test', DATABASE_URL: 'postgres://citas:citas@127.0.0.1:5432/citas_test', LOG_LEVEL: 'silent', JOBS_ENABLED: 'false',
      STRIPE_WEBHOOK_SECRET: 'whsec_test_secret_for_vitest', STRIPE_PRICE_PREMIUM_MXN: 'price_test_mxn', REVENUECAT_WEBHOOK_SECRET: 'rc_test_secret',
      STORAGE_LOCAL_DIR: './storage/test', COOKIE_SECRET: 'test-cookie-secret-0123456789', MEDIA_SIGNING_SECRET: 'test-media-secret-0123456789',
    },
  },
});
