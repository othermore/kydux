// A chapter's walkthrough for the owner: npm run walkthrough -- 03-passages plays it in
// the browser against the built game (e2e/walkthrough.spec.ts) and assembles its document
// (tools/walkthrough.py).

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const chapter = process.argv[2];
if (!chapter) {
  console.error('usage: npm run walkthrough -- <chapter>');
  process.exit(2);
}
const app = fileURLToPath(new URL('..', import.meta.url));
const repo = fileURLToPath(new URL('../..', import.meta.url));
const run = (command, args, env = {}) => {
  const done = spawnSync(command, args, { cwd: app, stdio: 'inherit', env: { ...process.env, ...env } });
  if (done.status !== 0) process.exit(done.status ?? 1);
};
run('npm', ['run', '--silent', 'build']);
run('npx', ['playwright', 'test', 'e2e/walkthrough.spec.ts', '--workers=1'], { KYDUX_WALKTHROUGH: chapter });
const python = existsSync(`${repo}.venv/bin/python`) ? `${repo}.venv/bin/python` : 'python3';
run(python, [`${repo}tools/walkthrough.py`, chapter]);
