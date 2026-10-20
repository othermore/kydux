# Sprint 2 — The level screen

Pieces 1.3 to 1.8 of `plan.md`: the walking skeleton finished. At its end the
corridor is played the way every level will be: a scene with the wizard, an
editor beside it, *Cast*, the wizard walking tile by tile while the editor
marks the line, the goals ticking off, and a word on how it went. The
playground goes.

Sprint 1's rules hold: pieces in order, `ci/check.sh --e2e` green and one
local commit per piece, never a push, everything the player sees through
`t()`, nothing forbidden and nothing secret in the tree. The owner's
acceptance test comes later, after further sprints; section 6 is for then.

## 1. Decisions taken here

- **D15 — Phaser 4.** 4.2.1, out since April 2026, with the same Tilemap API
  as 3.x and Tiled's formats; 3.90 (May 2025) is the end of its line. Pinned
  exactly; its TypeScript types come with the package.
- **D16 — One source for a level's map.** `level.json`'s rows of characters
  feed both the world and the scene, which draws them with placeholder
  tiles made at run time. Tiled arrives with the art (phase 4), when there
  are tiles to place; the world will read the `.tmj` then, and the rows of
  characters will go. Two files describing one map would drift.
- **D17 — CodeMirror 6**, `codemirror@6.0.2` with `@codemirror/lang-python@6.2.1`,
  as planned (D5); pinned exactly, with whatever `@codemirror/*` packages
  they pull in left to the lock file.
- **The scene speaks only through the DOM.** Everything a test or a person
  needs to know (the tick being played, where the wizard is, the outcome) is
  in the page, in text and `data-*` attributes; nothing is read from the
  canvas.
- **The level texts** (title, goals, starting code) arrive now, as
  `text.<lang>.json` beside `level.json`, since the goals panel needs words
  to show: a piece of 2.1 pulled forward.

Each goes in `architecture.md`'s log, dated by `date -I`.

## 2. Versions

| Package | Version |
|---|---|
| phaser | 4.2.1 |
| codemirror | 6.0.2 |
| @codemirror/lang-python | 6.2.1 |

Checked against npm on 2026-10-20; the implementer checks again the day
they are added and records them in `architecture.md`'s table.

## 3. Repository layout after the sprint

```
app/src/
  engine/
    scene.ts          LevelScene: the map, the wizard, the playback of events
    placeholders.ts   the tiles and the wizard drawn at run time, until the art
    playback.ts       Playback: ticks, speed, pause, stop, reset; no Phaser in it
    playback.test.ts
  editor/
    editor.ts         CodeMirror: Python, four spaces, the running line, the error line
  ui/
    level.ts          the level screen: scene, editor, goals, buttons, outcome
    goals.ts          the goals panel
    outcome.ts        what a run came to, in the child's words where there are any
  content/
    levels.ts         loading a level's level.json and text.<lang>.json
  sandbox/            (1.8) what keeps the child's code to the game
world/kydux_world/
  sandbox.py          (1.8) the import hook
content/levels/01-the-corridor/
  level.json  text.en.json  text.es.json  solution.py  wrong/
tools/i18n_check.py   extended to the levels' texts
app/e2e/level.spec.ts replaces playground.spec.ts
```

`app/src/ui/playground.ts` and `playground.spec.ts` are deleted in 1.6;
`kydux_world.run.run_script` stays, as the plain runner the lessons' *try
it* blocks will use (plan, 3.4).

## 4. The pieces

### 1.3 The scene, and the playback of events

**Dependencies.** `npm install --save-exact phaser@4.2.1`. The engine is
loaded by a dynamic `import()` from the level screen, so the page and its
loading line appear before Phaser's megabyte arrives.

**`engine/playback.ts`**, without Phaser, tested with Vitest:

```ts
export interface PlaybackEvent { tick: number; actor: string; kind: string; data: Record<string, unknown>; line: number | null }
export type PlaybackState = 'idle' | 'playing' | 'paused' | 'done';
export class Playback {
  constructor(opts: { tickMs: number; now?: () => number; schedule?: (cb: () => void, ms: number) => unknown; cancel?: (handle: unknown) => void });
  load(events: PlaybackEvent[]): void;          // state idle, tick 0
  play(): void; pause(): void; stop(): void;     // stop: state done at the current tick
  reset(): void;                                 // tick 0, idle
  setSpeed(multiplier: 1 | 2 | 4): void;         // takes effect from the next tick
  readonly tick: number; readonly state: PlaybackState; readonly length: number;
  onTick(cb: (tick: number, event: PlaybackEvent | null) => void): () => void;   // tick 0 with null, then each event
  onState(cb: (state: PlaybackState) => void): () => void;
}
```

