# Sprint 45 — A turn inside a ring rubs its rim and stops the program, the goals box folded off a ring, and the tips' pictures from chapter 1

A small sprint. On 2026-11-14 the owner asked how the race counts a
ring, and the answer showed a hole in the rule: a wizard that flies one
step into a ring, stops inside it and leaves by its side hears nothing;
the ring is only missed, and a race pays for it with five turns at its
end. The owner closes it, in their words:

> Si se está dentro del aro y se intenta salir hacia un lado (no hacia
> arriba o hacia abajo), se choca con el borde del aro. Se puede
> resolver con un pensamiento/sonido de choque que pare el programa y
> que diga "Oh, giré demasiado pronto y rocé el aro".

They ask also for whatever the review of sprint 44 saw. Two things of
it are small and sure enough to build without a question, and enter
here; the rest waits for the owner's answers (2.5).

What this sprint holds:

1. Inside a ring, a move to the left or to the right rubs the ring's
   rim: the bump's sound, the wizard's thought in the owner's words,
   and the program stops there, as `drevo` cast over the water stops
   it.
2. The goals box folds by itself at a level's start where it covers a
   ring, as it folds where it covers the wizard: in *Los aros* and in
   *La carrera* it hides the top half of the first red pair.
3. The pictures of the tips *notebook*, *spells*, *click* and *lesson*
   are taken in chapter 1, where a child first reads them, and not in
   chapter 4, whose spells and actions that child has not met.

The rules of the earlier sprints hold: pieces in order, one local
commit each, `ci/check.sh` and the browser specs a piece touches green
before it, the whole `ci/check.sh --e2e` once before the last commit;
never a push, never a timer, never a deploy; the servers on 443 and
5173 untouched; documents and comments in the present; Gemini writes
every text the child reads from a brief, and the owner's own Spanish
words are kept as they are, with their slips of the keyboard put
right.

## 1. Decisions taken here

Both are entered in `docs/dev/architecture.md` with this plan, and D187
and D219 are brought to D226.

- **D226 — A turn inside a ring rubs its rim, and the program stops.**
  The owner's, 2026-11-14, in the words above. While the wizard is in
  a ring's cell, flown into from below or from above, a move to the
  left or to the right is refused as `drevo` over the water is (D215):
  the event `blocked`, `by` the ring, `reason: ring_rim`, with
  `facing`; the run ends in an error at that line, the wizard still in
  the ring's cell and in the air; the ring makes no event and counts
  as not flown through. The scene turns the wizard that way and nudges
  it, shakes the ring and plays the bump's sound; the wizard thinks
  the owner's words, and the card says why the program stopped. A
  vertical move goes on as it does: on along the same way and out by
  the ring's far side, or back out by the side it came in, which says
  nothing and leaves the ring not flown. Rules out a ring left by its
  side in silence, and a rim that only bumps while the program goes
  on.
- **D227 — The goals box folds at a level's start where it covers the
  wizard or a ring.** The designer's, 2026-11-14, for the owner to
  overturn. Once the camera has drawn the level's start, the page
  compares the goals box with the wizard's box and with each ring's;
  where it meets one, the box folds for that level alone, and the
  child opens it with its heading. The start card gives the goals
  whole before, the rings' rule among them (D219). Rules out a ring
  half hidden under the goals where the child must fly through it,
  and a box that moves about the page from level to level.

## 2. What is asked

### 2.1 The ring's rim (D226)

**The world.** In `Wizard._move` (`world/kydux_world/world.py`), the
first check of each step, before the friend, the forbidden cell and
the rest: when the wizard is inside a ring's cell (`self._k_ring` is
not `None`) and the direction is `LEFT` or `RIGHT`,

```python
world.refuse(<the ring's id>, "ring_rim", list(here), facing=direction.value)
```

`refuse` is D183's and D215's: it takes the tick, makes the event
`blocked` with `tried: true`, sets the run's error and raises
`Refused`, which `explain.py` turns into the explanation `ring_rim`
with the ring as its `thing`. Nothing else of the world changes.

