// A box to type Python into and run it: scaffolding that proves Python runs in
// the browser, until the level screen takes its place.

import { t } from '../i18n';
import type { RunResult } from '../runtime/protocol';
import type { Runtime, RuntimeStatus } from '../runtime/runtime';
import { element } from './dom';

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
  const stop = element('button', { id: 'stop', type: 'button' }, [t('playground.stop')]);

  const show = (s: RuntimeStatus) => {
    status.textContent = statusText(runtime, s, state);
    run.disabled = s !== 'ready';
    stop.disabled = s !== 'running';
  };
  const dispose = runtime.onStatus(show);

  run.addEventListener('click', () => {
    state.stoppedFor = null;
    runtime.run(code.value).then(
      (result) => {
        if (result.status === 'interrupted') {
          state.stoppedFor = Math.round(runtime.wallClockMs / 1000);
        }
        const shown = describe(result);
        state.output = shown.text;
        state.outputKind = shown.kind;
        output.textContent = shown.text;
        output.className = `output ${shown.kind}`;
        show(runtime.status);
      },
      (error: unknown) => {
        state.output = String(error);
        state.outputKind = 'error';
        output.textContent = state.output;
        output.className = 'output error';
      },
    );
  });
  stop.addEventListener('click', () => runtime.interrupt());

  const node = element('section', { className: 'playground' }, [
    element('h2', {}, [t('playground.title')]),
    code,
    element('div', { className: 'buttons' }, [run, stop]),
    status,
    output,
  ]);
  return { node, dispose };
}
