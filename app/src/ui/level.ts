// The level screen: the scene with the goals over its corner, the editor
// beside it, Cast, Stop, Restart and the speed, and the card saying how a run
// went. It is where the child's code becomes the wizard walking.

import type { Editor, EditorOptions } from '../editor/editor';
import type { SceneHandle } from '../engine/scene';
import type { Speed } from '../engine/playback';
import { currentLanguage, t } from '../i18n';
import { type LoadedLevel, loadLevelText } from '../content/levels';
import type { RunResult } from '../runtime/protocol';
import type { Runtime, RuntimeStatus } from '../runtime/runtime';
import { element } from './dom';
import { type GoalsPanel, goalsPanel } from './goals';
import { type Outcome, type OutcomeCard, outcomeCard } from './outcome';

const SPEEDS: Speed[] = [1, 2, 4];
const SPEED_KEY = 'kydux.speed';
const DEFAULT_TICK_LIMIT = 1000;

interface WorldGoal {
  met: boolean;
  met_at_tick: number | null;
}

/** The world's result as the level screen reads it (kydux_world.run.RunResult). */
interface World {
  status: 'won' | 'incomplete' | 'error' | 'too_many_ticks' | 'interrupted';
  events: { line: number | null }[];
  goals: WorldGoal[];
  error: { type: string; message: string; line?: number | null } | null;
}

function storage(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
  } catch {
    return null;
  }
}

function savedSpeed(): Speed {
  const saved = Number(storage('local')?.getItem(SPEED_KEY));
  return (SPEEDS as number[]).includes(saved) ? (saved as Speed) : 1;
}

function codeKey(id: string): string {
  return `kydux.code.${id}`;
}

export interface LevelScreen {
  node: HTMLElement;
  /** Starts the scene; called once the node is in the page, which the scene measures. */
  mount(): void;
  /** Draws every word again in the language now set. */
  relabel(): Promise<void>;
  destroy(): void;
}

export interface LevelScreenParts {
  runtime: Runtime;
  loaded: LoadedLevel;
  /** Made by the caller, so that Phaser and CodeMirror load on their own. */
  createEditor: (parent: HTMLElement, options: EditorOptions) => Editor;
  startScene: (parent: HTMLElement, level: LoadedLevel['level']) => Promise<SceneHandle>;
}