The designer tried these three lines in a copy of the world. The whole
Python suite passes with them, 2396 tests, and every solution, every
`wrong/` program and every starting code of *Los aros*, *La carrera*
and *La revancha*, in both languages, gives the same events tick for
tick: no program of the game leaves a ring by its side.

What the world does, case by case. `the-rings` starts at (4,9), its
first ring `ring_1` at (5,8), flown upward:

| program, after `wizard.cast("drevo")` and `wizard.move_right(1)` | what happens |
|---|---|
| `move_up(1)` then `move_right(1)` | refused at that line, tick 4: `blocked`, `at` [5,8], `by` `ring_1`, `reason` `ring_rim`, `tried` true, `facing` `right`; status `error`; the wizard at (5,8), flying; no `through`, no `wrong_way` |
| `move_up(1)` then `move_left(1)` | the same, `facing` `left` |
| `move_up(1)` then `move_up(1)` | `through`, as `move_up(2)` |
| `move_up(1)` then `move_down(1)` | no event of the ring's, the program goes on; the ring is not flown |
| `move_up(1)` and the program ends | no error; the wizard stays in the air inside the ring; the level is not won |
| `move_up(2)`, `move_right(2)`, `move_down(1)` then `move_right(1)` | the second ring, entered along its way, refuses the same; a ring entered against its way refuses the same too |

In `the-race`, start (6,8) and `ring_1` at (7,7), the same four lines
stop the program at tick 8, Ilda reading the four lines first, a tick
each: the race is not flown out, no `circle`, both of its goals failed.

Unchanged, and each kept by a test that exists: a ring's cell flown
into from its side, or walked into, bumps and the program goes on
(`bump`, `by: ring`, *¡He chocado con el aro!…*); a ring flown
against its way shakes, says its way and counts as missed
(`wrong_way`); `drevo` cast inside a ring is refused (`no_landing`).

**The page.**

- `app/src/engine/words.ts`, `blockedText`: `ring_rim` gives
  `blocked.ring_rim`.
- `app/src/ui/outcome.ts`: `ring_rim` gives `error.ring_rim`, as
  `no_landing` gives its own.
- `app/src/engine/scene.ts`, `case 'blocked'`: for `ring_rim` the
  bump's sound, as for `no_landing`, and the wizard nudged the way it
  turned, as a bump nudges it. The turn (`facing`), the thought and
  the ring's shake (`tried`, `by` the ring) come from what the case
  does for every refusal. The thought stays its reading time and the
  card waits for it (D175).

**The texts.** Three, in 2.4.

**A wrong program**, `content/levels/the-rings/wrong/turned_inside_the_ring.py`:

```python
wizard.cast("drevo")
wizard.move_right(1)
wizard.move_up(1)
wizard.move_right(2)
wizard.move_down(2)
```

It is refused at line 4, tick 4, the wizard at (5,8). The content
tests that read `wrong/` hold it, and `docs/dev/course.md`'s row of
`the-rings` names it with the others.

**Tests.**

- `world/tests/test_broom.py`, beside the ring's: the six rows of the
  table above, each as a test or a case of one; the race's four lines;
  and one that runs every solution and every `wrong/` program of the
  three ring levels and finds no `ring_rim` but in
  `turned_inside_the_ring`.
- Vitest: `words.test.ts` and `outcome.test.ts`, the new reason beside
  `no_landing`.
- `app/e2e/chapter-4.spec.ts`, modelled on the test of `drevo` over
  the water: `the-rings` run with the wrong program; `data-thought`
  is the owner's sentence, `data-sounds` holds the bump, the outcome
  shows the error's words and no win card, `data-flying` holds the
  wizard, `data-wizard` is `5,8`; a screenshot for the report.

**The documents.** In `architecture.md`, the events table's row of
`blocked` gains `ring_rim` (`by` the ring, with `facing`, D226) and
`no_landing`, which it lacks (`drevo` over a cell no one walks on,
D215), and its scene column says the bump's sound of both. The code's
comments at `_move` and at `case 'blocked'` say the rule in the
present.

### 2.2 The goals box (D227)

