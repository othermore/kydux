# Sprint 62 — The code stays in sight, and the game asks its own questions

Planned by the designer on 2026-11-26, at the review of sprint
61 (`c79dfc1..690ef68`, accepted). It is a sprint of
corrections: two things the review found on the level's screen,
neither of them a fault of sprint 61's pieces. No text of the
course changes, no level, no scene, no picture.

**Where it is today** (commit `690ef68`).

- *The editor's column* (`.workbench`, `app/src/ui/level.ts`)
  holds, from the top: the two lists (D346), the editor, the
  two rows of buttons (D351), the hints' box and the answer
  (the outcome's card). `.editor` is `flex: 1; min-height: 0`
  (`app/src/style.css`); the hints' box and the answer take the
  height their words ask and never give any back. So the editor
  gives all it has, down to nothing. Measured in Spanish on the
  built game, a program that ends in an error and then each
  hint, the editor's height in px (a line of code is 22.4 px):

  | window, level | start | answer | + hint 1 | + hint 2 | + hint 3 |
  |---|---|---|---|---|---|
  | 1024 × 700, `the-check` | 449 | 309 | 169 | 57 | 0 |
  | 1024 × 700, `eldras-door` | 449 | 281 | 140 | 55 | 0 |
  | 1280 × 800, `the-check` | 546 | 406 | 293 | 208 | 94 |
  | 1280 × 800, `eldras-door` | 546 | 405 | 291 | 206 | 120 |

  At 1024 × 700 with three hints the hints' box is 385 px high,
  the answer's foot lies at 719 px of the window's 700, and the
  page scrolls. The hints taken are kept (`progress.setHints`),
  so a level opened again with its three hints starts with an
  editor of some 64 px before any run. The two lists and the
  second row of buttons, which sprint 61 added, take some 90 px
  of the column; before them the same case left the editor about
  three lines.
- *The marked line.* `editor.setErrorLine` marks the line an
  answer names (`.cm-kydux-error-line`) and does not bring it
  into sight. In `the-check` the answer names line 8; with the
  editor at four lines, the child sees lines 1 to 4.
- *The browser's own box.* Two questions are asked with
  `window.confirm`: deleting a saved game
  (`app/src/ui/start.ts`, `start.delete_confirm`) and leaving a
  level by the map while its program runs
  (`app/src/ui/level.ts`, the map's `onGo`, `map.leave_run`).
  *Original* asks in the game's own dialog (`app/src/ui/ask.ts`,
  D351). They are the only two calls of a browser's dialog in
  `app/src`.

## 1. Decisions taken here

Both are in `docs/dev/architecture.md` in full.

- **D363 — The editor keeps five lines of code under the hints
  and the answer.** A hint is read to change the code, and an
  answer names a line of it: they are seen together. With the
  two panes side by side (a page wider than 800 px) the editor
  is never lower than 7.6 times the code's letter times `--fit`
  (five lines and its frame: 122 px at 16 px). The hints' box
  gives way: it takes what is left between the buttons and the
  answer, never under four times the code's letter, scrolls
  inside itself, stands on the newest hint, and fades at an edge
  past which more hints lie. The answer stays whole. In a window
  too low even for that, the editor's column scrolls inside the
  level; the page never grows past the window. The line an
  answer marks is brought into the editor's sight when the
  answer shows and whenever the editor's height changes while
  the line is marked. A page 800 px wide or less keeps its
  layout.
- **D364 — The game asks every question in its own dialog,
  never in the browser's.** Deleting a saved game and leaving a
  level by the map while its program runs ask through
  `ui/ask.ts`. No code of the game calls `window.confirm`,
  `window.alert` or `window.prompt`, and a test of the project
  holds it.

## 2. What is asked

### 2.1 The editor's column (D363)

All of it inside `@media (min-width: 801px)`, in
`app/src/style.css`, beside the rules of D359 or in a block of
its own with a comment that names D363. The values below were
tried on the built game by adding them to the page, and give
the numbers of the table that follows.

```css
.editor {
  min-height: calc(var(--editor-font-size, 16px) * 7.6 * var(--fit, 1));
}

.hints {
  flex: 0 1 auto;
  min-height: calc(var(--editor-font-size, 16px) * 4 * var(--fit, 1));
  overflow-y: auto;
}

.workbench {
  overflow-y: auto;
}

.program-lists,
.buttons,
.outcome {
  flex-shrink: 0;
}
```

`.editor` keeps its `flex: 1; min-height: 0` outside that block,
for the narrow page, where it is 260 px high.

With them, measured as above (the editor's height in px and in
lines of code; the hints' box; the newest hint whole or not;
the page never scrolls and the column never scrolls in any of
these):

| window, letter, level | answer | + hint 1 | + hint 2 | + hint 3 | hints' box at 3 |
|---|---|---|---|---|---|
| 1024 × 700, 16 px, `the-check` | 309 | 169 | 122 (5.3) | 122 (5.3) | 180, newest (137) whole |
| 1024 × 700, 16 px, `eldras-door` | 281 | 140 | 122 | 122 | 151, newest (82) whole |
| 1280 × 800, 16 px, `the-check` | 406 | 293 | 208 | 122 | 277, newest whole |
| 900 × 600, 16 px, `the-check` | 260 | 136 | 104 (5.3) | 104 (5.3) | 148, newest (116) whole |
| 1024 × 768, 16 px, `the-check` | 377 | 237 | 125 | 122 | 248, newest whole |
| 1024 × 700, 24 px, `the-check` | 287 | 182 (5.4) | 182 | 182 | 96, newest's first lines |

**The hints' box** (`renderHints` in `app/src/ui/level.ts`).

- *It stands on the newest hint.* After the hints are drawn,
  and once the box is laid out in the page (a level that opens
  with hints kept draws them before it is in the page), the
  box's `scrollTop` is set so that the newest hint's top lies
  at the box's top padding. The browser holds it to the most it
  can scroll, so a newest hint lower than the box ends at the
  box's foot with the end of the hint before it over it. Set
  `scrollTop`; never `scrollIntoView`, which may scroll the
  page.
- *Its edges fade where more lies.* The box has the class
  `more-above` while `scrollTop > 0` and `more-below` while
  `scrollTop + clientHeight < scrollHeight - 1`, set when the
  hints are drawn, on the box's `scroll` and when its height
  changes (a `ResizeObserver` on the box). In the style, as the
  lists' rows fade (`.chips-strip.fade-before`), 18 px:

  ```css
  .hints.more-above {
    mask-image: linear-gradient(to bottom, transparent 0, #000 18px);
  }

  .hints.more-below {
    mask-image: linear-gradient(to top, transparent 0, #000 18px);
  }

  .hints.more-above.more-below {
    mask-image: linear-gradient(to bottom, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%);
  }
  ```
- *It is reached by the keys.* A box that scrolls has
  `tabindex="0"` while one of the two classes is on it, and
  none otherwise, so that the arrows scroll it; its
  `aria-live="polite"` stays.

**The marked line** (`app/src/editor/editor.ts`,
`app/src/ui/level.ts`).

- `Editor` gains `showLine(line: number): void`: it
  dispatches `EditorView.scrollIntoView(position, { y:
  'nearest', yMargin: <one line's height> })` for the start of
  that line, and does nothing for a line the document does not
  have. It moves neither the cursor nor the focus.
- The level's screen calls it for the line of an error when the
  answer is shown, after the answer's card is in the page and
  laid out (the editor is lower by then), and again whenever
  the editor's height changes while an error's line is marked:
  one `ResizeObserver` on the editor's parent, disconnected
  when the level is destroyed. The running line is not
  followed (2.5).

Nothing else of the column changes: the lists, the buttons and
the answer keep their sizes, and at the start of a level every
number of `app/e2e/screens.spec.ts` holds (eight lines or more
at 1024 × 700).

### 2.2 The two questions (D364)

**Deleting a saved game** (`app/src/ui/start.ts`). *Borrar*
opens `ask(document.body, …)` with the question
`start.delete_confirm` as it is, and the two new labels of
section 4. *Yes* deletes as today; *No* and Escape do nothing,
and the focus goes back to the game's *Borrar* (`ask` does it).
One question at a time: while one is open, a second *Borrar*
asks nothing. The start screen's `destroy` dismisses an open
question, as the level's does for *Original*'s.

**Leaving by the map while a program runs**
(`app/src/ui/level.ts`, the map's `onGo`). With
`controller.snapshot.canStop` true, a stop chosen opens
`ask(document.body, …)` with `map.leave_run` as it is and the
two new labels, over the map's window (`.ask-overlay` is above
`.map-overlay`). *Yes* closes the map and goes, as today. *No*
and Escape close the question alone: the map's window stays
open, and the program has gone on running all the while, which
the browser's box does not allow. A run that ends while the
question is open changes nothing: the question waits for its
answer. One question at a time; closing the level dismisses it.
With no program running, a stop chosen goes at once, as today.

**No browser dialog.** After this, `app/src` holds no
`window.confirm`, `window.alert` nor `window.prompt`. `ask.ts`'s
head comment names the three questions it asks, in the present.

### 2.3 The tests

- **`app/e2e/screens.spec.ts`**, a block in Spanish
  (`test.use({ locale: 'es-ES' })`), for 1024 × 700, 1280 × 720
  and 900 × 600, in `the-check`, whose starting program ends in
  an error on line 8: *the code stays in sight under the hints
  and the answer (D363)*. Run the starting program at speed 4
  and wait for the answer; then take each of the three hints.
  After the answer and after each hint:
  - `.cm-scroller`'s height over a `.cm-line`'s computed line
    height is 5 or more;
  - the answer (`.outcome`) lies inside the window, and its
    `scrollHeight` is its `clientHeight`;
  - `document.documentElement.scrollHeight` is the window's
    height, and `.workbench`'s `scrollHeight` is its
    `clientHeight`;
  - the newest `.hint`'s top is at or under the box's top, and
    its first line (the top plus one line's height) over the
    box's foot;
  - `.cm-kydux-error-line`'s box lies inside `.cm-scroller`'s.

  After the third hint at 1024 × 700: `.hints` has `more-above`
  and not `more-below`; scrolled to its top by the test, it has
  `more-below` and not `more-above`. After the first hint at
  1280 × 720 it has neither, and no `tabindex`. A screenshot of
  the state with three hints is saved as
  `app/e2e/shots/workbench-<width>x<height>.png`.

  Then the page is reloaded and the level opened again: three
  hints are shown, the editor has five lines or more, and the
  newest hint's first line is in sight.
- **The same block, the largest letter.** At 1024 × 700 with
  the code's letter at 24 px (the settings' largest), the same
  steps: the editor has five lines or more, the page's
  `scrollHeight` is the window's height, the answer lies inside
  the window.
- **`app/src/editor/editor.test.ts`**: `showLine` dispatches a scroll for a line of
  the document, moves no selection, and does nothing for line 0
  and for a line past the end.
- **`app/e2e/start.spec.ts`**, the test that deletes *Leo*: the
  page throws on any browser dialog (`page.on('dialog', …)` as
  `program.spec.ts` does); *Delete* opens `#ask` with
  `Delete the game “Leo”? It cannot be brought back.`, *No, keep
  it* focused; Escape closes it and the two games stay, the
  focus on *Leo*'s *Delete*; *Delete* again and *No, keep it*:
  two games; *Delete* again and *Yes, delete*: one game, and
  the heading still `Hello, Marta`.
- **`app/e2e/map.spec.ts`**, a new test: *leaving by the map
  while a program runs asks in the game's own dialog (D364)*.
  In `the-long-corridor` at speed 1, `wizard.move_right(8)`
  run, the map opened once *Parar* is enabled. The page throws
  on any browser dialog. A click on the stop
  `story:the-letter` opens `#ask` with `Your program is still
  running. Leave the level?`; Escape closes the question, the
  map's window is still there and the address is the level's;
  the same click and *No, stay*: the same; the map closed, the
  program goes on to its win card (the run was never held).
  Then a second run, the map, the stop, *Yes, leave*: the
  address is `#story/the-letter`. In Spanish, one check of the
  question's three texts.
- **`tests/project/test_dialogs.py`**: no file under `app/src`
  but a test (`*.test.ts`) holds `confirm(`, `alert(` or
  `prompt(` as a call (`\b(confirm|alert|prompt)\s*\(`), with a
  docstring that names D364.
- **`tools/i18n_check.py`** and the catalogues' tests pass with
  the four new keys in both languages.

### 2.4 What the owner will try

On the owner's own server (`npm run dev`, port 5173), in
Spanish, in a window of 1024 × 700 or the laptop's own.

1. Open *La revisión* (chapter 4, *Arreglo 1*) with `?debug`
   from the map. Press *Ejecutar* with the program as it comes.
   The answer names line 8, and line 8 is seen in the editor,
   marked.
2. Press *Pista* three times. After each one: the code is still
   seen, five lines or more; the newest hint is read from its
   first word; the answer under it is whole; the page does not
   scroll. With three hints, the top of the hints' box fades,
   and the wheel over it brings the first hint back.
3. Open the map and come back to the level by its own stop. The
   three hints are there, the newest in sight, and the code has
   its five lines.
4. In the settings, put the code's letter at 24 px and look at
   the same level: five lines of code, the hints' box lower.
   Put it back at 16 px.
5. In *El pasillo largo* (chapter 1), write
   `wizard.move_right(8)`, put the speed at 1×, press
   *Ejecutar*, open the map and click another stop. The game
   asks in its own box, *Tu programa todavía se está
   ejecutando. ¿Salir del nivel?*, and the wizard keeps walking
   behind it. *No, quedarme* leaves the map open; *Sí, salir*
   goes.
6. On the start screen, with two saved games, press *Borrar* on
   one. The game asks in its own box, with the game's name.
   *No, conservarla* keeps it; *Sí, borrar* deletes it.

### 2.5 What is left out, and why

- *Older hints folded to their headings.* It hides what a child
  reads again behind a click, and changes how the hints look;
  the box that scrolls keeps them as they are (D363).
- *The running line followed while a program runs.* A child may
  be reading another part of the code while it runs; following
  the line is the owner's to ask.
- *The answer made shorter.* Its texts are the course's, written
  and corrected; the column makes room for them.
- *The narrow page* (800 px or less), which scrolls as a whole.

## 3. The pieces

One commit each, `62.<n>: …`, with `ci/check.sh` and the specs
a piece touches green before it, in a copy of the repository
(the owner's server on port 5173 runs from the main tree: no
build and no world packed there). The whole `ci/check.sh --e2e`
once, in a copy, before the last commit.

### 3.1 The editor's column (D363; 2.1)

`app/src/style.css`, `app/src/ui/level.ts`,
`app/src/editor/editor.ts` and its test,
`app/e2e/screens.spec.ts`. Before the commit: the block of 2.3
green at the three sizes and at 24 px, `hints.spec.ts`,
`program.spec.ts`, `lists.spec.ts`, `cards.spec.ts` and the
whole of `screens.spec.ts` green, and the three screenshots
`workbench-*.png` looked at: five lines of code, the newest
hint from its first word, the answer whole.

### 3.2 The two questions (D364; 2.2)

`app/src/ui/start.ts`, `app/src/ui/level.ts`,
`app/src/ui/ask.ts` (its comment), `i18n/es.json`,
`i18n/en.json`, `app/e2e/start.spec.ts`, `app/e2e/map.spec.ts`,
`tests/project/test_dialogs.py`. Before the commit:
`start.spec.ts`, `map.spec.ts`, `program.spec.ts` and
`leaving.spec.ts` green.

### 3.3 The documents, the whole check, the report

- `docs/dev/architecture.md`: D363 and D364 are written; where
  another entry or a document says how a question is asked or
  what the editor's column holds (D38, D351, D352, the entries
  on the saved games' *Delete*, `app/e2e/README.md`), it says
  the present state. `docs/dev/plan.md` names sprint 62's decisions.
- The whole `ci/check.sh --e2e` in a copy.
- The report in Spanish to the owner, with the three
  `workbench-*.png` pictures and one of each question, and the
  prompt in English for the reviewer.

## 4. The texts, and Gemini

No Gemini work. Four labels, too small to brief, written here:

| key | Spanish | English |
|---|---|---|
| `start.delete_yes` | Sí, borrar | Yes, delete |
| `start.delete_no` | No, conservarla | No, keep it |
| `map.leave_yes` | Sí, salir | Yes, leave |
| `map.leave_no` | No, quedarme | No, stay |

The two questions keep their words (`start.delete_confirm`,
`map.leave_run`).

## 5. The prompt for CLAUDE-programmer

The owner clears the programmer's context (`/clear`) before
giving it.

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

This is sprint 62, a small sprint of corrections planned by the
designer at the review of sprint 61, which is accepted. Two
things: on the level's screen the editor keeps five lines of
code whatever the hints and the answer take under it, the hints'
box scrolls and stands on the newest hint, and the line an
answer names is brought into sight (D363); and the two questions
still asked in the browser's own box, deleting a saved game and
leaving a level by the map while its program runs, are asked in
the game's own dialog (D364). No text of the course, no level,
no scene and no picture changes. Build on the last commit of
main as you find it.

Read first: CLAUDE.md, .claude/working-model.md,
docs/dev/README.md, docs/dev/sprint-62.md (this plan, whole: it
leaves nothing for you to design), and in
docs/dev/architecture.md D38, D228, D346, D351, D352, D359,
D363 and D364. Then your memory notes kydux-sprint-61-state,
kydux-checks-per-piece, kydux-report-images-current,
kydux-no-co-authored-by, kydux-docs-present-tense,
kydux-commit-by-path-shared-tree and kydux-dev-server-build.
Then the code: app/src/ui/level.ts (the workbench's parts,
renderHints, the map's onGo, how Original asks),
app/src/ui/ask.ts, app/src/ui/start.ts, app/src/editor/editor.ts,
app/src/style.css (.workbench, .editor, .hints, .outcome, the
block of D359, .chips-strip's fades), and the specs
app/e2e/screens.spec.ts, hints.spec.ts, start.spec.ts,
map.spec.ts and program.spec.ts.

Build the three pieces of section 3 in order, one commit each
(62.1, 62.2, 62.3), by path (git commit -m ... -- <files>), with
no Co-Authored-By line nor any other attribution. Before each
commit, ci/check.sh and the specs the piece touches are green in
a copy of the repository; the whole ci/check.sh --e2e runs once,
in a copy, before the last commit. The numbers of section 2.1's
second table are what the style of 2.1 gave on the built game:
if yours differ by more than a few pixels, find why before going
on.

Limits: nothing pushed, no timer, nothing published or deployed.
The owner's development server on port 5173 is never stopped,
and nothing is built nor packed in the main tree's app/ while it
runs. nginx is never touched. No Gemini work and no painting.
Never run a formatter over app/.

What decides: the plan. Where the plan does not say, ask the
owner; what the owner decides differently becomes a decision
from D365 on, written in docs/dev/architecture.md.

Hand over, in Spanish to the owner: what was built piece by
piece, what differs from the plan and why, the pictures
(workbench at the three sizes with three hints, the two
questions), the whole check's result, and what the owner will
try, in the order of the plan's 2.4. Then the prompt in English
for the reviewer, and whether it is a good moment to clear each
agent's context.
```
