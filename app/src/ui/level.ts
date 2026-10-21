// The level screen: the scene with the goals over its corner, the editor
// beside it, Run, Stop, Restart and the speed, and the card saying how a run
// went. It is a view of a RunController (D29): it makes the DOM once, renders
// every snapshot the controller gives, and each button calls the controller.

import { type LoadedLevel, loadLevelText } from '../content/levels';
import type { Editor, EditorOptions } from '../editor/editor';
import type { Speed } from '../engine/playback';
import type { SceneHandle } from '../engine/scene';
import { currentLanguage, t } from '../i18n';
import type { Runtime, RuntimeStatus } from '../runtime/runtime';
import { type Card, startCard, stars, winCard } from './cards';
import { RunController, type RunSnapshot } from './controller';
import { element } from './dom';
import { type GoalsPanel, goalsPanel } from './goals';
import { type Outcome, type OutcomeCard, outcomeCard } from './outcome';

const SPEEDS: Speed[] = [1, 2, 4];
const SPEED_KEY = 'kydux.speed';

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
  /** The level after this one, or null when it is the last. */
  next: string | null;
  /** Made by the caller, so that Phaser and CodeMirror load on their own. */
  createEditor: (parent: HTMLElement, options: EditorOptions) => Editor;
  startScene: (parent: HTMLElement, level: LoadedLevel['level']) => Promise<SceneHandle>;
}

export function levelScreen(parts: LevelScreenParts): LevelScreen {
  const { runtime, loaded } = parts;
  let text = loaded.text;
  const controller = new RunController({ runtime, level: loaded, speed: savedSpeed() });

  // The words that change with the language, each with how to say it.
  const labels: [HTMLElement, () => string][] = [];
  const labelled = <T extends HTMLElement>(node: T, say: () => string): T => {
    labels.push([node, say]);
    node.textContent = say();
    return node;
  };

  const title = labelled(element('h2', { className: 'level-title' }), () => text.title);
  const about = element('button', { id: 'about', type: 'button', className: 'about' }, ['?']);
  const heading = element('div', { className: 'level-heading' }, [title, about]);
  const sceneParent = element('div', { id: 'scene', className: 'scene' });
  const goalsSlot = element('div', { className: 'goals-slot' });
  const bonus = ((loaded.level.goals as { bonus?: boolean }[] | undefined) ?? []).map(
    (goal) => goal.bonus === true,
  );
  const goalTexts = () => text.goals.map((g, index) => ({ text: g, bonus: bonus[index] }));
  let goals: GoalsPanel = goalsPanel(goalTexts());
  goalsSlot.append(goals.node);
  const status = element('p', { id: 'status', className: 'status' });

  const editorParent = element('div', { className: 'editor' });
  const run = labelled(element('button', { id: 'run', type: 'button' }), () => t('level.run'));
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

  const sceneFrame = element('div', { className: 'scene-frame' }, [sceneParent, goalsSlot]);
  const node = element('div', { className: 'level-screen' }, [
    element('section', { className: 'stage' }, [
      heading,
      sceneFrame,
      status,
    ]),
    element('section', { className: 'workbench' }, [
      editorParent,
      element('div', { className: 'buttons' }, [
        run,
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
    onRun: () => controller.run(editor.getDoc()),
    onChange: (doc) => {
      typed = doc !== text.starting_code;
      storage('session')?.setItem(codeKey(loaded.id), doc);
    },
  });

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

  // The cards over the scene: the start card, and the win card after a won run.
  let shownCard: Card | null = null;
  const showCard = (card: Card) => {
    shownCard?.close();
    shownCard = card;
    sceneFrame.append(card.node);
  };
  const showStart = () =>
    showCard(startCard({ title: text.title, goals: goalTexts() }, () => editor.focus()));
  const showWin = (earned: number) =>
    showCard(
      winCard(
        earned,
        parts.next,
        () => editor.focus(),
        (id) => {
          location.hash = `#level/${id}`;
        },
      ),
    );

  // What was last drawn, so that the card and the editor's marks change only
  // when the controller's do.
  let shownOutcome: Outcome | null = null;
  let shownLines: [number | null, number | null] = [null, null];

  const render = (snapshot: RunSnapshot, force = false) => {
    status.textContent = statusLine(snapshot.runtime);
    status.dataset.status = snapshot.runtime;
    run.disabled = !snapshot.canRun;
    stop.disabled = !snapshot.canStop;
    snapshot.goals.forEach((mark, index) => goals.set(index, mark));
    if (force || snapshot.outcome !== shownOutcome) {
      if (snapshot.outcome) card.show(snapshot.outcome, snapshot.printed);
      else card.hide();
      if (!force && snapshot.outcome?.kind === 'won' && snapshot.world) {
        showWin(stars(snapshot.world));
      } else if (!force && shownCard?.node.querySelector('.win-card')) {
        shownCard.close();
      }
      shownOutcome = snapshot.outcome;
    }
    if (snapshot.runningLine !== shownLines[0] || snapshot.errorLine !== shownLines[1]) {
      editor.setRunningLine(snapshot.runningLine);
      editor.setErrorLine(snapshot.errorLine);
      shownLines = [snapshot.runningLine, snapshot.errorLine];
    }
  };
  let stopped: (() => void)[] = [controller.onChange((snapshot) => render(snapshot))];

  about.setAttribute('aria-label', t('level.about'));
  about.title = t('level.about');
  about.addEventListener('click', showStart);
  run.addEventListener('click', () => controller.run(editor.getDoc()));
  stop.addEventListener('click', () => controller.stop());
  restart.addEventListener('click', () => controller.restart());
  speed.addEventListener('change', () => {
    storage('local')?.setItem(SPEED_KEY, speed.value);
    controller.setSpeed(Number(speed.value) as Speed);
  });

  const setPageTitle = () => {
    document.title = t('level.page_title', { title: text.title });
  };
  setPageTitle();

  let scene: SceneHandle | null = null;
  let destroyed = false;
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
        controller.attach(handle);
      });
      // The start card opens a level the first time it is played in a visit.
      const started = `kydux.started.${loaded.id}`;
      if (storage('session')?.getItem(started) !== 'yes') {
        storage('session')?.setItem(started, 'yes');
        showStart();
      }
    },
    async relabel() {
      const before = text;
      text = await loadLevelText(loaded.id, currentLanguage());
      if (!typed && editor.getDoc() === before.starting_code) editor.setDoc(text.starting_code);
      for (const [labelNode, say] of labels) labelNode.textContent = say();
      goals = goalsPanel(goalTexts());
      goalsSlot.replaceChildren(goals.node);
      editor.view.contentDOM.setAttribute('aria-label', t('level.code_label'));
      about.setAttribute('aria-label', t('level.about'));
      about.title = t('level.about');
      if (shownCard?.open && shownCard.node.querySelector('.start-card')) showStart();
      render(controller.snapshot, true);
      setPageTitle();
    },
    destroy() {
      destroyed = true;
      shownCard?.close();
      for (const unsubscribe of stopped) unsubscribe();
      stopped = [];
      controller.destroy();
      scene?.destroy();
      editor.destroy();
    },
  };
}