`app/src/ui/level.ts` folds the box, 400 ms after the scene is ready,
when it meets `handle.wizardBox()`. The scene's handle gives also the
boxes of the level's rings on the page, `ringBoxes()`, each made as
`wizardBox()` makes the wizard's, from the ring's image; the check
folds when the box meets the wizard's or any ring's. `goals.fold()`
is the one that exists: for that level alone, and the child's click
opens it. The header comment of `app/src/ui/goals.ts` says both
cases.

Tests, in `app/e2e/chapter-4.spec.ts` beside chapter 3's of the
wizard: `the-rings` and `the-race` open with `.goals` at
`data-folded="true"`, the toggle opens it, and a level of chapter 4
with no ring whose wizard the box does not cover opens unfolded. A
test that reads a goal's text or mark in a level with rings opens the
box first, or reads the goal's attribute.

Not in this piece: words said on the scene kept clear of the open
box. With the box folded the first pair's thoughts are in the clear,
and the report shows one (3.4).

### 2.3 The tips' pictures

`app/e2e/tips-pictures.spec.ts` takes *notebook*, *spells* and
*click* in `the-rings`, and *lesson* in `checking-each`: a child who
waits for chapter 1's first scene is shown `drevo`, `def` and a loop
over a list. They are taken where a child of chapter 1 has been:

| tip | where | what is seen |
|---|---|---|
| `notebook`, `spells`, `click` | `the-sealed-door` (chapter 1, the level after the first spell's lesson) | the notebook's actions; its spells tab, with `zelim` alone; a move clicked into the program |
| `lesson` | `how-much`, the page that holds its block | `wizard.move_right(3)` run on the page, with what it says of the walk (`.lesson-said`; the block prints nothing) |

`dot`, `hint`, `timeline`, `zoom`, `keys` and `map` are of chapter 1
or of no chapter and stay as they are taken. The eight pictures, four
tips in two languages, are made again with the spec
(`KYDUX_TIP_PICTURES=1`), each 640 by 360 and under 40 KB, looked at
one by one before they are committed. The spec's own check of sizes
and the content test of the tips hold. Where a document or a comment
names the level a picture is taken in, it names the one of this
table.

### 2.4 The texts (Gemini)

Three new texts, no text changed.

- `blocked.ring_rim` in Spanish is the owner's, letter for letter,
  with the full stop every thought ends in:
  **Oh, giré demasiado pronto y rocé el aro.** It is not sent to
  Gemini.
- `blocked.ring_rim` in English and `error.ring_rim` in both
  languages are Gemini's, from one brief,
  `tools/write/briefs/sprint-45-the-rings-rim.md`: the bible, the
  course, the ring's texts as they are (`blocked.ring`,
  `blocked.ring_way.*`, `error.no_landing`, the goals' line of the
  rule), the owner's sentence, and the rules: no *manera*, no *way*
  told (D204), no metaphor, the knot's words (D224). The card's text
  says, in two short sentences as `error.no_landing` does, that the
  broom turned while it was still inside the ring and rubbed its rim,
  so the program stops there, still in the air; and that a ring is
  left by its other side, one step more upward or downward, before
  turning.

The programmer reads the drafts, corrects them and says in the commit
what was corrected. The page of the texts for the owner, in
`drafts/`: the three, each *Antes: no existía.* and *Ahora:*.

### 2.5 What is left out, and why

- **The code's letter (D223)**: the owner has not chosen among the
  three; the chooser stays under `?debug`.
- **The load**: sprint 44's two proposals (the server's cache with the
  version in the address; the sound's context asleep when nothing
  sounds) wait for the owner's yes.
- **Zarek at the finish**, half behind the lower flag's pole: left
  unless the owner minds.
- **The walkthrough**: not made again. The owner is reading the one of
  2026-11-14, and no won way of any level changes.

### 2.6 What the owner will try

In *Los aros* (chapter 4, Mejora 1):

1. The level opens with the goals box folded and the two red rings
   whole.
2. This program, run:

   ```python
   wizard.cast("drevo")
   wizard.move_right(1)
   wizard.move_up(1)
   wizard.move_right(1)
   ```

   The wizard flies into the first red ring and stops inside. It
   turns to the right, the bump sounds, the ring shakes, and the
   wizard thinks *Oh, giré demasiado pronto y rocé el aro.* The
   program stops; the card says why and names line 4. The wizard is
   still in the air, inside the ring.
