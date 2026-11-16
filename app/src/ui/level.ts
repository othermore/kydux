// The level screen: the scene with the goals over its corner, the editor
// beside it with a handle between the two, Run, Stop, Restart and the speed,
// and the card saying how a run went. It is a view of a RunController (D29):
// it makes the DOM once, renders every snapshot the controller gives, and
// each button calls the controller.

import { itemHash } from '../content/course';
import { type LoadedLevel, loadLevelText } from '../content/levels';
import type { Editor, EditorOptions } from '../editor/editor';
import { debugging } from '../engine/debugging';
import { carriedKinds } from '../engine/layout';
import type { Speed } from '../engine/playback';
import { type Look, lookOf } from '../engine/looks';
import type { SceneHandle } from '../engine/scene';
import { characterName, currentLanguage, t } from '../i18n';
import * as progress from '../progress/progress';
import { DEFAULT_SETTINGS, SPLIT_MAX, SPLIT_MIN } from '../progress/store';
import type { Runtime, RuntimeStatus } from '../runtime/runtime';
import { onPlayed, play } from '../engine/sfx';
import { type Card, startCard, winCard } from './cards';
import { RunController, type RunSnapshot } from './controller';
import { type Guide, type GuideText, openGuide } from './guide';
import { judge, type Verdict } from './stars';
import { zoomBox } from './zoom';
import { element } from './dom';
import { type GoalsPanel, type GoalsShape, goalsPanel, takeShape } from './goals';
import { clampSplit, setSplit, splitAt } from './look';
import { type ApiTable, describe, notebookEntries, notebookPanel } from './notebook';
import { type Outcome, type OutcomeCard, outcomeCard } from './outcome';
import { openPlan, type PlanWindow } from './plan';
import { portraitOf } from './portraits';
import { withCode } from './words';
import type { Screen } from './screen';

const SPEEDS: Speed[] = [1, 2, 4];
/** How long the goals box stays open before the page folds it, where both its shapes
 * cover something (D227). */
