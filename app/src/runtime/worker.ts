/// <reference lib="webworker" />
// The worker that holds Python: it loads Pyodide and kydux_world, then runs
// code when the page asks, one run at a time, and answers with a result.

import type { PyodideAPI } from 'pyodide';
import type { FromWorker, LevelJson, RunResult, ToWorker, WorldResult } from './protocol';

declare const self: DedicatedWorkerGlobalScope;

const base = import.meta.env.BASE_URL;
let pyodide: PyodideAPI | null = null;
let interrupt: Int32Array | null = null;

function post(message: FromWorker): void {
  self.postMessage(message);
}

async function load(interruptBuffer?: SharedArrayBuffer): Promise<void> {
  // The world the page was built with, by its stamp: the address changes with every
  // world, so that no copy of another world is used; the browser keeps this one and
  // asks the server again each time, which answers 304 while it has not changed. It
  // is fetched while Python loads, not after.
  const fetched = fetch(`${base}world.zip?v=${__WORLD_STAMP__}`, { cache: 'no-cache' });
  // Its failure is said where it is awaited, not as a promise no one waited for.
  fetched.catch(() => undefined);
  const module = (await import(/* @vite-ignore */ `${base}pyodide/pyodide.mjs`)) as {
    loadPyodide: (options: { indexURL: string }) => Promise<PyodideAPI>;
  };
  const py = await module.loadPyodide({ indexURL: `${base}pyodide/` });
  const world = await fetched;
  if (!world.ok) throw new Error(`world.zip: HTTP ${world.status}`);
  py.unpackArchive(await world.arrayBuffer(), 'zip', { extractDir: '/home/pyodide' });
  let worldStamp = '';
  try {
    worldStamp = (py.FS.readFile('/home/pyodide/stamp.txt', { encoding: 'utf8' }) as string).trim();
  } catch {
    // A world packed with no stamp: the page takes it for another than its own.
  }
  py.runPython('import sys; sys.path.insert(0, "/home/pyodide")');
  if (interruptBuffer) {
    interrupt = new Int32Array(interruptBuffer);
    py.setInterruptBuffer(interrupt);
  }
  const versions = py.runPython(
    'import sys, kydux_world; f"{sys.version.split()[0]} {kydux_world.__version__}"',
  ) as string;
  // From here on the child's code cannot reach Pyodide's bridge to JavaScript (D14).
  py.runPython('from kydux_world import sandbox; sandbox.install()');
  const [pythonVersion = '', worldVersion = ''] = versions.split(' ');
  pyodide = py;
  post({ type: 'ready', pythonVersion, worldVersion, worldStamp });
}

function python(source: string, values: Record<string, unknown>): string {
  if (!pyodide) throw new Error('Python is not loaded');
  if (interrupt) Atomics.store(interrupt, 0, 0);
  const globals = pyodide.toPy(values);
  try {
    return pyodide.runPython(source, { globals }) as string;
  } finally {
    globals.destroy();
  }
}

function run(code: string, level?: LevelJson): RunResult {
  if (!level) {
    const json = python('from kydux_world.run import run_script_json; run_script_json(code)', {
      code,
    });
    return JSON.parse(json) as RunResult;
  }
  const started = performance.now();
  const json = python(
    'from kydux_world.run import run_level_json; run_level_json(level, code)',
    { code, level: JSON.stringify(level) },
  );
  const world = JSON.parse(json) as WorldResult & {
    status: string;
    stdout: string;
    error: RunResult['error'];
  };
  return {
    status:
      world.status === 'interrupted' ? 'interrupted' : world.status === 'error' ? 'error' : 'ok',
    stdout: world.stdout,
    stderr: '',
    error: world.error,
    durationMs: Math.round(performance.now() - started),
    world,
  };
}

self.addEventListener('message', (event: MessageEvent<ToWorker>) => {
  const message = event.data;
  if (message.type === 'load') {
    load(message.interruptBuffer).catch((error: unknown) =>
      post({ type: 'load-error', message: String(error) }),
    );
  } else if (message.type === 'run') {
    try {
      post({ type: 'result', id: message.id, result: run(message.code, message.level) });
    } catch (error) {
      post({ type: 'crashed', id: message.id, message: String(error) });
    }
  }
});
