// The level screen: the scene with the goals over its corner, the editor
// beside it with a handle between the two, Run, Stop, Restart and the speed,
// and the card saying how a run went. It is a view of a RunController (D29):
// it makes the DOM once, renders every snapshot the controller gives, and
// each button calls the controller.

import { itemHash } from '../content/course';
import { type LoadedLevel, loadLevelText } from '../content/levels';
import type { Editor, EditorOptions } from '../editor/editor';
import type { Speed } from '../engine/playback';
import { type Look, lookOf } from '../engine/looks';
import type { SceneHandle } from '../engine/scene';
import { currentLanguage, t } from '../i18n';
import * as progress from '../progress/progress';
import { DEFAULT_SETTINGS, SPLIT_MAX, SPLIT_MIN } from '../progress/store';
import type { Runtime, RuntimeStatus } from '../runtime/runtime';
import { type Card, startCard, stars, winCard } from './cards';
import { RunController, type RunSnapshot } from './controller';
import { element } from './dom';
import { type GoalsPanel, goalsPanel } from './goals';
import { clampSplit, setSplit, splitAt } from './look';
import { type ApiTable, describe, notebookEntries, notebookPanel } from './notebook';
import { type Outcome, type OutcomeCard, outcomeCard, withCode } from './outcome';

const SPEEDS: Speed[] = [1, 2, 4];

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
  /** The course's item after this level, `lesson:<id>` or `level:<id>`, or null after
   * the last. */
  next: string | null;
  /** What the child can type, for the notebook and the editor's completion. */
  table: ApiTable;
  /** Made by the caller, so that Phaser and CodeMirror load on their own. */
  createEditor: (parent: HTMLElement, options: EditorOptions) => Editor;
  startScene: (parent: HTMLElement, level: LoadedLevel['level'], look: Look) => Promise<SceneHandle>;
}

