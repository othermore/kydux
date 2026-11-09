// A lesson's page runs its code (D142): a block of it is an editor with Run under it,
// which runs it in the world of the lesson's level, at that level's start, and writes
// under the editor what it printed, the cell the wizard ended on if it moved, or what
// went wrong in the child's words; no scene is shown. The child changes it and runs it
// again, always from the start. A program that opens the map opens the plan's window
// (D134).

import { forWizard, t } from '../i18n';
import type { LevelJson, RunResult, WorldResult } from '../runtime/protocol';
import type { RuntimeLike } from './controller';
import { element } from './dom';
import { outcomeText } from './outcome';
import type { PlanWindow } from './plan';

/** What a run of a block says under it. */
export interface RunSaid {
  printed: string;
  /** The cell the wizard ended on, when it moved. */
  ended: [number, number] | null;
  /** What stopped it or refused it, in the child's words; or that it said nothing. */
  note: string | null;
}

/** The world a block runs in shows its first way (D51): a lesson has no ways to choose. */
function firstWay(world: WorldResult): WorldResult {
  return world.ways?.[0] ?? world;
}

/** The last cell of the wizard's steps, or null when it took none. */
function endOf(world: WorldResult): [number, number] | null {
  const last = [...world.events].reverse().find((event) => event.actor === 'wizard' && event.kind === 'move');
  const to = last?.data.to;
  return Array.isArray(to) ? [Number(to[0]), Number(to[1])] : null;
}

/** The words for a run's result. */
export function runSaid(result: RunResult, level: LevelJson, kinds: (id: unknown) => string | null): RunSaid {
  if (!result.world) {
    const error = result.error ?? { type: 'Error', message: result.stderr };
    return { printed: result.stdout, ended: null, note: outcomeText({ kind: 'error', error }) };
  }
  const world = firstWay(result.world);
  const printed = world.stdout;
  const ended = endOf(world);
  const blocked = world.events.find((event) => event.actor === 'wizard' && event.kind === 'blocked');
  let note: string | null = null;
  if (world.status === 'error' && world.error) note = outcomeText({ kind: 'error', error: world.error });
  else if (world.status === 'caught') note = outcomeText({ kind: 'caught' });
  else if (world.status === 'too_many_ticks') {
    note = outcomeText({ kind: 'too_many_ticks', limit: Number(level.tick_limit ?? 100) });
  } else if (blocked && blocked.line !== null) {
    note = outcomeText({
      kind: 'incomplete',
      met: 0,
      total: 0,
      blocked: {
        line: blocked.line,
        reason: String(blocked.data.reason),
        thing: kinds(blocked.data.by),
        ...(typeof blocked.data.spell === 'string' ? { spell: blocked.data.spell } : {}),
      },
    })
      .split('\n')
      .slice(1)
      .join('\n');
  } else if (printed === '' && ended === null && !world.events.some((event) => event.kind === 'map')) {
    note = t('lesson.ended_quiet');
  }
  return { printed, ended, note };
}

/** How a lesson's page runs its code: in the level it is tried in, with what it needs. */
export interface LessonRunner {
  runtime: RuntimeLike;
  /** The level's world, loaded the first time it is asked for. */
  level: () => Promise<LevelJson>;
  createEditor: typeof import('../editor/editor').createEditor;
  /** Opens the plan of the level at its start, when a block casts the map's spell. */
  openPlan: (level: LevelJson, onClose: () => void) => Promise<PlanWindow>;
}

/** What is shown of a page's block. */
export interface RunBlock {
  node: HTMLElement;
  destroy(): void;
}

let blocks = 0;

/** A block of code on a page: its editor, its Run button and what it says. */
export function runBlock(code: string, runner: LessonRunner): RunBlock {
  blocks += 1;
  const editorParent = element('div', { className: 'lesson-editor' });
  const run = element('button', { type: 'button', className: 'lesson-run-button big-button' }, [t('level.run')]);
  run.id = `lesson-run-${blocks}`;
  const printed = element('pre', { className: 'printed lesson-printed', hidden: true });
  const said = element('p', { className: 'lesson-said', hidden: true });
  const node = element('div', { className: 'lesson-run' }, [
    editorParent,
    element('div', { className: 'lesson-run-bar' }, [run]),
    printed,
    said,
  ]);
  node.setAttribute('aria-live', 'polite');
  let plan: PlanWindow | null = null;
  let running = false;
  const go = async (): Promise<void> => {
    if (running) return;
    running = true;
    run.disabled = true;
    node.dataset.state = 'running';
    printed.hidden = true;
    said.hidden = true;
    try {
      const level = await runner.level();
      const result = await runner.runtime.run(editor.getDoc(), level);
      const kinds = (id: unknown): string | null => {
        const things = (level.things as { id: string; kind: string }[] | undefined) ?? [];
        return things.find((thing) => thing.id === id)?.kind ?? null;
      };
      const answer = runSaid(result, level, kinds);
      printed.textContent = answer.printed.replace(/\n$/, '');
      printed.hidden = answer.printed === '';
      const lines = [
        ...(answer.ended ? [t('lesson.ended_at', { x: answer.ended[0], y: answer.ended[1] })] : []),
        ...(answer.note ? [answer.note] : []),
      ];
      said.textContent = forWizard(lines.join(' '));
      said.hidden = lines.length === 0;
      if (result.world && firstWay(result.world).events.some((event) => event.kind === 'map')) {
        plan = await runner.openPlan(level, () => {
          plan = null;
          run.focus();
        });
      }
    } catch {
      said.textContent = t('level.failed');
      said.hidden = false;
    } finally {
      running = false;
      run.disabled = false;
      node.dataset.state = 'done';
    }
  };
  const editor = runner.createEditor(editorParent, {
    doc: code.replace(/\n$/, ''),
    onRun: () => void go(),
    label: t('level.code_label'),
  });
  run.addEventListener('click', () => void go());
  return {
    node,
    destroy() {
      plan?.dismiss();
      editor.destroy();
    },
  };
}