One tick per event, in order, each `tickMs / speed` after the last; `done`
after the last event. `now`, `schedule` and `cancel` default to
`performance.now`, `setTimeout` and `clearTimeout` and are injected by the
tests, which play a run of events with fake timers and check the ticks,
the speed change, pause and resume, stop, and reset.

**`engine/placeholders.ts`.** Textures drawn once per scene with Phaser's
`Graphics` into a `RenderTexture` or `generateTexture`: a 48×48 floor tile
(two greys, a thin darker border), a wall tile (darker, a lighter top
edge), a marker tile (floor with a coloured ring, one colour per marker
letter from a short list), and the wizard: a 36×44 figure, blue robe,
pointed hat, drawn for the four facings (the hat's brim shifts). Nothing
is loaded from a file: there is no art yet.

**`engine/scene.ts`.** `class LevelScene extends Phaser.Scene`, created by
`startScene(parent: HTMLElement, level: LevelJson): Promise<SceneHandle>`:

- The map: `this.make.tilemap({ data, tileWidth: 48, tileHeight: 48 })`
  from the level's rows, with a tileset from the placeholder textures; a
  layer for floor and walls, markers drawn over their tiles. The camera
  fits the map in the parent (`Phaser.Scale.FIT`, `autoCenter`), the canvas
  sized to the parent and re-sized with it.
- The wizard: a sprite at the start tile, facing down.
- `SceneHandle`: `playback: Playback`, `load(result: WorldResult)`,
  `reset()`, `destroy()`. `load` resets the scene and gives the events to
  the playback; the scene listens to `onTick`: a `move` tweens the sprite
  from its tile to the next over the tick's duration and sets the facing;
  a `bump` turns the sprite and nudges it a few pixels against the wall and
  back; a `say` shows the text in a bubble over the wizard for three ticks;
  `reset` puts the wizard back at the start.
- The scene writes to its parent at every tick: `data-tick` and
  `data-wizard="x,y"` (the tile the wizard stands on after the event), and
  `data-state` with the playback's state. The tests read those.

`tickMs` is 400 at speed 1.

**Done when** a Vitest suite covers `Playback`; the scene shows the
corridor with the wizard at `S` on the page (wired by 1.6; until then, a
temporary mount in `main.ts` behind `#scene` is fine and goes in 1.6); the
types check; `npm run build` warns of nothing.

### 1.4 The editor

`npm install --save-exact codemirror@6.0.2 @codemirror/lang-python@6.2.1`.

**`editor/editor.ts`** exports:

```ts
export interface Editor {
  getDoc(): string; setDoc(text: string): void;
  setRunningLine(line: number | null): void;   // a highlighted line and a gutter mark
  setErrorLine(line: number | null): void;      // a red underline on the line and a gutter mark
  focus(): void; destroy(): void;
}
export function createEditor(parent: HTMLElement, opts: { doc: string; onChange?: (doc: string) => void; onCast?: () => void }): Editor;
```

Extensions: `python()`, line numbers, history, bracket matching and
closing, `indentUnit` of four spaces, `indentWithTab`, `EditorState.tabSize`
4, a highlight for the active line, `Ctrl-Enter` and `Cmd-Enter` calling
`onCast`. The running line and the error line are `StateField`s holding a
line decoration and a gutter marker each, set through `StateEffect`s. A
theme in `style.css` through the editor's class names: 17px monospace,
the brand's colours, a gutter wide enough for three digits. The editor
is kept editable during a run; a change after a run clears both lines.

**Done when** the editor holds the corridor's starting code with Python
colours, Tab indents by four, `Ctrl-Enter` calls back, the two lines show
and clear; `createEditor` is exercised by the browser test of 1.6.

### 1.5 The goals panel and the outcome

**`ui/goals.ts`.** `goalsPanel(goals: { text: string }[]): { node; setMet(index, met: boolean); reset() }`:
a list, each goal with a mark that is empty, ticked (`met`) or crossed
(`failed`, used from phase 2), its text from the level's `text.<lang>.json`
(1.6). Rendered above the scene's corner as an overlay, readable over the
placeholder tiles.

**`ui/outcome.ts`.** `outcome(result: WorldResult | null, runStatus): { node; set(...) }`:
a card under the editor that says, through `t()`, one of:

| status | key | English |
|---|---|---|
| won | `outcome.won` | You did it! |
| incomplete | `outcome.incomplete` | Not yet: {n} of {total} goals met. Try again. |
| too_many_ticks | `outcome.too_many_ticks` | The wizard is tired: the spell ran more than {limit} steps. Is there a loop that never ends? |
| interrupted | `outcome.interrupted` | The spell was stopped: it was running for more than {seconds} seconds. |
| error | `outcome.error` | Python says: {type}: {message} (line {line}) |
| error, no line | `outcome.error_no_line` | Python says: {type}: {message} |

The raw Python stays for now; the children's words come in 2.4. The card's
colour follows the status. While a run plays, the card is hidden and shows
when the playback is done or at once for an error with no events.

**Done when** both are pure DOM, exercised by the browser test of 1.6.

### 1.6 The corridor, played

**Level texts.** `content/levels/01-the-corridor/text.en.json` and
`text.es.json`:

```json
{ "title": "The corridor",
  "goals": ["Reach the door at the end of the corridor."],
  "starting_code": "# Walk to the door.\n# The wizard moves one tile per step.\nwizard.move_right()\n" }
```

(Spanish: "El pasillo", "Llega a la puerta del final del pasillo.", "# Camina
hasta la puerta.\n# El mago avanza una casilla por paso.\nwizard.move_right()\n".)
`goals` is parallel to `level.json`'s `goals`. **`tools/i18n_check.py`**
gains: for every `content/levels/*/`, a `text.<lang>.json` for every
language in `i18n/`, with the same keys in each, and as many `goals` as
`level.json` has; and `pack-world.mjs` ships `text.*.json` with `level.json`.

**`content/levels.ts`.** `loadLevel(id, lang): Promise<{ level: LevelJson; text: LevelText }>`
fetching both from `content/levels/<id>/`; a missing text falls back to
English with a `console.warn`.

**`ui/level.ts`, the level screen.** Replaces the playground in `main.ts`,
reached by the URL hash `#level/<id>` (the page without a hash goes to
`#level/01-the-corridor`). Layout at 1280×720 and up, in `style.css`:

```
+------------------------------------------+-------------------------------+
| [goals panel]                            |  <editor>                     |
|                                          |                               |
|               <scene>                    |                               |
|                                          |                               |
|                                          | [Cast] [Stop] [Restart]  1x ▾ |
| status line (Python ready / running…)    | [outcome card]                |
+------------------------------------------+-------------------------------+
```

- **Cast** (`level.cast`): the editor's text to `runtime.run(code, level)`;
  the result's `world` to the scene's playback, which plays at once; the
  goals panel ticks goal *i* at tick `met_at_tick`; the editor's running
  line follows the event's `line` at every tick; the outcome shows when
  the playback is done. An `error` with events plays them, then marks the
  error line and shows the outcome. Disabled while Python loads or runs.
- **Stop** (`level.stop`): during a run, `runtime.interrupt()`; during
  playback, `playback.stop()`.
- **Restart** (`level.restart`): `playback.reset()`, the scene to the start,
  goals and outcome cleared, the editor's lines cleared.
- **Speed** (`level.speed`): a select, 1×, 2×, 4×, remembered in
  `localStorage` as `kydux.speed`.
- The status line (`level.loading`, `level.ready`, `level.running`,
  `level.restarting`, `level.failed`, from the playground's keys renamed)
  and the isolation line move to a footer, small.
- The title (`text.title`) above the scene; the page's `<title>` is
  `Kydux — The corridor`.
- The language switch re-renders the screen with the other language's
  texts, keeping the editor's document (unless it is still the starting
  code, which switches too) and the last result.
- The editor's document is kept in `sessionStorage` under the level's id,
  so a reload does not lose it (progress proper is phase 3).

**Keyboard.** `Ctrl-Enter` casts from the editor; the buttons are real
buttons, focusable.

**`app/e2e/level.spec.ts`** replaces `playground.spec.ts` (deleted with
`ui/playground.ts` and its keys): the page opens on the corridor, the
scene's parent has `data-wizard="1,1"`; the starting code is in the
editor; Cast with the starting code (one step) plays one tick and ends
`incomplete` with the wizard at `2,1`; replacing the code with
`wizard.move_right(6)` and Cast at 4× ends `won`, the goal ticked, the
wizard at `7,1`, the outcome saying so; `wizrd.move_right(6)` shows the
Python error with line 1 and the error line marked in the editor; `while
True: wizard.say("hi")` ends `too_many_ticks` with its message; `while
True: pass` ends `interrupted` within ten seconds and Cast works again;
Restart puts the wizard back at `1,1`; the Spanish context sees the
Spanish title, goal and starting code, and switching to English changes
them. The `data-*` attributes and the DOM carry all of it.

**Done when** the browser suite passes, `ci/check.sh --e2e` is green, the
playground and its keys are gone, and `tools/i18n_check.py` reports no
unused key.

### 1.7 The run's edges

Small things the skeleton must get right before it grows:

- A **second Cast during a run** is impossible (button disabled) and a
  Cast during playback stops the playback first.
- **Python failing to load** (`failed`): the outcome card says
  `level.failed` with a *Reload* button (`level.reload`).
- **A level that does not load** (bad id in the hash, a 404): the screen
  says `level.not_found` with the id, and offers the corridor.
- **A worker crash** (`crashed`): shown as an error outcome with the
  message, Cast enabled again.
- **The restart after an interrupt** while the page is not isolated: the
  status line shows `level.restarting`, Cast disabled until ready.
- **Resize**: the scene follows its parent; the editor too.

Each with a browser test where the browser is needed (the 404, the
interrupt path over plain HTTP with `KYDUX_HTTP=1` in a second Playwright
project), a Vitest where not.

### 1.8 Hardening the sandbox (D14)

- **Content-Security-Policy**, sent by the dev and preview servers
  (`vite.config.ts`, with the isolation headers) and written in
  `docs/dev/architecture.md` for the launcher to send too:
  `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self';
  connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline';
  font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`.
  `'unsafe-inline'` for styles is what CodeMirror and Phaser need; nothing
  else is inline. A `<meta http-equiv>` copy in `index.html` is not added:
  the headers are the one source, and a meta tag cannot carry
  `frame-ancestors`.
- **`kydux_world/sandbox.py`**: `install()` puts a finder first on
  `sys.meta_path` that raises `ImportError("the spell book has no chapter
  called js")` for `js`, `pyodide`, `pyodide_js`, `_pyodide`, `micropip`,
  `pyodide.ffi` and anything under them; and removes those already in
  `sys.modules` from the child's reach by the same finder (an `import`
  looks in `sys.modules` first, so the names that Pyodide imported are
  deleted from it after the world is loaded, except `_pyodide`'s internals
  the runtime itself needs, which are left and only blocked at import).
  The worker calls it once after loading. The message is mapped to the
  child's words in 2.4; for now its English goes through `outcome.error`.
  Tests under CPython: the finder blocks the names and leaves `json`,
  `math`, `random` alone; a test in the worker's browser suite: `import js`
  in the editor shows the ImportError.
- **The worker's answers checked**: `runtime.ts` accepts a `result` only
  with the shape of `RunResult` (a hand-written `isRunResult`), and a
  `world` only with `status` in the known set, `events` an array of
  objects with `tick`, `kind` and `data`, and `goals` an array; anything
  else becomes a `crashed` with a message. A Vitest each.
- **The CSP seen working**: a browser test that `fetch('https://example.com/')`
  from the page rejects, and that the page still loads Pyodide and runs.

**Done when** the tests pass and the headers are in `architecture.md`.

## 5. Documents

- `architecture.md`: D15–D17, the versions, the CSP, and *Parts* updated
  with `engine/`, `editor/`, `content/`, `sandbox`.
- `plan.md`: 1.3's text says the map comes from `level.json` until phase 4
  (D16), and 2.1 says the level texts exist from sprint 2.
- `dev-environment.md`: how to open a level by its hash, and that the
  speed and the editor's text are kept in the browser.
- The playground's keys removed from `i18n/`; the new keys in both
  languages; `tools/i18n_dynamic.txt` unchanged.

## 6. Acceptance test (for when the owner tries it)

1. `https://hija.local:5173` opens the corridor: the scene with the wizard
   at the left end, the goal above it, the editor with the starting code.
2. *Cast* with the starting code: the wizard takes one step, the goal stays
   empty, the card says one of one goals is not met.
3. `wizard.move_right(6)`, *Cast*: the wizard walks to the door, the line
   stays lit in the editor while it walks, the goal ticks as it arrives,
   the card says *You did it!*. The speed select makes it faster.
4. `wizrd.move_right(6)`: the card shows the Python error with its line,
   the line is marked in the editor; fixing it clears the mark.
5. `while True: wizard.say("hi")`: the wizard says *hi* a hundred times at
   4×, and the card says the spell ran too many steps.
6. `while True: pass`: stopped after five seconds, with its message; *Cast*
   works again.
7. The language switch changes the title, the goal, the starting code and
   every word on the screen; the code typed stays.
8. `import js` in the editor: an ImportError, in the card.

## 7. How the implementer works

As in sprint 1, section 7: one piece at a time, `ci/check.sh --e2e` green
and a local commit per piece named after it (`1.3: the scene and the
playback`), never a push; everything for the player through `t()`; what
this document leaves open decided the simplest way and said in the commit;
what turns out wrong done the working way and logged in `architecture.md`;
a short report to the owner in Spanish at the end, with what differs.
