import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { TIPS_OFF } from './e2e/helpers';
import { CI_TIMES } from './e2e/support';

// The built game, served by `vite preview` the way a release runs: over HTTPS
// when this machine has the development certificate (ci/dev-cert.sh), over
// HTTP on localhost otherwise. Both are secure contexts.
const tlsDir = process.env.KYDUX_TLS_DIR ?? join(homedir(), '.config', 'kydux', 'tls');
const https = process.env.KYDUX_HTTP !== '1' && existsSync(join(tlsDir, 'server.crt'));
const baseURL = `${https ? 'https' : 'http'}://localhost:4173/`;

// Under `CI`, a slow runner's sign, a test, an expect and the specs' own waits get
// three times their time (D191).
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000 * CI_TIMES,
  expect: { timeout: 15_000 * CI_TIMES },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    // The tips while a screen loads are off in every page a spec opens (D214): a slow
    // load would hold a screen for a tip's ten seconds. The spec on waiting turns them on.
    storageState: {
      cookies: [],
      origins: [{ origin: baseURL.replace(/\/$/, ''), localStorage: [{ name: TIPS_OFF, value: '1' }] }],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview',
    url: baseURL,
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