3. The last line as `wizard.move_left(1)`: the same, to the left.
4. The last line as `wizard.move_up(1)`: the ring lights, nothing is
   said.
5. The same four lines in *La carrera*: the same, and the race is
   not flown out.
6. The tips' page of the hand-over: the notebook, the spells, the
   click and the lesson are chapter 1's.

## 3. The pieces

### 3.1 The ring's rim (D226, 2.1, 2.4)

The world's refusal with its tests; the page's words, sound and
nudge with theirs; the brief, Gemini's drafts corrected and the three
texts in `i18n/es.json` and `i18n/en.json`; the wrong program; the
browser test; the events table, `course.md`'s row and the comments.
One commit; its message says what was corrected in Gemini's drafts.

### 3.2 The goals box (D227, 2.2)

`ringBoxes()` on the scene's handle, the start's check, the browser
test, the comments.

### 3.3 The tips' pictures (2.3)

The spec taking the four tips in chapter 1, the eight pictures made
again and looked at, the documents that name where they are taken.

### 3.4 The whole check, the hand-over and the report

`docs/dev/plan.md` names this sprint's decisions in its chapter 4.
The whole `ci/check.sh --e2e`, in a copy, with Playwright's own
server on 4173. Then, in `drafts/`, never committed:

- the page of the three new texts (2.4);
- the ten tips with their pictures in Spanish, as sprint 44's page;
- the report in Spanish, with pictures of this commit only: the rim
  rubbed in *Los aros*, with the thought and the card; the start of
  *Los aros*, *La carrera* and *La revancha*, the box folded and the
  first pair whole; what was built piece by piece; every choice the
  plan left and how it was taken; what Gemini's drafts needed
  corrected; and the owner's six steps of 2.6, written to be
  followed.

## 4. Gemini images

None. One text brief.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

Read first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-45.md (this plan, whole; it is short),
docs/dev/sprint-44.md (what you built last), and the memory notes
kydux-two-agents, kydux-sprint-44-state, kydux-designer-review-44,
kydux-designer-sprint-45-plan and kydux-checks-per-piece. The
designer's commits after yours (8e10cc4 to the plan's last) fix two
things of the words said on the scene and enter this plan and its
decisions (D226 and D227, with D187 and D219 brought to D226): read
them with git log -p 8e10cc4..HEAD before you start.

Build sprint 45 whole: pieces 3.1 to 3.4 in order, one local commit
each; before each commit ci/check.sh and the browser specs the piece
touches green, and the whole ci/check.sh --e2e once before the last
commit, in a copy with Playwright's own server on 4173; never a push,
never a timer, never a deploy: nothing is released until the owner is
happy with chapter 4. Never stop or build into the servers on ports
443 and 5173, and stop your own preview when you are done. No image
is asked of Gemini; the key stays in ~/.config/kydux/secrets.env and
never enters a file of the tree, a commit, a log or the report.

The three things the owner will look for:
(1) inside a ring, a move to the left or to the right rubs its rim:
    the wizard turns that way, the bump sounds, the ring shakes, the
    wizard thinks "Oh, giré demasiado pronto y rocé el aro." and the
    program stops at that line with its card, the wizard still in
    the air inside the ring; a move on upward or downward, or back
    out, goes as it does today;
(2) Los aros and La carrera open with the goals box folded and the
    first pair of rings whole;
(3) the tips' pictures of the notebook, the spells, the click and
    the lesson taken in chapter 1 (the-sealed-door, how-much).

The plan decides everything; where it does not, take the smallest
choice that keeps its intent and say it in the commit. The owner's
sentence is entered letter for letter and never sent to Gemini to be
written again; Gemini writes the other three texts from the brief,
and you correct its drafts and say what you corrected. Never edit
content while a browser run is going. Every document and comment in
the present. Before git add, read git diff of each file and stage
only your own hunks; commit promptly.

Hand over, in drafts/ and never committed: the page of the three new
texts, the ten tips with their pictures, and the report in Spanish as
3.4 asks, with the owner's six steps of 2.6. No walkthrough is made
again. Write your memory note kydux-sprint-45-state, and end with the
prompt for the designer's review in English, in a code block.
```
