// The level screen: the scene with the goals over its corner, the editor
// beside it with a handle between the two, Run, Stop, Restart and the speed,
// and the card saying how a run went. It is a view of a RunController (D29):
// it makes the DOM once, renders every snapshot the controller gives, and
// each button calls the controller. The start card opens the level every time its
// screen opens (D248), after the screen's guide the first time the first level opens
// (D258). The card comes with no sound where the run's end sounded as its
// playback ended, and with its sound where there was no playback (D247).

import * as analytics from '../analytics/analytics';
import { checkedFamiliar, familiarTable, isPractice, keptAfter, withFamiliar } from '../content/familiar';
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
import { type Asked, ask } from './ask';
import { offered } from './complete';
import { type ButtonIcon, buttonIcon } from './icons';
import { type GivenChip, programLists, type ProgramLists } from './lists';
import { type ApiTable, familiarVar, heldObjects, notebookEntries, notebookPanel } from './notebook';
import { type Outcome, type OutcomeCard, outcomeCard } from './outcome';
import { openPlan, type PlanWindow } from './plan';
import { portraitOf } from './portraits';
import { withCode } from './words';
import type { Screen } from './screen';

const SPEEDS: Speed[] = [1, 2, 4];
/** How long after the last key the program is kept (D351). */
const KEEP_AFTER = 1000;
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
  /** The level's number in its chapter, in words and in the language now set
   * (*Practice 4*, D56), or none. */
  label?: () => string | undefined;
  /** What the child can type, for the notebook and the editor's completion. */
  table: ApiTable;
  /** Made by the caller, so that Phaser and CodeMirror load on their own. */
  createEditor: (parent: HTMLElement, options: EditorOptions) => Editor;
  startScene: (
    parent: HTMLElement,
    level: LoadedLevel['level'],
    look: Look,
    options?: { told?: Record<string, string> },
  ) => Promise<SceneHandle>;
  /** The map over the level (D71): made once its data is loaded, given how to close
   * it and where a stop chosen goes. */
  openMap?: () => Promise<(overlay: { onClose: () => void; onGo: (hash: string) => void }) => Screen>;
  /** The address of the last lesson before the level, read again from here (D71). */
  lesson?: string;
  /** The screen's guide's words (D68), given to the course's first level alone: its
   * start card opens the guide when closed the first time, and once the guide has been
   * seen offers it again (D248). */
  loadGuide?: () => Promise<GuideText>;
  /** Whether the editor has the lists of what the program has and what is to find over
   * it (D346): every level from the reading room on. */
  lists?: boolean;
}

/** The variables a level gives, green in Tienes (D346): `wizard`; each other variable of
 * the program's start with an entry of the notebook, a door's with its kind; each actor
 * a give goal names; the living familiar. */
