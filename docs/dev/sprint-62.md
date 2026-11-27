# Sprint 62 — The code stays in sight, and the game asks its own questions

Planned by the designer on 2026-11-26, at the review of sprint
61 (`c79dfc1..690ef68`, accepted). It is a sprint of
corrections: two things the review found on the level's screen,
neither of them a fault of sprint 61's pieces, and two things
the owner asked for on reading the review: *Creo que tenemos
que hacer algo para que las pistas y la salida/errores al
ejecutar el programa se puedan plegar y no tapen el código o lo
dejen sin espacio. Y el enlace de la familia Kidux del pie se
puede quitar ya que está arriba el de Kidux os.* The owner also
said yes to the editor following the line that runs, which the
review had left for them to ask. No text of the course changes,
no level, no scene, no picture.

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
- *The foot's link.* The foot of every screen (`chrome`,
  `app/src/main.ts`) says the version, the build and, at its
  right, *De la familia Kidux*, a link to Kidux's website
  (`familyLink`, `#family`, `app.family`, D338). The header of
  every screen has *Conoce Kidux OS*, a link to the same address
  (`kiduxLink`, D339).

## 1. Decisions taken here

The four are in `docs/dev/architecture.md` in full, and D338
and D339 say there what the foot and the header hold.

- **D363 — The hints and the answer fold, and the editor keeps
  five lines of code under them.** The fold is the owner's, the
  five lines the review's. The hints' box and the answer each
  have a button at their top right corner that folds them to
  one line and unfolds them: the hints' line says how many are
  taken, and the answer's is its first words, cut with an
  ellipsis. Nothing folds by itself. What is new unfolds: a
  hint taken unfolds the hints, a run's answer unfolds the
  answer; a level opens with both unfolded. Unfolded, with the
  two panes side by side (a page wider than 800 px), the editor
  is never lower than 7.6 times the code's letter times `--fit`
  (five lines and its frame: 122 px at 16 px). The hints' box
  gives way: it takes what is left between the buttons and the
  answer, never under four times the code's letter, scrolls
  inside itself, stands on the newest hint, and fades at an edge
  past which more hints lie. The answer unfolded is whole. In a
  window too low even for that, the editor's column scrolls
  inside the level; the page never grows past the window. The
  line an answer marks is brought into the editor's sight when
  the answer shows and whenever the editor's height changes
  while the line is marked. A page 800 px wide or less keeps its
  layout, and its boxes fold as well.
- **D364 — The game asks every question in its own dialog,
  never in the browser's.** Deleting a saved game and leaving a
  level by the map while its program runs ask through
  `ui/ask.ts`. No code of the game calls `window.confirm`,
  `window.alert` or `window.prompt`, and a test of the project
  holds it.
- **D365 — The game's foot says the version and the build, and
  holds no link.** The header's link to Kidux OS is on every
  screen (D339) and says the family (D338).
- **D366 — The editor keeps the line that runs in sight.** When
  the line that runs changes and its mark is not whole inside
  what the editor shows, the editor scrolls by the least that
  brings it in; a line in sight moves nothing. Neither the
  cursor nor the focus moves. When the run ends the editor
  stays where it is.

## 2. What is asked

### 2.1 The editor's column (D363)

Two things, and each stands without the other: the editor's
five lines, which hold with both boxes unfolded, and the fold,
which gives the child the rest of the column back.

**The five lines.** All of it inside `@media (min-width:
801px)`, in `app/src/style.css`, beside the rules of D359 or in
a block of its own with a comment that names D363. The values
below were tried on the built game by adding them to the page,
and give the numbers of the table that follows. The hints' box
(`section.hints`) holds the hints in a list of its own
(`div.hints-list`), which is what scrolls, so that the fold's
button stays at the box's corner while the hints scroll under
it.