export function levelScreen(parts: LevelScreenParts): LevelScreen {
  const { runtime, loaded } = parts;
  let text = loaded.text;
  const tickLimit = Number(loaded.level.tick_limit ?? DEFAULT_TICK_LIMIT);

  // The words that change with the language, each with how to say it.
  const labels: [HTMLElement, () => string][] = [];
  const labelled = <T extends HTMLElement>(node: T, say: () => string): T => {
    labels.push([node, say]);
    node.textContent = say();
    return node;
  };

  const title = labelled(element('h2', { className: 'level-title' }), () => text.title);
  const sceneParent = element('div', { id: 'scene', className: 'scene' });
  const goalsSlot = element('div', { className: 'goals-slot' });
  let goals: GoalsPanel = goalsPanel(text.goals.map((g) => ({ text: g })));
  goalsSlot.append(goals.node);
  const status = element('p', { id: 'status', className: 'status' });

  const editorParent = element('div', { className: 'editor' });
  const cast = labelled(element('button', { id: 'cast', type: 'button' }), () => t('level.cast'));
  const stop = labelled(element('button', { id: 'stop', type: 'button' }), () => t('level.stop'));
  const restart = labelled(element('button', { id: 'restart', type: 'button' }), () =>
    t('level.restart'),
  );
  const speed = element('select', { id: 'speed' });
  for (const value of SPEEDS) {
    speed.append(element('option', { value: String(value) }, [`${value}×`]));
  }
  speed.value = String(savedSpeed());
  const speedLabel = labelled(element('span', { className: 'speed-label' }), () =>
    t('level.speed'),
  );
  const card: OutcomeCard = outcomeCard();

  const node = element('div', { className: 'level-screen' }, [
    element('section', { className: 'stage' }, [
      title,
      element('div', { className: 'scene-frame' }, [sceneParent, goalsSlot]),
      status,
    ]),
    element('section', { className: 'workbench' }, [
      editorParent,
      element('div', { className: 'buttons' }, [
        cast,
        stop,
        restart,
        element('label', { className: 'speed' }, [speedLabel, ' ', speed]),
      ]),
      card.node,
    ]),
  ]);

  // The editor keeps what the child typed for this visit; the starting code,
  // while untouched, follows the language.
  const saved = storage('session')?.getItem(codeKey(loaded.id));
  let typed = saved !== null && saved !== undefined && saved !== text.starting_code;
  const editor = parts.createEditor(editorParent, {
    doc: typed && saved ? saved : text.starting_code,
    label: t('level.code_label'),
    onCast: () => castNow(),
    onChange: (doc) => {
      typed = doc !== text.starting_code;
      storage('session')?.setItem(codeKey(loaded.id), doc);
    },
  });

  let scene: SceneHandle | null = null;
  let world: World | null = null;
  let stopped: (() => void)[] = [];
  let destroyed = false;

  const statusLine = (s: RuntimeStatus): string => {
    switch (s) {
      case 'loading':
        return t('level.loading');
      case 'ready':
        return t('level.ready', { version: runtime.info?.pythonVersion ?? '' });
      case 'running':
        return t('level.running');
      case 'restarting':
        return t('level.restarting');
      case 'failed':
        return t('level.failed');
    }
  };
  const showStatus = (s: RuntimeStatus) => {
    status.textContent = statusLine(s);
    status.dataset.status = s;
    cast.disabled = s !== 'ready' || !scene;
    stop.disabled = s !== 'running' && scene?.playback.state !== 'playing';
  };
  stopped.push(runtime.onStatus(showStatus));

  const outcomeOf = (result: World): Outcome => {
    switch (result.status) {
      case 'won':
        return { kind: 'won' };
      case 'incomplete':
        return {
          kind: 'incomplete',
          met: result.goals.filter((g) => g.met).length,
          total: result.goals.length,
        };
      case 'too_many_ticks':
        return { kind: 'too_many_ticks', limit: tickLimit };
      case 'interrupted':
        return { kind: 'interrupted', seconds: Math.round(runtime.wallClockMs / 1000) };
      case 'error':
        return {
          kind: 'error',
          error: result.error ?? { type: 'Error', message: '' },
        };
    }
  };

  const markGoals = (tick: number) => {
    world?.goals.forEach((goal, index) => {
      goals.set(index, goal.met_at_tick !== null && tick >= goal.met_at_tick ? 'met' : 'open');
    });
    if (!world) goals.reset();
  };

  const finish = () => {
    editor.setRunningLine(null);
    if (!world) return;
    card.show(outcomeOf(world));
    if (world.status === 'error') editor.setErrorLine(world.error?.line ?? null);
    showStatus(runtime.status);
  };

  const clear = () => {
    world = null;
    card.hide();
    goals.reset();
    editor.setRunningLine(null);
    editor.setErrorLine(null);
  };

  const castNow = () => {
    if (cast.disabled || !scene) return;
    const handle = scene;
    if (handle.playback.state === 'playing') handle.playback.stop();
    clear();
    handle.reset();
    runtime.run(editor.getDoc(), loaded.level).then(
      (result: RunResult) => {
        if (destroyed) return;
        const ran = result.world as World | undefined;
        if (!ran) {
          // A run stopped by ending the worker comes back without a world.
          world = {
            status: result.status === 'interrupted' ? 'interrupted' : 'error',
            events: [],
            goals: [],
            error: result.error ?? null,
          };
          finish();
          return;
        }
        world = ran;
        handle.load(result.world ?? {});
        handle.playback.setSpeed(Number(speed.value) as Speed);
        if (ran.events.length === 0) {
          markGoals(0);
          finish();
          return;
        }
        handle.playback.play();
      },
      (error: unknown) => {
        if (destroyed) return;
        world = {
          status: 'error',
          events: [],
          goals: [],
          error: { type: 'Error', message: error instanceof Error ? error.message : String(error) },
        };
        finish();
      },
    );
  };

  cast.addEventListener('click', castNow);
  stop.addEventListener('click', () => {
    if (runtime.status === 'running') runtime.interrupt();
    else scene?.playback.stop();
  });
  restart.addEventListener('click', () => {
    scene?.playback.reset();
    clear();
    showStatus(runtime.status);
  });
  speed.addEventListener('change', () => {
    storage('local')?.setItem(SPEED_KEY, speed.value);
    scene?.playback.setSpeed(Number(speed.value) as Speed);
  });

  const setPageTitle = () => {
    document.title = t('level.page_title', { title: text.title });
  };
  setPageTitle();

  let mounted = false;

  return {
    node,
    mount() {
      if (mounted) return;
      mounted = true;
      void parts.startScene(sceneParent, loaded.level).then((handle) => {
        if (destroyed) {
          handle.destroy();
          return;
        }
        scene = handle;
        stopped.push(
          handle.playback.onTick((tick, event) => {
            markGoals(tick);
            editor.setRunningLine(event?.line ?? null);
          }),
          handle.playback.onState((state) => {
            if (state === 'done' && world) finish();
            showStatus(runtime.status);
          }),
        );
        showStatus(runtime.status);
      });
    },
    async relabel() {
      const before = text;
      text = await loadLevelText(loaded.id, currentLanguage());
      if (!typed && editor.getDoc() === before.starting_code) editor.setDoc(text.starting_code);
      for (const [labelNode, say] of labels) labelNode.textContent = say();
      const marks = text.goals.map((_, index) =>
        goals.node.querySelectorAll('.goal')[index]?.getAttribute('data-mark'),
      );
      goals = goalsPanel(text.goals.map((g) => ({ text: g })));
      marks.forEach((mark, index) => {
        if (mark === 'met' || mark === 'failed') goals.set(index, mark);
      });
      goalsSlot.replaceChildren(goals.node);
      editor.view.contentDOM.setAttribute('aria-label', t('level.code_label'));
      if (card.current) card.show(card.current);
      showStatus(runtime.status);
      setPageTitle();
    },
    destroy() {
      destroyed = true;
      for (const stop of stopped) stop();
      stopped = [];
      scene?.destroy();
      editor.destroy();
    },
  };
}