export function givenChips(loaded: LoadedLevel, table: ApiTable): GivenChip[] {
  const level = loaded.level;
  const entries = new Set(notebookEntries(level, table, loaded.course).map((entry) => entry.object));
  const kinds = new Map(((level.things as { id: string; kind: string }[] | undefined) ?? []).map((t) => [t.id, t.kind]));
  const look = progress.wizard()?.look;
  // Someone's chip shows their face: the wizard's as the child made it, an actor's own.
  const face = (who: string) => portraitOf(who, look);
  const wizard = face('wizard');
  const chips: GivenChip[] = [wizard ? { name: 'wizard', figure: wizard } : { name: 'wizard' }];
  const add = (chip: GivenChip) => {
    if (!chips.some((one) => one.name === chip.name)) chips.push(chip);
  };
  const actors = new Set(((level.actors as { id: string }[] | undefined) ?? []).map((actor) => actor.id));
  const person = (name: string): GivenChip => {
    const figure = actors.has(name) ? face(name) : null;
    return figure ? { name, figure } : { name };
  };
  for (const object of heldObjects(level, table)) {
    if (object.name === 'wizard' || object.role === 'familiar' || !entries.has(object.name)) continue;
    const kind = kinds.get(object.name);
    add(kind ? { name: object.name, thing: kind } : person(object.name));
  }
  for (const goal of (level.goals as { kind?: string; to?: unknown }[] | undefined) ?? []) {
    if (goal.kind === 'give' && typeof goal.to === 'string') add(person(goal.to));
  }
  const block = level.familiar as { stage?: string; living?: unknown } | undefined;
  if (block?.stage === 'living' && block.living) add({ name: familiarVar(level) });
  return chips;
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
  const number = parts.label?.()
    ? [labelled(element('span', { id: 'level-number', className: 'item-number' }), () => parts.label?.() ?? '')]
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
  // The screen's guide awaited or shown (D258): nothing is run, and the goals box does
  // not fold, until the start card after it is closed.
  let guiding = false;
  // The level shown: the scene has drawn the level's start and the goals box is shown in
  // its shape (D227); what waits for that (the guide, D258) goes on then.
  let levelShown = false;
  let whenShown: (() => void) | null = null;
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
  // The buttons under the editor (D351): each with its picture before its word.
  const pictured = (id: string, icon: ButtonIcon, say: () => string) => {
    const word = labelled(element('span', { className: 'button-word' }), say);
    return element('button', { id, type: 'button', className: 'pictured' }, [buttonIcon(icon), word]);
  };
  const run = pictured('run', 'run', () => t('level.run'));
  const stopWord = element('span', { className: 'button-word' }, [t('level.stop')]);
  const stop = element('button', { id: 'stop', type: 'button', className: 'pictured' }, [buttonIcon('stop'), stopWord]);
  const restart = pictured('restart', 'restart', () => t('level.restart'));
  const original = pictured('original', 'original', () => t('level.original_code'));
  const hint = pictured('hint', 'hint', () => t('level.hint'));
  const notebookButton = pictured('notebook-open', 'notebook', () => t('notebook.open'));
  // In the tester's mode, a button writes the level's solution in the editor: the
  // solution packed apart for it (pack-world.mjs), or on the development server
  // read from content/ (vite.config.ts). The published game holds no solution
  // (D333) and has no tester's mode (D335).
  const solution = debugging()
    ? [labelled(element('button', { id: 'debug-solution', type: 'button' }), () => t('debug.solution'))]
    : [];
  // The lists over the editor, made after the notebook their chips open.
  let listed: ProgramLists | null = null;
  const notebook = notebookPanel(
    loaded.level,
    parts.table,
    (example) => {
      editor.insertLine(example);
    },
    loaded.course,
    // What the code keeps, as the lists over the editor read it (D347), once they are made.
    () => (listed ? { declared: listed.declared, toFind: listed.toFind } : undefined),
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
  // The card words a stop with the level's own words for it, as the scene does (D264).
  const card: OutcomeCard = outcomeCard(
    () => text.changed,
    () => text.told ?? {},
  );

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
  // The lists of what the program has and what is to find, over the editor (D346); a
  // chip opens the notebook.
  const lists: ProgramLists | null = parts.lists
    ? programLists({
        level: loaded.level,
        given: givenChips(loaded, parts.table),
        onHave: (chip) => {
          notebook.showObject(chip.name);
          notebookButton.setAttribute('aria-expanded', 'true');
        },
        onFind: () => {
          notebook.showToFind();
          notebookButton.setAttribute('aria-expanded', 'true');
        },
        onRead: () => notebook.refresh(),
      })
    : null;
  listed = lists;
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
      ...(lists ? [lists.node] : []),
      editorParent,
      // Two rows (D351): the program's, Run, Restart, Stop and Original code; then the
      // notebook, the hint and the speed.
      element('div', { className: 'buttons' }, [
        element('div', { className: 'button-row', id: 'program-buttons' }, [run, restart, stop, original]),
        element('div', { className: 'button-row', id: 'help-buttons' }, [
          notebookButton,
          hint,
          ...solution,
          element('label', { className: 'speed' }, [speedLabel, ' ', speed]),
        ]),
      ]),
      hintsBox,
      card.node,
    ]),
  ]);

  // The editor opens on the kept program when it is this level's, and on its starting
  // code otherwise (D351); what the child types is kept by itself, a second after the last
  // key and at once when the screen is left or the page hidden, and the starting code,
  // while untouched, follows the language.
  const program = progress.keptProgram(loaded.id);
  let typed = program !== null && program !== text.starting_code;
  let keepTimer: ReturnType<typeof setTimeout> | null = null;
  const keep = () => {
    if (keepTimer !== null) clearTimeout(keepTimer);
    keepTimer = null;
    progress.keepProgram(loaded.id, editor.getDoc(), text.starting_code);
  };
  // After the name of something the child's code holds and a dot, the editor offers what
  // the level teaches of it, with the notebook's words: a variable the level gives, a
  // variable the code keeps a found thing in, the familiar by the variable it was born
  // into (D348); nothing for a name alone, a list or a search word, nothing before a dot
  // and nothing inside quotes or a comment.
  const editor = parts.createEditor(editorParent, {
    doc: program ?? text.starting_code,
    label: t('level.code_label'),
    complete: (context) => {
      const found = offered(context.state, context.pos, loaded.level, parts.table, loaded.course);
      return found ? { ...found, validFor: /^\w*$/ } : null;
    },
    onRun: () => runCode(),
    onChange: (doc) => {
      typed = doc !== text.starting_code;
      original.disabled = !typed;
      lists?.changed(doc);
      if (keepTimer !== null) clearTimeout(keepTimer);
      keepTimer = setTimeout(keep, KEEP_AFTER);
    },
  });
  original.disabled = !typed;
  lists?.show(editor.getDoc());
  const onHidden = () => {
    if (document.visibilityState === 'hidden') keep();
  };
  addEventListener('pagehide', keep);
  document.addEventListener('visibilitychange', onHidden);
  // Original code (D351): the starting code back, the kept program dropped, a run stopped
  // and the scene as at the start, once the child says yes in the game's own dialog.
  let asked: Asked | null = null;
  original.addEventListener('click', () => {
    if (asked || !typed) return;
    asked = ask(
      document.body,
      { question: t('level.original_confirm'), yes: t('level.original_yes'), no: t('level.original_no') },
      (yes) => {
        asked = null;
        if (!yes) return;
        controller.restart();
        editor.setDoc(text.starting_code);
        progress.dropProgram(loaded.id);
        lists?.show(text.starting_code);
        editor.focus();
      },
    );
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
  // The start card says Start the first time it opens in this screen, and Continue when
  // the child opens it again with ?, or when it is drawn again in another language.
  let startOpened = false;
  let startAgain = false;
  // The card that opens after the guide's first showing, a card of a first opening,
  // does not offer the guide just seen; opened again, it does (D258).
  let guideJustSeen = false;
  // The screen's guide (D68), with the notebook opened for its step about it. It opens
  // once the level is shown, so that every step outlines a part that is there, and gives
  // way to what comes after it, the start card (D258).
  let guide: Guide | null = null;
  const showGuide = (after: () => void) => {
    if (guiding || !parts.loadGuide) return;
    guiding = true;
    let openedNotebook = false;
    const setNotebook = (open: boolean) => {
      if (notebook.open !== open) notebook.toggle();
      notebookButton.setAttribute('aria-expanded', String(notebook.open));
    };
    // Words that cannot be read leave the level with no guide, which is still to be seen:
    // the card it was asked from stays, and where none is open what comes after it opens.
    const words = parts.loadGuide().catch(() => null);
    const open = () =>
      void words.then((text) => {
        if (destroyed || guide) return;
        if (!text) {
          guiding = false;
          if (!startShown()) after();
          return;
        }
        if (startShown()) shownCard?.close();
        guide = openGuide(document.body, text, {
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
            after();
          },
        });
      });
    if (levelShown) open();
    else whenShown = open;
  };
  const showStart = (redraw = false) => {
    if (!redraw) startAgain = startOpened;
    startOpened = true;
    showCard(
      startCard(
        {
          title: text.title,
          again: startAgain,
          label: parts.label?.(),
          task: task(),
          goals: goalTexts(),
          said: said(text.intro),
          carrying: carrying(),
          changes: text.changes,
          // Described again with a familiar living: practice, which keeps nothing (D265).
          practice: isPractice(loaded.level) ? t('familiar.practice') : undefined,
          // Show me the screen, on the first level's card once the guide has been seen
          // (D248): the guide, and the card again after it (D258).
          onGuide:
            parts.loadGuide && progress.guided() && !guideJustSeen ? () => showGuide(() => showStart()) : undefined,
        },
        () => {
          guideJustSeen = false;
          // A staged trial that does not hold starts its seconds (D276).
          cardClosed = true;
          scene?.cardClosed();
          editor.focus();
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
      // The guide or a card opened meanwhile: the fold waits for its close (D258).
      if (guiding || (shownCard?.open && shownCard.over === 'window')) return;
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
    if (guiding || !controller.snapshot.canRun) return;
    progress.countRun(loaded.id);
    analytics.ran(loaded.id);
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
    if (hintsShown < allHints().length) analytics.hinted(loaded.id, hintsShown + 1);
    hintsShown = Math.min(hintsShown + 1, allHints().length);
    progress.setHints(loaded.id, hintsShown);
    renderHints();
  });
  renderHints();
  solution[0]?.addEventListener('click', async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}__debug/solution/${loaded.id}`);
    if (!response.ok) return;
    const code = await response.text();
    // A level with a familiar: the solution with the game's own familiar (D265).
    const familiars = familiarTable();
    const kept = familiars && loaded.level.familiar ? checkedFamiliar(progress.familiar(), familiars) : null;
    editor.setDoc(kept && familiars ? withFamiliar(code, kept, familiars) : code);
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
    stopWord.textContent = snapshot.canPlay ? t('level.play') : t('level.stop');
    stop.dataset.play = String(snapshot.canPlay);
    stop.disabled = !snapshot.canStop && !snapshot.canPlay;
    timeline.max = String(snapshot.length);
    timeline.value = String(snapshot.tick);
    timeline.disabled = !snapshot.canSeek;
    snapshot.goals.forEach((mark, index) => goals.set(index, mark));
    renderWays(snapshot, force);
    if (force || snapshot.outcome !== shownOutcome) {
      if (snapshot.outcome) card.show(snapshot.outcome, snapshot.printed);
      else card.hide();
      if (!force && snapshot.outcome) {
        judged = true;
        const { outcome } = snapshot;
        analytics.ended(loaded.id, outcome.kind, outcome.kind === 'error' ? outcome.error : undefined);
      }
      // A run's end has its sound (the settings may silence it): played by the controller
      // as the playback ended, or here for an outcome that had no playback (D247).
      if (!force && snapshot.outcome && !snapshot.sounded) play(snapshot.outcome.kind === 'won' ? 'win' : 'fail');
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
        analytics.won(loaded.id, verdict.earned, hintsShown);
        // The trial kept as the draft, the familiar born kept for good, what it learned
        // kept with it (D265).
        const familiars = familiarTable();
        if (familiars) {
          const kept = checkedFamiliar(progress.familiar(), familiars);
          const after = keptAfter(loaded.level, snapshot.world, kept);
          if (after) progress.keepFamiliar(after);
        }
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
    else showStart();
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

  // The map as a window over the level (D71, D352): the level stays behind, darkened, its
  // run and its editor as they are; the button back, a click outside the window and
  // Escape close it, and leaving for another stop while a run goes on asks.
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
        // The level's own stop opens it again, on the program kept as it was left (D351).
        if (hash === location.hash) document.dispatchEvent(new CustomEvent('kydux:reopen'));
        else location.hash = hash;
      },
    });
    const frame = element('div', { id: 'map-window', className: 'map-window' }, [screen.node]);
    frame.setAttribute('role', 'dialog');
    frame.setAttribute('aria-modal', 'true');
    frame.setAttribute('aria-labelledby', 'map-window-title');
    const layer = element('div', { id: 'map-overlay', className: 'map-overlay' }, [frame]);
    // A click outside the window, on the level darkened around it, closes it.
    layer.addEventListener('click', (event) => {
      if (event.target === layer) closeMap();
    });
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
  /** Whether the start card has been closed once, told to a scene that comes after. */
  let cardClosed = false;
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
      // The level's own words said while a program runs (D264).
      const told = loaded.text.told ? { told: loaded.text.told } : {};
      void parts.startScene(sceneParent, loaded.level, look, told).then((handle) => {
        if (destroyed) {
          handle.destroy();
          return;
        }
        scene = handle;
        if (cardClosed) handle.cardClosed();
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
        // Words on the scene never go under the goals box (D240).
        handle.onCover(() => goals.box());
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
          levelShown = true;
          const waiting = whenShown;
          whenShown = null;
          waiting?.();
          seeGoals();
        }, 400);
      });
      // The start card opens the level every time its screen opens (D248); the first time
      // the first level opens, the screen's guide comes first, once the level is shown,
      // and the card after it (D258).
      progress.setCurrent(`level:${loaded.id}`);
      if (parts.loadGuide && !progress.guided())
        showGuide(() => {
          guideJustSeen = true;
          showStart();
        });
      else showStart();
    },
    async relabel() {
      const before = text;
      text = await loadLevelText(loaded.id, currentLanguage());
      if (!typed && editor.getDoc() === before.starting_code) editor.setDoc(text.starting_code);
      for (const [labelNode, say] of labels) labelNode.textContent = say();
      lists?.relabel();
      lists?.show(editor.getDoc());
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
      // The program is kept as the screen is left (D351).
      keep();
      removeEventListener('pagehide', keep);
      document.removeEventListener('visibilitychange', onHidden);
      asked?.dismiss();
      planShown?.dismiss();
      shownCard?.close();
      guide?.node.remove();
      mapShown?.destroy();
      for (const unsubscribe of stopped) unsubscribe();
      stopped = [];
      controller.destroy();
      scene?.destroy();
      lists?.destroy();
      editor.destroy();
    },
  };
}
