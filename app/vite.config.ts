import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

// HTTPS with the certificate ci/dev-cert.sh makes, when it exists: from another
// computer only HTTPS is a secure context, and only a secure context gets the
// isolation the interrupt needs. KYDUX_HTTP=1 serves plain HTTP regardless.
const tlsDir = process.env.KYDUX_TLS_DIR ?? join(homedir(), '.config', 'kydux', 'tls');
const https =
  process.env.KYDUX_HTTP !== '1' && existsSync(join(tlsDir, 'server.crt'))
    ? {
        cert: readFileSync(join(tlsDir, 'server.crt')),
        key: readFileSync(join(tlsDir, 'server.key')),
      }
    : undefined;

// The game is served cross-origin isolated wherever it runs, so that
// SharedArrayBuffer exists and a runaway program can be interrupted (D11).
const isolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    https,
    headers: isolation,
    fs: { allow: [repoRoot] },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    https,
    headers: isolation,
  },
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    sourcemap: true,
    // Phaser is one library of about 1.4 MB that cannot be split; it is loaded
    // on its own, after the page, so the warning would only ever be about it.
    chunkSizeWarningLimit: 1600,
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
