/// <reference lib="webworker" />
// The worker that holds Python: it loads Pyodide and kydux_world, then runs
// code when the page asks, one run at a time, and answers with a result.

import type { PyodideAPI } from 'pyodide';
import type { FromWorker, RunResult, ToWorker } from './protocol';

declare const self: DedicatedWorkerGlobalScope;

const base = import.meta.env.BASE_URL;
let pyodide: PyodideAPI | null = null;
let interrupt: Int32Array | null = null;

function post(message: FromWorker): void {
  self.postMessage(message);
}

async function load(interruptBuffer?: SharedArrayBuffer): Promise<void> {
  const module = (await import(/* @vite-ignore */ `${base}pyodide/pyodide.mjs`)) as {
    loadPyodide: (options: { indexURL: string }) => Promise<PyodideAPI>;
  };
  const py = await module.loadPyodide({ indexURL: `${base}pyodide/` });
  const world = await fetch(`${base}world.zip`);
  if (!world.ok) throw new Error(`world.zip: HTTP ${world.status}`);
  py.unpackArchive(await world.arrayBuffer(), 'zip', { extractDir: '/home/pyodide' });
  py.runPython('import sys; sys.path.insert(0, "/home/pyodide")');
  if (interruptBuffer) {
    interrupt = new Int32Array(interruptBuffer);
    py.setInterruptBuffer(interrupt);
  }
  const versions = py.runPython(
    'import sys, kydux_world; f"{sys.version.split()[0]} {kydux_world.__version__}"',
  ) as string;
  const [pythonVersion = '', worldVersion = ''] = versions.split(' ');
  pyodide = py;
  post({ type: 'ready', pythonVersion, worldVersion });
}

function run(code: string): RunResult {
  if (!pyodide) throw new Error('Python is not loaded');
  if (interrupt) Atomics.store(interrupt, 0, 0);
  const globals = pyodide.toPy({ code });
  try {
    const json = pyodide.runPython(
      'from kydux_world.run import run_script_json; run_script_json(code)',
      { globals },
    ) as string;
    return JSON.parse(json) as RunResult;
  } finally {
    globals.destroy();
  }
}

self.addEventListener('message', (event: MessageEvent<ToWorker>) => {
  const message = event.data;
  if (message.type === 'load') {
    load(message.interruptBuffer).catch((error: unknown) =>
      post({ type: 'load-error', message: String(error) }),
    );
  } else if (message.type === 'run') {
    try {
      post({ type: 'result', id: message.id, result: run(message.code) });
    } catch (error) {
      post({ type: 'crashed', id: message.id, message: String(error) });
    }
  }
});