const FOLD_AFTER = 3000;

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
  /** The level's number in its chapter, in words (*Practice 4*, D56), or none. */
  label?: string;
  /** What the child can type, for the notebook and the editor's completion. */
  table: ApiTable;
  /** Made by the caller, so that Phaser and CodeMirror load on their own. */
  createEditor: (parent: HTMLElement, options: EditorOptions) => Editor;
  startScene: (parent: HTMLElement, level: LoadedLevel['level'], look: Look) => Promise<SceneHandle>;
  /** The map over the level (D71): made once its data is loaded, given how to close
   * it and where a stop chosen goes. */
  openMap?: () => Promise<(overlay: { onClose: () => void; onGo: (hash: string) => void }) => Screen>;
  /** The address of the last lesson before the level, read again from here (D71). */
  lesson?: string;
  /** The screen's guide's words (D68), and whether this level opens the guide the
   * first time it is played: the course's first level. */
  loadGuide?: () => Promise<GuideText>;
  guideFirst?: boolean;
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
  const toLesson = parts.lesson
    ? [labelled(element('a', { id: 'level-lesson', className: 'quiet-button small', href: parts.lesson }), () =>
        t('level.lesson'),
      )]
    : [];
  const number = parts.label
    ? [element('span', { id: 'level-number', className: 'item-number' }, [parts.label])]
    : [];
  const heading = element('div', { className: 'level-heading' }, [
    ...number,
    title,
    about,
    ...toLesson,
    toMap,
    toSettings,
  ]);
  // A fix or an improve level says on its start card what is to be done (D56).
  const kind = typeof loaded.level.kind === 'string' ? loaded.level.kind : 'practice';
  const task = () => (kind === 'fix' || kind === 'improve' ? t(`level.kind_${kind}`) : undefined);
  const sceneParent = element('div', { id: 'scene', className: 'scene' });
  // The last sound played, for the tests, which cannot hear.
  onPlayed((name) => {
    sceneParent.dataset.sound = name;
  });
  const goalsSlot = element('div', { className: 'goals-slot' });
  const bonus = ((loaded.level.goals as { bonus?: boolean }[] | undefined) ?? []).map(
    (goal) => goal.bonus === true,
  );
  const goalTexts = () => text.goals.map((g, index) => ({ text: g, bonus: bonus[index] }));
  let goals: GoalsPanel = goalsPanel(goalTexts());
  goalsSlot.append(goals.node);
  // The goals box's shape, taken once in the level's visit, and whether it is to fold, or
  // was folded, by itself (D227).
  let goalsShape: GoalsShape | null = null;
  let foldPending = false;
  let foldedByPage = false;
  let foldTimer: ReturnType<typeof setTimeout> | null = null;
  let guiding = false;
  const status = element('p', { id: 'status', className: 'status' });
  // A level played in several ways (D51): the child is told only what may differ at
  // each run (D204); under ?debug, after a run, a select of the ways' ids plays back
  // the way the tester picks.
  const testing = debugging();
  const waySelect = element('select', { id: 'way' });
  const wayLabel = labelled(element('span', { className: 'way-label' }), () => t('level.way_label'));
  const wayBox = element('label', { className: 'way', hidden: true }, [wayLabel, ' ', waySelect]);
  waySelect.addEventListener('change', () => controller.showWay(waySelect.value));
  let shownWays = '';
  const renderWays = (snapshot: RunSnapshot, force: boolean) => {
    wayBox.hidden = !testing || snapshot.ways.length === 0;
    const key = snapshot.ways.join(',');
    if (force || key !== shownWays) {
      waySelect.replaceChildren(
        ...snapshot.ways.map((id) => element('option', { value: id }, [id])),
      );
      shownWays = key;
    }
    if (snapshot.way !== null) waySelect.value = snapshot.way;
  };
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
  // In the tester's mode, a button writes the level's solution in the editor: the
  // solution packed apart for it (pack-world.mjs), or on the development server
  // read from content/ (vite.config.ts).
  const solution =
    debugging()
      ? [labelled(element('button', { id: 'debug-solution', type: 'button' }), () => t('debug.solution'))]
      : [];
  const notebook = notebookPanel(
    loaded.level,
    parts.table,
    (example) => {
      editor.insertLine(example);
    },
    loaded.course,
  );
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
  const card: OutcomeCard = outcomeCard(() => text.changed);

  // The camera's zoom, and Find my wizard (zoom.ts).
  const zoom = zoomBox(sceneParent);

  // The notebook opens over the scene, beside the editor, so that an example
  // clicked lands where the child can see it.
  // What the scene shows while the level starts again before a run (D75): a
  // spinner, its words only for a screen reader.
  const restartNote = element('div', { id: 'restart-note', className: 'restart-note', hidden: true }, [
    element('span', { className: 'restart-spinner' }),
  ]);
  restartNote.setAttribute('role', 'status');
  restartNote.setAttribute('aria-label', t('level.starting_again'));
  const sceneFrame = element('div', { className: 'scene-frame' }, [
    sceneParent,
    restartNote,
    goalsSlot,
    zoom.node,
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
      ...(testing ? [wayBox] : []),
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
        ...solution,
        element('label', { className: 'speed' }, [speedLabel, ' ', speed]),
      ]),
      hintsBox,
      card.node,
    ]),
  ]);

  // The editor opens on the level's starting code, as the first time (D131): what
  // the child types is kept while the screen is open, through Run, Restart and Play
  // again, and the starting code, while untouched, follows the language.
  let typed = false;
  // After the name of something the child's code holds and a dot, the editor
  // offers what the level teaches of it, with the notebook's words.
  const entries = notebookEntries(loaded.level, parts.table, loaded.course);
  const editor = parts.createEditor(editorParent, {
    doc: text.starting_code,
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
          detail: describe(entry.role, entry.member.name, entry.simple),
        })),
        validFor: /^\w*$/,
      };
    },
    onRun: () => runCode(),
    onChange: (doc) => {
      typed = doc !== text.starting_code;
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
      case 'stale':
        return t('level.stale_world');
    }
  };

  // The cards: the start card over the whole window (D228), in the screen's own node so
  // that it leaves with the screen; the win card over the scene, inside its frame.
  let shownCard: Card | null = null;
  const showCard = (card: Card) => {
    shownCard?.close();
    shownCard = card;
    (card.over === 'window' ? node : sceneFrame).append(card.node);
  };
  // The level's story, said by its speaker (D45): a name of the story's, through i18n.
  const speaker = typeof loaded.level.speaker === 'string' ? loaded.level.speaker : null;
  const said = (words: string | undefined) =>
    speaker && words
      ? { speaker: characterName(speaker), text: words, portrait: portraitOf(speaker, progress.wizard()?.look) }
      : undefined;
  // What the wizard holds from the start (D49), said with each thing's name.
  const carried = carriedKinds(loaded.level);
  const carrying = () =>
    carried.length > 0
      ? t('level.carrying', { things: carried.map((kind) => t(`things.${kind}`)).join(', ') })
      : undefined;
  // The start card says Start the first time it opens, and Continue when the child
  // opens it again with ?, or when it is drawn again in another language.
  let startOpened = false;
  let startAgain = false;
  // The screen's guide (D68), with the notebook opened for its step about it.
  let guide: Guide | null = null;
  const showGuide = () => {
    if (guide || !parts.loadGuide) return;
    let openedNotebook = false;
    const setNotebook = (open: boolean) => {
      if (notebook.open !== open) notebook.toggle();
      notebookButton.setAttribute('aria-expanded', String(notebook.open));
    };
    void parts.loadGuide().then((words) => {
      if (destroyed || guide) return;
      guide = openGuide(document.body, words, {
        onStep: (key) => {
          if (key === 'notebook' && !notebook.open) {
            setNotebook(true);
            openedNotebook = true;
          } else if (key !== 'notebook' && openedNotebook) {
            setNotebook(false);
            openedNotebook = false;
          }
        },
        onClose: () => {
          if (openedNotebook) setNotebook(false);
          guide = null;
          guiding = false;
          progress.markGuided();
          editor.focus();
          seeGoals();
        },
      });
    });
  };
  const showStart = (redraw = false, asked = false) => {
    if (!redraw) startAgain = startOpened;
    startOpened = true;
    showCard(
      startCard(
        {
          title: text.title,
          again: startAgain,
          label: parts.label,
          task: task(),
          goals: goalTexts(),
          said: said(text.intro),
          carrying: carrying(),
          changes: text.changes,
          onGuide: parts.loadGuide && (asked || startAgain) ? showGuide : undefined,
        },
        () => {
          // The first level opens the guide once its start card is closed, the first time.
          if (parts.guideFirst && !progress.guided()) {
            guiding = true;
            showGuide();
          } else editor.focus();
          seeGoals();
        },
      ),
    );
  };
  // The child can see the goals box once its shape is taken, the start card closed and
  // the screen's guide over: three seconds after, a box to fold folds, unless the child
  // has used its heading (D227).
  const seeGoals = () => {
    if (!foldPending || foldTimer !== null || goalsShape === null || guiding) return;
    if (shownCard?.open && shownCard.over === 'window') return;
    foldTimer = setTimeout(() => {
      foldTimer = null;
      foldPending = false;
      if (destroyed || goals.touched) return;
      goals.fold();
      foldedByPage = true;
    }, FOLD_AFTER);
  };
  const showWin = (verdict: Verdict, kept: number) =>
    showCard(
      winCard({
        verdict,
        kept,
        next: parts.next ? itemHash(parts.next) : null,
        onAgain: () => editor.focus(),
        onNext: (hash) => {
          location.hash = hash;
        },
        said: said(text.outro),
        learned: text.learned,
      }),
    );

  // A run, counted in the progress and in this visit: the first-try star asks
  // whether this visit's first run won (D57). A run that ended with no card, stopped by
  // the child, is not judged, and does not count here (D177).
  let runsHere = 0;
  let judged = true;
  const runCode = () => {
    if (!controller.snapshot.canRun) return;
    progress.countRun(loaded.id);
    if (!judged) runsHere -= 1;
    runsHere += 1;
    judged = false;
    controller.run(editor.getDoc());
  };

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
  solution[0]?.addEventListener('click', async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}__debug/solution/${loaded.id}`);
    if (response.ok) editor.setDoc(await response.text());
  });

  // What was last drawn, so that the card and the editor's marks change only
  // when the controller's do.
  let shownOutcome: Outcome | null = null;
  let shownLines: [number | null, number | null] = [null, null];

  const render = (snapshot: RunSnapshot, force = false) => {
    restartNote.hidden = !snapshot.restarting;
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
    renderWays(snapshot, force);
    if (force || snapshot.outcome !== shownOutcome) {
      if (snapshot.outcome) card.show(snapshot.outcome, snapshot.printed);
      else card.hide();
      if (!force && snapshot.outcome) judged = true;
      // A run's end has its sound (the settings may silence it).
      if (!force && snapshot.outcome) play(snapshot.outcome.kind === 'won' ? 'win' : 'fail');
      if (snapshot.outcome && snapshot.outcome.kind !== 'won' && snapshot.outcome.kind !== 'failed') {
        if (!hintsOffered && !force) progress.markTried(loaded.id);
        hintsOffered = true;
        renderHints();
      }
      if (!force && snapshot.outcome?.kind === 'won' && snapshot.world) {
        // The runs before this one in this visit cost the first-try star (D57).
        const verdict = judge({ world: snapshot.world, hintsShown, misses: Math.max(0, runsHere - 1) });
        const kept = progress.levelProgress(loaded.id).stars ?? 0;
        progress.markWon(loaded.id, verdict.earned);
        // Continue, on the start screen, goes to what comes after.
        if (parts.next) progress.setCurrent(parts.next);
        showWin(verdict, kept);
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
  // ? opens the start card, and closes the one it opened (D222).
  const startShown = () => Boolean(shownCard?.open && shownCard.node.querySelector('.start-card'));
  about.addEventListener('click', () => {
    if (startShown()) shownCard?.close();
    else showStart(false, true);
  });
  // While the start card is open, a click on any other button of the page closes it,
  // and the button does what it does: Run runs, Hint hints, the notebook opens, the
  // speed changes (a select changed from the keyboard too). A click on the scene, the
  // editor or the card closes nothing (D222).
  const closeStartFor = (event: Event) => {
    const target = event.target instanceof Element ? event.target : null;
    const control = target?.closest('button, select, a[href]');
    if (!control || control === about || !startShown() || shownCard?.node.contains(control)) return;
    shownCard?.close();
  };
  node.addEventListener('click', closeStartFor, { capture: true });
  node.addEventListener('change', closeStartFor, { capture: true });

  // The map over the level (D71): the run and the editor stay as they are; Back,
  // or Escape, closes it, and leaving for another stop while a run goes on asks.
  let mapShown: { node: HTMLElement; destroy: () => void } | null = null;
  const closeMap = () => {
    mapShown?.destroy();
    mapShown = null;
    editor.focus();
  };
  const openMap = async () => {
    if (mapShown || !parts.openMap) return;
    const make = await parts.openMap();
    if (destroyed || mapShown) return;
    const screen = make({
      onClose: closeMap,
      onGo: (hash) => {
        if (controller.snapshot.canStop && !window.confirm(t('map.leave_run'))) return;
        closeMap();
        // The level's own stop opens it again, from its starting code (D131).
        if (hash === location.hash) document.dispatchEvent(new CustomEvent('kydux:reopen'));
        else location.hash = hash;
      },
    });
    const layer = element('div', { id: 'map-overlay', className: 'map-overlay' }, [screen.node]);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMap();
    };
    addEventListener('keydown', onKey);
    document.body.append(layer);
    screen.mount?.();
    mapShown = {
      node: layer,
      destroy: () => {
        removeEventListener('keydown', onKey);
        screen.destroy();
        layer.remove();
      },
    };
    layer.querySelector<HTMLElement>('#map-close')?.focus();
  };
  toMap.addEventListener('click', (event) => {
    if (!parts.openMap) return;
    event.preventDefault();
    void openMap();
  });
  run.addEventListener('click', () => runCode());
  stop.addEventListener('click', () => {
    if (controller.snapshot.canPlay) controller.resume();
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
      runCode();
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
  let planShown: PlanWindow | null = null;
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
        // The map opened by its spell (D134): the run waits until it is closed, and a
        // run started again closes it.
        handle.onMap(
          (view) => {
            planShown?.dismiss();
            sceneParent.dataset.planOpen = 'true';
            planShown = openPlan(view, () => {
              planShown = null;
              delete sceneParent.dataset.planOpen;
              controller.resume();
              editor.focus();
            });
          },
          () => {
            planShown?.dismiss();
            planShown = null;
            delete sceneParent.dataset.planOpen;
          },
        );
        zoom.attach(handle);
        controller.attach(handle);
        // The goals box takes its shape once the camera has drawn the level's start: the
        // list, or the strip, whichever first covers nothing of the level; where both do,
        // the list, folded three seconds after the child can see it (D227).
        setTimeout(() => {
          if (destroyed) return;
          const taken = takeShape(goals.measure('list'), goals.measure('strip'), handle.levelBoxes());
          goalsShape = taken.shape;
          goals.shape(taken.shape);
          // What each shape covered, for the tests and the sweep.
          goals.node.dataset.listCovers = String(taken.covers.list);
          goals.node.dataset.stripCovers = String(taken.covers.strip);
          goals.reveal();
          foldPending = taken.fold;
          seeGoals();
        }, 400);
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
      zoom.relabel();
      goals = goalsPanel(goalTexts());
      goalsSlot.replaceChildren(goals.node);
      if (goalsShape) {
        goals.shape(goalsShape);
        goals.reveal();
      }
      if (foldedByPage) goals.fold();
      editor.view.contentDOM.setAttribute('aria-label', t('level.code_label'));
      about.setAttribute('aria-label', t('level.about'));
      about.title = t('level.about');
      restartNote.setAttribute('aria-label', t('level.starting_again'));
      timeline.setAttribute('aria-label', t('level.timeline'));
      labelSettings();
      labelKeys();
      if (shownCard?.open && shownCard.node.querySelector('.start-card')) showStart(true);
      renderHints();
      notebook.relabel();
      render(controller.snapshot, true);
      setPageTitle();
    },
    destroy() {
      destroyed = true;
      planShown?.dismiss();
      shownCard?.close();
      guide?.node.remove();
      mapShown?.destroy();
      for (const unsubscribe of stopped) unsubscribe();
      stopped = [];
      controller.destroy();
      scene?.destroy();
      editor.destroy();
    },
  };
}