export function levelScreen(parts: LevelScreenParts): LevelScreen {
  const { runtime, loaded } = parts;
  let text = loaded.text;
  const controller = new RunController({
    runtime,
    level: loaded,
    speed: progress.settings().speed,
  });
  const kept = progress.levelProgress(loaded.id);

  // The words that change with the language, each with how to say it.
  const labels: [HTMLElement, () => string][] = [];
  const labelled = <T extends HTMLElement>(node: T, say: () => string): T => {
    labels.push([node, say]);
    node.textContent = say();
    return node;
  };

  const title = labelled(element('h2', { className: 'level-title' }), () => text.title);
  const about = element('button', { id: 'about', type: 'button', className: 'about' }, ['?']);
  const toMap = labelled(element('a', { id: 'level-map', className: 'quiet-button small', href: '#map' }), () =>
    t('map.open_map'),
  );
  const toSettings = element('a', { id: 'level-settings', className: 'gear', href: '#settings' }, ['⚙']);
  const heading = element('div', { className: 'level-heading' }, [title, about, toMap, toSettings]);
  const sceneParent = element('div', { id: 'scene', className: 'scene' });
  const goalsSlot = element('div', { className: 'goals-slot' });
  const bonus = ((loaded.level.goals as { bonus?: boolean }[] | undefined) ?? []).map(
    (goal) => goal.bonus === true,
  );
  const goalTexts = () => text.goals.map((g, index) => ({ text: g, bonus: bonus[index] }));
  let goals: GoalsPanel = goalsPanel(goalTexts());
  goalsSlot.append(goals.node);
  const status = element('p', { id: 'status', className: 'status' });
  const timeline = element('input', {
    id: 'timeline',
    type: 'range',
    min: '0',
    max: '0',
    value: '0',
    step: '1',
    className: 'timeline',
    disabled: true,
  });
  timeline.setAttribute('aria-label', t('level.timeline'));

  const editorParent = element('div', { className: 'editor' });
  const run = labelled(element('button', { id: 'run', type: 'button' }), () => t('level.run'));
  const stop = element('button', { id: 'stop', type: 'button' }, [t('level.stop')]);
  const restart = labelled(element('button', { id: 'restart', type: 'button' }), () =>
    t('level.restart'),
  );
  const hint = labelled(element('button', { id: 'hint', type: 'button' }), () => t('level.hint'));
  const notebookButton = labelled(element('button', { id: 'notebook-open', type: 'button' }), () =>
    t('notebook.open'),
  );
  const notebook = notebookPanel(loaded.level, parts.table, (example) => {
    editor.insertLine(example);
  });
  notebookButton.addEventListener('click', () => {
    notebook.toggle();
    notebookButton.setAttribute('aria-expanded', String(notebook.open));
  });
  notebookButton.setAttribute('aria-controls', 'notebook');
  notebookButton.setAttribute('aria-expanded', 'false');
  const hintsBox = element('section', { className: 'hints', hidden: true });
  hintsBox.setAttribute('aria-live', 'polite');
  const speed = element('select', { id: 'speed' });
  for (const value of SPEEDS) {
    speed.append(element('option', { value: String(value) }, [`${value}×`]));
  }
  speed.value = String(progress.settings().speed);
  const speedLabel = labelled(element('span', { className: 'speed-label' }), () =>
    t('level.speed'),
  );
  const card: OutcomeCard = outcomeCard();

  // The notebook opens over the scene, beside the editor, so that an example
  // clicked lands where the child can see it.
  const sceneFrame = element('div', { className: 'scene-frame' }, [
    sceneParent,
    goalsSlot,
    notebook.node,
  ]);
  const handle = element('div', { id: 'split', className: 'split-handle', tabIndex: 0 });
  handle.setAttribute('role', 'separator');
  handle.setAttribute('aria-orientation', 'vertical');
  handle.setAttribute('aria-valuemin', String(Math.round(SPLIT_MIN * 100)));
  handle.setAttribute('aria-valuemax', String(Math.round(SPLIT_MAX * 100)));
  const node = element('div', { className: 'level-screen' }, [
    element('section', { className: 'stage' }, [
      heading,
      sceneFrame,
      timeline,
      status,
    ]),
    handle,
    element('section', { className: 'workbench' }, [
      editorParent,
      element('div', { className: 'buttons' }, [
        run,
        stop,
        restart,
        hint,
        notebookButton,
        element('label', { className: 'speed' }, [speedLabel, ' ', speed]),
      ]),
      hintsBox,
      card.node,
    ]),
  ]);

  // The editor keeps what the child typed in the progress document; the
  // starting code, while untouched, follows the language.
  const saved = kept.code;
  let typed = saved !== undefined && saved !== text.starting_code;
  // After the name of something the child's code holds and a dot, the editor
  // offers what the level teaches of it, with the notebook's words.
  const entries = notebookEntries(loaded.level, parts.table);
  const editor = parts.createEditor(editorParent, {
    doc: typed && saved ? saved : text.starting_code,
    label: t('level.code_label'),
    complete: (context) => {
      const before = context.matchBefore(/\b(\w+)\.\w*$/);
      if (!before) return null;
      const object = before.text.slice(0, before.text.indexOf('.'));
      const own = entries.filter((entry) => entry.object === object);
      if (own.length === 0) return null;
      return {
        from: before.from + object.length + 1,
        options: own.map((entry) => ({
          label: entry.member.name,
          type: entry.member.kind === 'action' ? 'method' : 'property',
          detail: describe(entry.role, entry.member.name),
        })),
        validFor: /^\w*$/,
      };
    },
    onRun: () => controller.run(editor.getDoc()),
    onChange: (doc) => {
      typed = doc !== text.starting_code;
      progress.setCode(loaded.id, doc);
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
  // The level's story, said by its speaker (D45): a name of the story's, through i18n.
  const speaker = typeof loaded.level.speaker === 'string' ? loaded.level.speaker : null;
  const said = (words: string | undefined) =>
    speaker && words ? { speaker: t(`characters.${speaker}`), text: words } : undefined;
  // What the wizard holds from the start (D49), said with each thing's name.
  const carried = Array.isArray(loaded.level.carrying) ? loaded.level.carrying.map(String) : [];
  const carrying = () =>
    carried.length > 0
      ? t('level.carrying', { things: carried.map((kind) => t(`things.${kind}`)).join(', ') })
      : undefined;
  const showStart = () =>
    showCard(
      startCard(
        { title: text.title, goals: goalTexts(), said: said(text.intro), carrying: carrying() },
        () => editor.focus(),
      ),
    );
  const showWin = (earned: number) =>
    showCard(
      winCard(
        earned,
        parts.next ? itemHash(parts.next) : null,
        () => editor.focus(),
        (hash) => {
          location.hash = hash;
        },
        said(text.outro),
      ),
    );

  // Hints: one more at each press, offered once a run has not won; the hints
  // shown are kept in the progress document.
  const allHints = () => text.hints ?? [];
  let hintsShown = kept.hints ?? 0;
  let hintsOffered = kept.tried === true || hintsShown > 0;
  const renderHints = () => {
    const hints = allHints();
    hint.hidden = hints.length === 0;
    hint.disabled = !hintsOffered || hintsShown >= hints.length;
    hintsBox.hidden = hintsShown === 0;
    hintsBox.replaceChildren(
      ...hints.slice(0, hintsShown).map((said, index) =>
        element('p', { className: 'hint' }, [
          element('strong', {}, [t('level.hint_n', { n: index + 1, total: hints.length })]),
          ' ',
          ...withCode(said),
        ]),
      ),
    );
  };
  hint.addEventListener('click', () => {
    hintsShown = Math.min(hintsShown + 1, allHints().length);
    progress.setHints(loaded.id, hintsShown);
    renderHints();
  });
  renderHints();

  // What was last drawn, so that the card and the editor's marks change only
  // when the controller's do.
  let shownOutcome: Outcome | null = null;
  let shownLines: [number | null, number | null] = [null, null];

  const render = (snapshot: RunSnapshot, force = false) => {
    status.textContent = statusLine(snapshot.runtime);
    status.dataset.status = snapshot.runtime;
    run.disabled = !snapshot.canRun;
    // Stop, or Play once the timeline has paused the playback.
    stop.textContent = snapshot.canPlay ? t('level.play') : t('level.stop');
    stop.disabled = !snapshot.canStop && !snapshot.canPlay;
    timeline.max = String(snapshot.length);
    timeline.value = String(snapshot.tick);
    timeline.disabled = !snapshot.canSeek;
    snapshot.goals.forEach((mark, index) => goals.set(index, mark));
    if (force || snapshot.outcome !== shownOutcome) {
      if (snapshot.outcome) card.show(snapshot.outcome, snapshot.printed);
      else card.hide();
      if (snapshot.outcome && snapshot.outcome.kind !== 'won' && snapshot.outcome.kind !== 'failed') {
        if (!hintsOffered && !force) progress.markTried(loaded.id);
        hintsOffered = true;
        renderHints();
      }
      if (!force && snapshot.outcome?.kind === 'won' && snapshot.world) {
        const earned = stars(snapshot.world);
        progress.markWon(loaded.id, earned, editor.getDoc());
        // Continue, on the start screen, goes to what comes after.
        if (parts.next) progress.setCurrent(parts.next);
        showWin(earned);
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
  stop.addEventListener('click', () => {
    if (controller.snapshot.canPlay) controller.play();
    else controller.stop();
  });
  timeline.addEventListener('input', () => {
    // The win card would hide the scene being looked back at.
    if (shownCard?.node.querySelector('.win-card')) shownCard.close();
    controller.seek(Number(timeline.value));
  });
  restart.addEventListener('click', () => controller.restart());
  speed.addEventListener('change', () => {
    progress.setSetting('speed', Number(speed.value) as Speed);
    controller.setSpeed(Number(speed.value) as Speed);
  });

  // The handle between the panes: dragged, it gives the scene its share of the
  // width; double-clicked, the default share; the arrow keys move it too.
  // The share shows at once and is saved when the drag ends. The scene follows,
  // as it does a window resize.
  const showSplit = (share: number) => {
    setSplit(share);
    handle.setAttribute('aria-valuenow', String(Math.round(share * 100)));
  };
  const keepSplit = (share: number) => {
    progress.setSetting('split', clampSplit(share));
    showSplit(clampSplit(share));
  };
  showSplit(progress.settings().split);
  let dragged: number | null = null;
  handle.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    dragged = progress.settings().split;
    handle.classList.add('dragging');
  });
  handle.addEventListener('pointermove', (event) => {
    if (dragged === null) return;
    const box = node.getBoundingClientRect();
    dragged = splitAt(event.clientX, box.left, box.width);
    showSplit(dragged);
  });
  const endDrag = () => {
    if (dragged === null) return;
    keepSplit(dragged);
    dragged = null;
    handle.classList.remove('dragging');
  };
  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);
  handle.addEventListener('dblclick', () => keepSplit(DEFAULT_SETTINGS.split));
  handle.addEventListener('keydown', (event) => {
    const step = event.key === 'ArrowLeft' ? -0.05 : event.key === 'ArrowRight' ? 0.05 : 0;
    if (step === 0) return;
    event.preventDefault();
    keepSplit(progress.settings().split + step);
  });

  const labelSettings = () => {
    toSettings.setAttribute('aria-label', t('level.settings'));
    toSettings.title = t('level.settings');
    handle.setAttribute('aria-label', t('level.split'));
  };
  labelSettings();

  // Keys for the level, anywhere on its screen: Alt+R runs, Alt+N opens the
  // notebook. They are read by the key's place, so that a Mac's Option+R, which
  // types a character, works too (D38).
  const onKey = (event: KeyboardEvent) => {
    if (!event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.code === 'KeyR') {
      event.preventDefault();
      if (controller.snapshot.canRun) controller.run(editor.getDoc());
    } else if (event.code === 'KeyN') {
      event.preventDefault();
      notebookButton.click();
    }
  };
  document.addEventListener('keydown', onKey, true);
  stopped.push(() => document.removeEventListener('keydown', onKey, true));
  const labelKeys = () => {
    run.title = t('level.run_key');
    notebookButton.title = t('level.notebook_key');
  };
  labelKeys();

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
      // The wizard the child made, or the first look before there is one.
      const look = lookOf(progress.wizard()?.look);
      void parts.startScene(sceneParent, loaded.level, look).then((handle) => {
        if (destroyed) {
          handle.destroy();
          return;
        }
        scene = handle;
        controller.attach(handle);
      });
      // The start card opens a level the first time it is played.
      progress.setCurrent(`level:${loaded.id}`);
      if (!progress.hasStarted(loaded.id)) {
        progress.markStarted(loaded.id);
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
      timeline.setAttribute('aria-label', t('level.timeline'));
      labelSettings();
      labelKeys();
      if (shownCard?.open && shownCard.node.querySelector('.start-card')) showStart();
      renderHints();
      notebook.relabel();
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
