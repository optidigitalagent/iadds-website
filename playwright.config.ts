import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 45_000, expect: { timeout: 8_000 }, fullyParallel: false, workers: 1,
  reporter: [['list'], ['html', { open:'never' }]],
  use: { baseURL:'http://127.0.0.1:3100', trace:'retain-on-failure', screenshot:'only-on-failure' },
  projects: [{name:'chromium',use:{...devices['Desktop Chrome'],channel:'chromium'}}],
  webServer: [
    { command:'npm run start',url:'http://127.0.0.1:3100',reuseExistingServer:process.env.E2E_REUSE_PREVIEW==='1',timeout:120_000,env:{CONSULTATION_WEBHOOK_URL:'',SITE_URL:'http://127.0.0.1:3100',NEXT_TELEMETRY_DISABLED:'1'} },
    { command:'node --import tsx tests/support/local-submission-server.ts',url:'http://127.0.0.1:3101/uk',reuseExistingServer:false,timeout:120_000,env:{NODE_ENV:'test',CONSULTATION_WEBHOOK_URL:'',CONSULTATION_LOCAL_DIR:'e2e',SITE_URL:'http://127.0.0.1:3101',NEXT_TELEMETRY_DISABLED:'1'} },
  ],
});
