// A box to type Python into and run it: scaffolding that proves Python runs in
// the browser, until the level screen takes its place.

import { t } from '../i18n';
import type { LevelJson, RunResult } from '../runtime/protocol';
import type { Runtime, RuntimeStatus } from '../runtime/runtime';
import { element } from './dom';

/** The one level the playground runs code in. */
const CORRIDOR = '01-the-corridor';

export interface PlaygroundState {
  /** What the child typed; null while it is the starting code, in the page's language. */
  code: string | null;
  output: string;
  outputKind: 'none' | 'ok' | 'error';
  stoppedFor: number | null;
}

export function newPlaygroundState(): PlaygroundState {
  return { code: null, output: '', outputKind: 'none', stoppedFor: null };
}

function statusText(runtime: Runtime, status: RuntimeStatus, state: PlaygroundState): string {
  switch (status) {
    case 'loading':
      return t('playground.loading');
    case 'restarting':
      return t('playground.restarting');
    case 'running':
      return t('playground.running');
    case 'failed':
      return t('playground.failed');
    case 'ready':
      if (state.stoppedFor !== null) {
        return t('playground.stopped', { seconds: state.stoppedFor });
      }
      return t('playground.ready', { version: runtime.info?.pythonVersion ?? '' });
  }
}

function describe(result: RunResult): { text: string; kind: 'ok' | 'error' } {
  if (result.world) {
    return { text: JSON.stringify(result.world, null, 2), kind: 'ok' };
  }
  const printed = result.stdout + result.stderr;
  if (result.status === 'error' && result.error) {
    const where =
      result.error.line != null ? t('playground.error_line', { line: result.error.line }) : '';
    const error = `${result.error.type}: ${result.error.message}${where}`;
    return { text: printed ? `${printed}\n${error}` : error, kind: 'error' };
  }
  return { text: printed, kind: 'ok' };
}

/** Inserts four spaces for Tab, as Python's indentation wants. */
function tabInsertsSpaces(area: HTMLTextAreaElement): void {
  area.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || event.shiftKey || event.ctrlKey || event.altKey) return;
    event.preventDefault();
    const { selectionStart, selectionEnd, value } = area;
    area.value = `${value.slice(0, selectionStart)}    ${value.slice(selectionEnd)}`;
    area.selectionStart = area.selectionEnd = selectionStart + 4;
    area.dispatchEvent(new Event('input'));
  });
}

export interface Rendered {
  node: HTMLElement;
  dispose: () => void;
}

export function playground(runtime: Runtime, state: PlaygroundState): Rendered {
  const code = element('textarea', {
    id: 'code',
    rows: 12,
    spellcheck: false,
    value: state.code ?? `${t('playground.starting_code')}\n`,
  });
  code.setAttribute('aria-label', t('playground.code_label'));
  code.setAttribute('autocapitalize', 'off');
  tabInsertsSpaces(code);
  code.addEventListener('input', () => {
    state.code = code.value;
  });

  const status = element('p', { id: 'status', className: 'status' });
  const output = element('pre', { id: 'output', className: `output ${state.outputKind}` }, [
    state.output,
  ]);
  const run = element('button', { id: 'run', type: 'button' }, [t('playground.run')]);
  const runLevel = element('button', { id: 'run-level', type: 'button' }, [
    t('playground.run_level'),
  ]);
  const stop = element('button', { id: 'stop', type: 'button' }, [t('playground.stop')]);

  const show = (s: RuntimeStatus) => {
    status.textContent = statusText(runtime, s, state);
    run.disabled = s !== 'ready';
    runLevel.disabled = s !== 'ready';
    stop.disabled = s !== 'running';
  };
  const dispose = runtime.onStatus(show);

  const display = (result: RunResult) => {
    if (result.status === 'interrupted') {
      state.stoppedFor = Math.round(runtime.wallClockMs / 1000);
    }
    const { text, kind } = describe(result);
    state.output = text;
    state.outputKind = kind;
    output.textContent = text;
    output.className = `output ${kind}`;
    show(runtime.status);
  };
  const failed = (error: unknown) => {
    state.output = String(error);
    state.outputKind = 'error';
    output.textContent = state.output;
    output.className = 'output error';
  };
  const start = (level?: LevelJson) => {
    state.stoppedFor = null;
    runtime.run(code.value, level).then(display, failed);
  };

  run.addEventListener('click', () => start());
  runLevel.addEventListener('click', () => {
    fetch(`${import.meta.env.BASE_URL}content/levels/${CORRIDOR}/level.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`${CORRIDOR}: HTTP ${response.status}`);
        return response.json() as Promise<LevelJson>;
      })
      .then(start, failed);
  });
  stop.addEventListener('click', () => runtime.interrupt());

  const node = element('section', { className: 'playground' }, [
    element('h2', {}, [t('playground.title')]),
    code,
    element('div', { className: 'buttons' }, [run, runLevel, stop]),
    status,
    output,
  ]);
  return { node, dispose };
}
