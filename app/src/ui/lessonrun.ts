// A lesson's page runs its code (D142): a block of it is an editor with Run under it,
// which runs it in the world of the lesson's level, at that level's start, and writes
// under the editor what it printed, how far the wizard walked if it moved (D180), or
// what went wrong in the child's words; no scene is shown. The child changes it and
// runs it again, always from the start. A program that opens the map opens the plan's
// window (D134).

import { forWizard, t } from '../i18n';
import type { LevelJson, RunResult, WorldResult } from '../runtime/protocol';
import type { RuntimeLike } from './controller';
import { element } from './dom';
import { outcomeText } from './outcome';
import type { PlanWindow } from './plan';

/** How far the wizard walked, in cells: to the right and down, negative for left and up. */
export interface Moved {
  right: number;
  down: number;
}

/** What a run of a block says under it. */
export interface RunSaid {
  printed: string;
  /** From the wizard's cell at the start to its cell at the end, when it moved (D180). */
  moved: Moved | null;
  /** What stopped it or refused it, in the child's words; or that it said nothing. */
  note: string | null;
}

/** The world a block runs in shows its first way (D51): a lesson has no ways to choose. */
function firstWay(world: WorldResult): WorldResult {
  return world.ways?.[0] ?? world;
}

/** A cell of an event's data, or null. */
function cellOf(value: unknown): [number, number] | null {
  return Array.isArray(value) ? [Number(value[0]), Number(value[1])] : null;
}

/** How far the wizard walked: from the cell it was on before anything moved it, where
 * the world starts it, to the cell of the last thing that moved it, a step of its own or
 * a door that shoved it; null when nothing did. */
function movedOf(world: WorldResult): Moved | null {
  const moves = world.events.filter(
    (event) =>
      (event.actor === 'wizard' && event.kind === 'move') ||
      (event.kind === 'shoved' && event.data.id === 'wizard'),
  );
  const from = cellOf(moves[0]?.data.from);
  const to = cellOf(moves[moves.length - 1]?.data.to);
  return from && to ? { right: to[0] - from[0], down: to[1] - from[1] } : null;
}

/** The steps along one way: how many, and the one-step form for a single one. */
function stepsDown(down: number): string {
  if (down > 0) return down === 1 ? t('lesson.steps_down_one') : t('lesson.steps_down', { n: down });
  return down === -1 ? t('lesson.steps_up_one') : t('lesson.steps_up', { n: -down });
}

function stepsRight(right: number): string {
  if (right > 0) return right === 1 ? t('lesson.steps_right_one') : t('lesson.steps_right', { n: right });
  return right === -1 ? t('lesson.steps_left_one') : t('lesson.steps_left', { n: -right });
}

/** The sideways steps after the steps down or up, which have said the word for a step. */
function stepsRightAfter(right: number): string {
  return right > 0 ? t('lesson.steps_right_after', { n: right }) : t('lesson.steps_left_after', { n: -right });
}

/** The walk in words (D180): how far the wizard moved each way, down or up first, or
 * that it came back to where it began. Never the cell's numbers. */
export function walkText(moved: Moved): string {
  if (moved.right === 0 && moved.down === 0) return t('lesson.returned');
  let steps: string;
  if (moved.down === 0) steps = stepsRight(moved.right);
  else if (moved.right === 0) steps = stepsDown(moved.down);
  else steps = t('lesson.steps_and', { first: stepsDown(moved.down), second: stepsRightAfter(moved.right) });
  return t('lesson.moved', { steps });
}

/** The words for a run's result. */
export function runSaid(result: RunResult, level: LevelJson, kinds: (id: unknown) => string | null): RunSaid {
  if (!result.world) {
    const error = result.error ?? { type: 'Error', message: result.stderr };
    return { printed: result.stdout, moved: null, note: outcomeText({ kind: 'error', error }) };
  }
  const world = firstWay(result.world);
  const printed = world.stdout;
  const moved = movedOf(world);
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
  } else if (printed === '' && moved === null && !world.events.some((event) => event.kind === 'map')) {
    note = t('lesson.ended_quiet');
  }
  return { printed, moved, note };
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
      // How the block ended, for the tests: a lesson's block may end in the error it is
      // about, explained as its result (D272).
      node.dataset.ended = result.world ? firstWay(result.world).status : result.status;
      printed.textContent = answer.printed.replace(/\n$/, '');
      printed.hidden = answer.printed === '';
      const lines = [
        ...(answer.moved ? [walkText(answer.moved)] : []),
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