```css
.editor {
  min-height: calc(var(--editor-font-size, 16px) * 7.6 * var(--fit, 1));
}

.hints {
  display: flex;
  flex-direction: column;
  flex: 0 1 auto;
  min-height: calc(var(--editor-font-size, 16px) * 4 * var(--fit, 1));
}

.hints-list {
  min-height: 0;
  overflow-y: auto;
}

.hints.folded {
  flex-shrink: 0;
  min-height: 0;
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

With them, measured as above with both boxes unfolded and the
hints' box as one scrolling block (the editor's height in px
and in lines of code; the hints' box; the newest hint whole or
not; the page never scrolls and the column never scrolls in any
of these). The fold's button takes 30 px of each box's width,
so a hint or an answer may wrap one line more than here and
the hints' box be some 25 px lower; the editor's numbers hold:

| window, letter, level | answer | + hint 1 | + hint 2 | + hint 3 | hints' box at 3 |
|---|---|---|---|---|---|
| 1024 × 700, 16 px, `the-check` | 309 | 169 | 122 (5.3) | 122 (5.3) | 180, newest (137) whole |
| 1024 × 700, 16 px, `eldras-door` | 281 | 140 | 122 | 122 | 151, newest (82) whole |
| 1280 × 800, 16 px, `the-check` | 406 | 293 | 208 | 122 | 277, newest whole |
| 900 × 600, 16 px, `the-check` | 260 | 136 | 104 (5.3) | 104 (5.3) | 148, newest (116) whole |
| 1024 × 768, 16 px, `the-check` | 377 | 237 | 125 | 122 | 248, newest whole |
| 1024 × 700, 24 px, `the-check` | 287 | 182 (5.4) | 182 | 182 | 96, newest's first lines |

**The hints' list** (`renderHints` in `app/src/ui/level.ts`).
The hints are drawn into `div.hints-list`, each a `p.hint` as
today; the box keeps its yellow ground, its border and its
`aria-live="polite"`.

- *It stands on the newest hint.* After the hints are drawn,
  and once the box is laid out in the page (a level that opens
  with hints kept draws them before it is in the page), the
  list's `scrollTop` is set so that the newest hint's top lies
  at the list's top. The browser holds it to the most it can
  scroll, so a newest hint lower than the list ends at its foot
  with the end of the hint before it over it. Set `scrollTop`;
  never `scrollIntoView`, which may scroll the page. The same
  when the box is unfolded.
- *Its edges fade where more lies.* The list has the class
  `more-above` while `scrollTop > 0` and `more-below` while
  `scrollTop + clientHeight < scrollHeight - 1`, set when the
  hints are drawn, on the list's `scroll` and when its height
  changes (a `ResizeObserver` on the list). In the style, as
  the lists' rows fade (`.chips-strip.fade-before`), 18 px:

  ```css
  .hints-list.more-above {
    mask-image: linear-gradient(to bottom, transparent 0, #000 18px);
  }

  .hints-list.more-below {
    mask-image: linear-gradient(to top, transparent 0, #000 18px);
  }

  .hints-list.more-above.more-below {
    mask-image: linear-gradient(to bottom, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%);
  }
  ```
- *It is reached by the keys.* A list that scrolls has
  `tabindex="0"` while one of the two classes is on it, and
  none otherwise, so that the arrows scroll it.

**The fold** (`app/src/ui/level.ts`, `app/src/ui/outcome.ts`,
`app/src/ui/icons.ts`, `app/src/style.css`; on every width of
page, outside the block of 801 px).

- *The button.* The hints' box and the answer's card each hold,
  as their last child, a button of the class `fold`
  (`#hints-fold`, `#outcome-fold`, `type="button"`), at the
  box's top right corner (`position: absolute; top: 5px; right:
  6px` in a box that is `position: relative` and keeps 44 px of
  padding at its right for it): 30 by 26 px, no ground, the
  box's own ink at 0.75 of its strength, whole and with a 1 px
  border of that ink under the pointer and with the focus. Its
  picture is a chevron drawn as the buttons' pictures are
  (`icons.ts`, 16 px, `currentColor`, a stroke of 2.4 with
  round ends, the path `M3.5 6l4.5 4.5L12.5 6`): it points down
  while the box is unfolded and to the right, turned by the
  style, while it is folded. It has `aria-expanded`, and its
  `title` and `aria-label` are the labels of section 4: *Plegar
  las pistas* / *Desplegar las pistas*, *Plegar la respuesta* /
  *Desplegar la respuesta*, in the language of the moment.
- *The hints folded.* The box has the class `folded`: the list
  is not shown, and a line stands in its place, `p.hints-folded`
  with `level.hints_folded`, *Pistas: 2 de 3*, in the weight of
  a hint's heading. The line is in the page only while the box
  is folded, so that the box's text is its hints' alone the rest
  of the time. The box is then one line high (43 px in the
  trial).
- *The answer folded.* The card has the class `folded`: its
  words (`.outcome-text`) stand on one line, `white-space:
  nowrap; overflow: hidden; text-overflow: ellipsis`, and what
  the code printed is not shown. The card keeps its kind's
  colour and is one line high (49 px in the trial). The words
  are the same node: nothing is written again.
- *A click on a folded box unfolds it*, anywhere on it; a click
  on an unfolded box does nothing but on its button, so that a
  child may select a hint's words. The pointer over a folded
  box is a hand.
- *What is new unfolds.* Taking a hint unfolds the hints' box,
  with the list standing on the new hint. An answer shown for a
  run (`snapshot.outcome !== shownOutcome` in the level's
  `render`) unfolds the card; an answer drawn again as it was
  (a change of language, `force`) keeps its fold. *Reiniciar*
  and a new run hide the card as today.
- *Nothing folds by itself*, whatever the room.
- *How long it lasts.* The two folds are the level's screen's
  own: a level opens with both boxes unfolded, the hints kept
  among them, and nothing of it is saved.
- *The answer that does not fold.* For `failed` (Python could
  not start) the card has no fold button and is unfolded: its
  button to load the page again stays in sight.
- `OutcomeCard` gains what the level needs for it (`unfold()`,
  or a parameter of `show`): the card's own module keeps the
  button and the class.

The fold was tried on the built game, by adding the two
buttons and the styles above to the page, in `the-check` with
its starting program run (an error on line 8) and three hints.
The editor's height in px and in lines of code:

| window | both unfolded | hints folded | both folded | answer folded |
|---|---|---|---|---|
| 1024 × 700 | 122 (5.3) | 231 (10.2) | 339 (15.1) | 122 (5.3), hints' box 261 |
| 1280 × 800 | 122 (5.3) | 355 (15.8) | 436 (19.4) | 152 (6.7), hints' box 327 |

The page and the column scroll in none of them, and the
answer's foot does not move.

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
  the editor's height changes while an error's line is marked,
  a box folded or unfolded among the changes: one
  `ResizeObserver` on the editor's parent, disconnected when
  the level is destroyed.
- *The line that runs (D366).* In the level's `render`, where
  the two marked lines are set (`editor.setRunningLine`,
  `editor.setErrorLine`): when the running line is another than
  the one shown and is a line, `editor.showLine` is called for
  it after it is marked. `y: 'nearest'` is what moves nothing
  for a line in sight and scrolls by the least for one out of
  it; the scroll is at once, never smooth, at every speed.
  Nothing is done when the run ends and the mark goes.

Nothing else of the column changes: the lists and the buttons
keep their sizes, the answer unfolded keeps its words and its
look, and at the start of a level every number of
`app/e2e/screens.spec.ts` holds (eight lines or more at
1024 × 700).

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

### 2.3 The foot (D365)

`app/src/main.ts`: `chrome`'s foot is the version and the
build; `familyLink` goes, and the comment over `kiduxLink` says
the header's link alone. `i18n/es.json`, `i18n/en.json`: the
key `app.family` goes from both; `app.kidux_url` and
`app.kidux_link` stay. `app/src/style.css`: the rule `footer a`
and its comment go; the foot stays one line, the version and
the build at its left. `README.md`, `README.es.md` and
`docs/dev/README.md` keep their line of the family, and
`test_readmes.py` holds it as today.

### 2.4 The tests

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

  After the third hint at 1024 × 700: `.hints-list` has
  `more-above` and not `more-below`; scrolled to its top by the
  test, it has `more-below` and not `more-above`. After the
  first hint at 1280 × 720 it has neither, and no `tabindex`. A
  screenshot of the state with three hints is saved as
  `app/e2e/shots/workbench-<width>x<height>.png`.

  Then the page is reloaded and the level opened again: three
  hints are shown, unfolded, the editor has five lines or more,
  and the newest hint's first line is in sight.
- **The same spec, the fold (D363)**, at 1024 × 700 in
  `the-check`, in Spanish, the starting program run and two
  hints taken. `#hints-fold` and `#outcome-fold` have
  `aria-expanded="true"` and the titles *Plegar las pistas* and
  *Plegar la respuesta*.
  - `#hints-fold` clicked: `.hints` has the class `folded`, is
    lower than 50 px, says *Pistas: 2 de 3* and shows no
    `.hint`; the button has `aria-expanded="false"` and the
    title *Desplegar las pistas*; the editor has nine lines or
    more; `.cm-kydux-error-line` lies inside `.cm-scroller`.
  - `#outcome-fold` clicked: `.outcome` has the class `folded`
    and is lower than 56 px; its `.outcome-text`'s
    `scrollWidth` is more than its `clientWidth` (the words are
    cut) and its text is the whole answer's; the editor has
    thirteen lines or more; the page's `scrollHeight` is the
    window's height. A screenshot is saved as
    `app/e2e/shots/workbench-folded-1024x700.png`.
  - *Pista* pressed: the hints' box is unfolded, three hints,
    the newest's first line in sight; the answer is still
    folded.
  - A click on the folded answer's words: it is unfolded, and
    whole inside the window.
  - Both folded again, then *Ejecutar* at speed 4: the new
    answer is unfolded, and the hints' box is still folded. A
    click on the folded hints' line unfolds it.
  - The answer folded once more, and the language changed to
    English: it stays folded, and its button's title is *Unfold
    the answer*.
  - In `the-gate` at 700 × 800 (the narrow page), after a run
    that does not win and one hint: both boxes fold and unfold
    by their buttons.
- **`app/src/ui/outcome.test.ts`**: the card of a `failed` run
  has no fold button; a card folded and shown again with
  another outcome is unfolded.
- **The same block, the largest letter.** At 1024 × 700 with
  the code's letter at 24 px (the settings' largest), the same
  steps: the editor has five lines or more, the page's
  `scrollHeight` is the window's height, the answer lies inside
  the window.
- **`app/src/editor/editor.test.ts`**: `showLine` dispatches a
  scroll for a line of the document, moves no selection, and
  does nothing for line 0 and for a line past the end.
- **`app/e2e/screens.spec.ts`, the line that runs (D366)**, in
  `the-check`, in Spanish, whose starting program has eight
  lines and runs its lines 5 to 8 in a loop.
  - At 1024 × 700 with three hints taken, unfolded, and the
    editor at its top (it shows fewer than eight lines, and the
    test holds it): *Ejecutar* at speed 2. When `.cm-kydux-running-line`
    is the eighth line (its text has `untie`), it lies whole
    inside `.cm-scroller`'s box, and `.cm-scroller`'s
    `scrollTop` is more than 0. The cursor is where it was
    (the editor's selection is read before and after).
  - At 1280 × 800 at the start of the level (the eight lines in
    sight): *Ejecutar* at speed 2, and when the running line is
    the eighth, `.cm-scroller`'s `scrollTop` is 0.
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
- **`app/e2e/about.spec.ts`**: the test of the foot's link
  gives way to *the foot of every screen says the version and
  the build, and holds no link (D365)*: on the same seven
  screens, `footer a` counts none, `footer` holds the version's
  words and `#build`, and `#family` is not in the page; the
  spec's head comment and the test of the header's link (D339)
  say the present. No other spec names `#family`.
- **`tools/i18n_check.py`** and the catalogues' tests pass with
  the nine new keys and without `app.family`, in both
  languages.

### 2.5 What the owner will try

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
3. Press the small arrow at the hints' corner: the box folds to
   *Pistas: 3 de 3* and the code grows to ten lines or so. Press
   the arrow at the answer's corner: it folds to its first
   words, and the code has fifteen lines. Line 8 is still seen,
   marked. A click on either folded line unfolds it.
4. With both folded, press *Ejecutar*: the new answer comes
   unfolded, and the hints stay folded.
5. Unfold the hints, so that the code has few lines, bring the
   code to its first line with the wheel, put the speed at its
   slowest and press *Ejecutar*. The marked line goes down the
   program, and when it reaches the editor's foot the code
   moves up by itself: the line that runs is always seen.
6. Open the map and come back to the level by its own stop. The
   three hints are there, unfolded, the newest in sight, and
   the code has its five lines.
7. In the settings, put the code's letter at 24 px and look at
   the same level: five lines of code, the hints' box lower.
   Put it back at 16 px.
8. In *El pasillo largo* (chapter 1), write
   `wizard.move_right(8)`, put the speed at 1×, press
   *Ejecutar*, open the map and click another stop. The game
   asks in its own box, *Tu programa todavía se está
   ejecutando. ¿Salir del nivel?*, and the wizard keeps walking
   behind it. *No, quedarme* leaves the map open; *Sí, salir*
   goes.
9. On the start screen, with two saved games, press *Borrar* on
   one. The game asks in its own box, with the game's name.
   *No, conservarla* keeps it; *Sí, borrar* deletes it.
10. Any screen: the foot says the version and the build, and no
   link; *Conoce Kidux OS* is in the header.

### 2.6 What is left out, and why

- *A box that folds by itself* when the room is short, and
  *hints folded one by one*. What a child was reading would go
  from under their eyes; the fold is theirs, and the five lines
  hold without it (D363).
- *The fold kept* from one visit of a level to the next. A
  level opened again shows what it has.
- *The running line centred, or followed by a smooth scroll.*
  The code would move at every step of a run; it moves only
  when the mark leaves the sight (D366).
- *The answer made shorter.* Its texts are the course's, written
  and corrected; the column makes room for them.
- *The narrow page's layout* (800 px or less): it scrolls as a
  whole, and its two boxes fold as the wide page's do.

## 3. The pieces

One commit each, `62.<n>: …`, with `ci/check.sh` and the specs
a piece touches green before it, in a copy of the repository
(the owner's server on port 5173 runs from the main tree: no
build and no world packed there). The whole `ci/check.sh --e2e`
once, in a copy, before the last commit.

### 3.1 The editor's column (D363, D366; 2.1)

`app/src/style.css`, `app/src/ui/level.ts`,
`app/src/ui/outcome.ts` and its test, `app/src/ui/icons.ts`,
`app/src/editor/editor.ts` and its test, `i18n/es.json`,
`i18n/en.json` (the five labels of the fold),
`app/e2e/screens.spec.ts`. Before the commit: the blocks of 2.4
green at the three sizes, at 24 px, for the fold and for the
line that runs, `level.spec.ts`, `hints.spec.ts`,
`program.spec.ts`, `lists.spec.ts`,
`cards.spec.ts` and the whole of `screens.spec.ts` green, and
the four screenshots `workbench-*.png` looked at: five lines of
code, the newest hint from its first word, the answer whole;
folded, two lines under the buttons and the code over them.

### 3.2 The two questions (D364; 2.2)

`app/src/ui/start.ts`, `app/src/ui/level.ts`,
`app/src/ui/ask.ts` (its comment), `i18n/es.json`,
`i18n/en.json`, `app/e2e/start.spec.ts`, `app/e2e/map.spec.ts`,
`tests/project/test_dialogs.py`. Before the commit:
`start.spec.ts`, `map.spec.ts`, `program.spec.ts` and
`leaving.spec.ts` green.

### 3.3 The foot (D365; 2.3)

`app/src/main.ts`, `app/src/style.css`, `i18n/es.json`,
`i18n/en.json`, `app/e2e/about.spec.ts`. Before the commit:
`about.spec.ts` green, and `grep -rn "family" app/src app/e2e`
names the letters' families alone.

### 3.4 The documents, the whole check, the report

- `docs/dev/architecture.md`: D363, D364, D365 and D366 are
  written, and D338 and D339 say the foot and the header as
  they are;
  where another entry or a document says how a question is
  asked, what the editor's column holds or what the foot holds
  (D38, D351, D352, the entries on the saved games' *Delete*,
  `app/e2e/README.md`), it says the present state.
  `docs/dev/plan.md` names sprint 62's decisions.
- The whole `ci/check.sh --e2e` in a copy.
- The report in Spanish to the owner, with the
  `workbench-*.png` pictures, one of each question and one of
  the foot, and the prompt in English for the reviewer.

## 4. The texts, and Gemini

No Gemini work. Nine labels, too small to brief, written here;
the fold's take the words the map's chapters fold by
(`map.fold`, *Plegar* / *Fold*):

| key | Spanish | English |
|---|---|---|
| `start.delete_yes` | Sí, borrar | Yes, delete |
| `start.delete_no` | No, conservarla | No, keep it |
| `map.leave_yes` | Sí, salir | Yes, leave |
| `map.leave_no` | No, quedarme | No, stay |
| `level.hints_folded` | Pistas: {n} de {total} | Hints: {n} of {total} |
| `level.hints_fold` | Plegar las pistas | Fold the hints |
| `level.hints_unfold` | Desplegar las pistas | Unfold the hints |
| `level.answer_fold` | Plegar la respuesta | Fold the answer |
| `level.answer_unfold` | Desplegar la respuesta | Unfold the answer |

The two questions keep their words (`start.delete_confirm`,
`map.leave_run`). `app.family` goes from both catalogues.

## 5. The prompt for CLAUDE-programmer

The owner clears the programmer's context (`/clear`) before
giving it.

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

This is sprint 62, a small sprint of corrections planned by the
designer at the review of sprint 61, which is accepted. Three
things. On the level's screen the hints' box and the answer
fold to one line each by a button of their own, the editor
keeps five lines of code whatever they take under it, the
hints' box scrolls and stands on the newest hint, and the line
an answer names is brought into sight (D363), as is the line
that runs whenever it leaves the editor's sight (D366). The two
questions still asked in the browser's own box, deleting a
saved game and leaving a level by the map while its program
runs, are asked in the game's own dialog (D364). The foot of
the page loses its link to Kidux, which the header has (D365).
No text of the course, no level, no scene and no picture
changes. Build on the last commit of main as you find it.

Read first: CLAUDE.md, .claude/working-model.md,
docs/dev/README.md, docs/dev/sprint-62.md (this plan, whole: it
leaves nothing for you to design), and in
docs/dev/architecture.md D38, D228, D338, D339, D346, D351,
D352, D359, D363, D364, D365 and D366. Then your memory notes
kydux-sprint-61-state, kydux-checks-per-piece, kydux-report-images-current,
kydux-no-co-authored-by, kydux-docs-present-tense,
kydux-commit-by-path-shared-tree and kydux-dev-server-build.
Then the code: app/src/ui/level.ts (the workbench's parts,
renderHints, render, the map's onGo, how Original asks),
app/src/ui/outcome.ts, app/src/ui/ask.ts, app/src/ui/start.ts,
app/src/ui/icons.ts, app/src/editor/editor.ts, app/src/main.ts
(chrome), app/src/style.css (.workbench, .editor, .hints,
.outcome, the block of D359, .chips-strip's fades, footer), and
the specs app/e2e/screens.spec.ts, hints.spec.ts,
start.spec.ts, map.spec.ts, program.spec.ts and about.spec.ts.

Build the four pieces of section 3 in order, one commit each
(62.1, 62.2, 62.3, 62.4), by path (git commit -m ... --
<files>), with no Co-Authored-By line nor any other attribution. Before each
commit, ci/check.sh and the specs the piece touches are green in
a copy of the repository; the whole ci/check.sh --e2e runs once,
in a copy, before the last commit. The numbers of section 2.1's
two tables of trials are what its styles gave on the built
game: if the editor's differ from yours by more than a few
pixels, find why before going on.

Limits: nothing pushed, no timer, nothing published or deployed.
The owner's development server on port 5173 is never stopped,
and nothing is built nor packed in the main tree's app/ while it
runs. nginx is never touched. No Gemini work and no painting.
Never run a formatter over app/.

What decides: the plan. Where the plan does not say, ask the
owner; what the owner decides differently becomes a decision
from D367 on, written in docs/dev/architecture.md.

Hand over, in Spanish to the owner: what was built piece by
piece, what differs from the plan and why, the pictures
(workbench at the three sizes with three hints, the workbench
folded, the two questions, the foot), the whole check's result,
and what the owner will try, in the order of the plan's 2.5.
Then the prompt in English for the reviewer, and whether it is
a good moment to clear each agent's context.
```
