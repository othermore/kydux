// Copy the Pyodide files the runtime loads from node_modules into
// public/pyodide/<version>/, so that the game serves Python from its own origin:
// offline, and allowed under the isolation headers. The folder is named by Pyodide's
// version, so that the friends' server keeps its files for good (D230); any other
// folder or file of public/pyodide/ is removed. Nothing of Pyodide is committed; it
// comes from npm.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(app, 'node_modules', 'pyodide');
const version = JSON.parse(readFileSync(join(from, 'package.json'), 'utf8')).version;
const pyodide = join(app, 'public', 'pyodide');
const to = join(pyodide, version);
const files = [
  'pyodide.mjs',
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
];

mkdirSync(to, { recursive: true });
for (const name of readdirSync(pyodide)) {
  if (name !== version) rmSync(join(pyodide, name), { recursive: true, force: true });
}
let copied = 0;
for (const name of files) {
  const source = join(from, name);
  const target = join(to, name);
  if (!existsSync(source)) {
    console.error(`copy-pyodide: ${source} is missing; run npm ci`);
    process.exit(1);
  }
  if (existsSync(target) && statSync(target).size === statSync(source).size) continue;
  copyFileSync(source, target);
  copied += 1;
}
console.log(`copy-pyodide: ${copied} of ${files.length} files copied to public/pyodide/${version}/`);
