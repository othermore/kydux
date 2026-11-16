import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { CI_TIMES } from './e2e/support';

// The built game, served by `vite preview` the way a release runs: over HTTPS
// when this machine has the development certificate (ci/dev-cert.sh), over
// HTTP on localhost otherwise, as on GitHub. Both are secure contexts.
const tlsDir = process.env.KYDUX_TLS_DIR ?? join(homedir(), '.config', 'kydux', 'tls');
const https = process.env.KYDUX_HTTP !== '1' && existsSync(join(tlsDir, 'server.crt'));
const baseURL = `${https ? 'https' : 'http'}://localhost:4173/`;

// On GitHub's runner a test, an expect and the specs' own waits get three times
// their time (D191).
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
