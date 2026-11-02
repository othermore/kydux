# Sprint 22 — Chapter 2 after the owner's acceptance test: the library's course, the ghost, the small things of the page, and the tools' debts

The owner's acceptance test of chapter 2 (2026-10-29, on commit 62b9f98)
found eight things, and left one lesson to write down. Three are of the
page: the name a wizard gets when the creator is skipped, the map that
does not scroll to where the child is, and the moving key seen to move
after the level has faded back in. One is of the figures: Eldra floats
without moving. Four are of the course: the lost book's practice is too
hard and teaches two ideas at once, the hidden key's practice gives no
guidance and hides its key where the book was hidden, Eldra's book repeats
the high shelf, and the friend's appearance at the wand bank has no
reason. This sprint fixes them all, and pays the three debts of the tools
the review of sprint 21 named, so that chapter 3 starts clean. Five
pieces, 22.1 to 22.5, and the hand-over. Chapter 3 is sprint 23, after
the owner has tried this.

The rules of the earlier sprints hold: `ci/check.sh --e2e` green and one
local commit a piece, never a push, never a timer (nothing is pushed
before Friday 2026-10-30, and then only with `ci/push.sh`); every word
for the player through `t()` or a content file; nothing forbidden and
nothing secret; documents and comments in the present (CLAUDE.md); Gemini
writes every text the child reads, from a brief, and the implementer
reads and corrects the draft (CLAUDE.md); a chosen painting is mended in
boxes, never painted again (D88); reports show only pictures of the
current commit. Section 4 is the Gemini budget, section 5 the owner's
acceptance test, section 6 the hand-over, section 7 the prompt.

## 1. Decisions taken here

- **D119 — A wizard with no name is Kydux.** Decided 2026-10-29 by the
  owner. Where no wizard has been made, which only the tester's mode
  brings about by skipping the creator, the wizard's name in every text
  is the default name of the creator, *Kydux*, in every language; no
  other word stands in for it.
- **D120 — A floating figure never stands still.** Decided 2026-10-29 by
  the owner. A figure that floats (Eldra) is drawn, while it stands, with
  its dress swaying at the hem, slowly and without end, in a level and in
  a story alike; walking, it steps as every figure does.
- **D121 — A way's places are taken while the level is out of sight.**
  Decided 2026-10-29 by the owner. When a run starts, the scene fades out
  and stays out until Python has run and the way to show is known; the
  things and the figures are put at that way's places while nothing is
  seen, and the scene fades back in with everything in place. Rules out a
  thing seen to jump to its place after the level has come back.
- **D122 — The map opens at the place the child has reached.** Decided
  2026-10-29 by the owner. Opened from a level, a lesson or a story, the
  map scrolls to that item and marks it; opened from the start screen, it
  scrolls to the item last opened and marks it the same way. A story
  opened counts as the item last opened, as a lesson and a level do.
- **D123 — What the wizard carries is asked for with `find_item`, and is
  seen when given.** Decided 2026-10-29 by the owner. A level may start
  with a thing in the wizard's hands that has a picture (`carrying`
  names the kind, or the kind with its `art`). `wizard.find_item("book")`
  gives the thing of that kind the wizard carries, or `None`, as
  `find_nearest` gives the nearest one on the map: a name kept in one
  program is gone in the next, each level being a new program (D75), so
  the next program asks for the thing again. Given, the thing is seen to
  go from the wizard's hands to whoever takes it. Rules out a name put
  into the child's program unseen, `find_nearest` looking into the
  wizard's hands, and lists with their brackets before chapter 4.

Course rules the owner gave, written into `docs/dev/course.md` ("How a
level earns its idea"): a lesson teaches one idea, and its practice needs
that idea alone, so a lesson that would teach two has a practice each; a
practice's starting code guides the child in comments, step by step,
towards what the program must do, without writing the program; two things
are never hidden in the same place; a figure that appears in a story has
a reason to be there that the story says.

## 2. What the owner found, and where it is fixed

| Finding | Cause | Where |
|---|---|---|
| In the tester's mode, with the creator skipped, the wizard is called *Aprendiz*. | `wizard.no_name` is *apprentice* / *aprendiz* (D37's text). | 22.1: *Kydux* (D119). |
| Eldra floats stock still. | Her sheet's step frames have the dress grown 3 and 5 pixels, and the page shows the standing frame while a figure stands. | 22.2 (D120). |
| In *The moving key* the key moves after the scene has faded back in. | `controller.run` fades out, puts back and fades in (`startAgain`) in parallel with Python; the way is known only after, and `scene.load(world, way)` moves the key then. | 22.1 (D121). |
| The map does not scroll to where the child is when opened from the start screen, a lesson or a story. | `mapScreen` scrolls to `here` only, and `here` is given only from a level's overlay; a story never sets `progress.current`. | 22.1 (D122). |
| *The lost book* is too hard: the child must find, keep, reveal, walk, pick up and give in one go, with one comment. | Lesson 3 teaches `find_nearest`, `reveal` and `give` together; the practice needs all three and its starting code guides nothing. | 22.3: lesson 3 teaches finding and revealing; a new lesson 4 teaches `find_item` and giving; a practice each, with guiding comments. |
| *The hidden key* gives no guidance; its key and the book are hidden in the same aisle. | One comment; the book was at 5,13 and the key is at 3,14. | 22.3: guiding comments; the book lies by the pile of books at 1,13, seen but half covered. |
| *Eldra's book* repeats *The high shelf*. | Two practices of `fendra` with the same shape. | 22.3: one practice: the book on the high shelf is Eldra's other lost book, found, drawn down and given; *Eldra's book* goes. |
| The friend has no reason to be at the wand bank: she already had two wands. | The story says she came for her school wand. | 22.3: she comes out from behind the shelves, looking for a book, having heard the wizard's voice; the wizard introduces the mate. |
| A lesson, nothing to change: where a painting's strip is off its cells, the figure is moved on those cells, not the map. | `lowered` (the library's counter, 11,4 and 13,4, half a cell) and `nudged` (the library's 11,10 and 11,15 beside the vault's wall, 0.35 left; the dormitory's 8,5 to 8,8 along the wall between the rooms, 0.05 and 0.3 left). | Written in `art/README.md` ("What a scene is painted for"), this commit. |
| The tools' debts (review of sprint 21). | `repaint.py marks` does not refresh the untouched copy; the sweep judges an open leaf against the closed composite; `leaf` names two things in `cut.json`. | 22.5. |

## 3. The pieces

### 22.1 The page's small things: the name, the way's places, the map

**The name (D119).** `i18n/en.json` and `es.json`: `wizard.no_name` is
*Kydux* in both. D37's sentence on `no_name` says so. The tests that
expect *apprentice* (`app/e2e/edges.spec.ts`, `app/src/i18n/
personal.test.ts`) expect *Kydux*.

**The way's places (D121).** `app/src/ui/controller.ts` `run`: the fade
in waits for Python. `SceneLike.restartShow` takes a promise, `ready`:
`scene.restartShow(ready)` fades out, puts everything back (`restart`),
awaits `ready`, then fades in; `run` passes a promise that resolves once
the result is in and `shownWay` is set and the way loaded
(`scene.load(world, shownWay)` before the fade in, so that the things are
at the way's places while the scene is out); `restart` passes a promise
already resolved. A Python error or an interruption resolves it too, so
that the scene always comes back. A run asked for during the fade keeps
the rule of generations as now. `controller.test.ts`: the scene is loaded
with the way before `restartShow` resolves; `playback.play` is called
after. In the game: *The moving key* run three times at speed 1; on none
of the three is the key seen to move after the scene is back.

**The map (D122).** `main.ts` `showMap`: `here` is `progress.current`
when the route has none. `app/src/ui/story.ts` sets `progress.setCurrent
('story:<id>')` as a lesson does on opening. `map.ts` scrolls to `here`
as now (`data-here`), centred. A unit test of `mapScreen` with `here`
given marks and scrolls to it; a test of the story screen sets the
current item. In the game: the map from the start screen after *The
wrong order* scrolls to *The wrong order*; from a lesson, to that lesson;
from a story, to that story.

### 22.2 Eldra sways (D120)

**The sheet** (`tools/art/figures.py`). `FLOATING["eldra"]` is `(4, 8)`:
the step frames' dress grown 4 and 8 pixels; and the hem swings: the
dress of each step frame is sheared sideways, 0 at the dress's top to
`FLOATING_SWAY` 3 pixels at the hem, left in the first step frame and
right in the second (`_dress_grown` takes a `sway`). `figures.json` lists
the figures that float (`floating: ["eldra"]`, written from `FLOATING`).
A test: a floating figure's step frames are taller than its standing
frame by the growth and their hems are offset the sway's way; `floating`
in `figures.json`.

**The page** (`app/src/engine/scene.ts`). An actor whose figure is in
`floating` sways while it stands: its frames go `1, 0, 1, 2` (the
standing frame between the two steps) every `SWAY_MS` 450 ms, a Phaser
timer per such actor, in a level and in a story alike; a walk stops the
timer and steps the frames as now, and starts it again at the walk's end
on the new facing; a restart and a seek put the standing frame and start
the timer; a vanished or hidden actor's timer stops. The sweep, the
check sheets and the browser screenshots draw the standing frame (no
timer runs there). A unit test with a fake clock: a floating actor's
frame changes within a second while standing and is the standing frame
after a walk's first step. In the game: Eldra at the aisle's end in *The
book returned* and in *The wand bank* story, her hem swaying, nothing
else of her moving; a 2-second recording or three screenshots a second
apart.

### 22.3 The library's course: two lessons, four practices, one story

**The course** (`docs/dev/course.md`, this commit, and `content/
chapters/02-the-library/chapter.json`): the items of chapter 2 are, in
order, `story:the-entrance`, `story:the-first-night`,
`lesson:the-right-place`, `level:your-bed`, `story:the-morning`,
`story:at-the-library`, `lesson:what-things-know`,
`lesson:finding-things`, `level:the-lost-book`, `lesson:giving-things`,
`level:the-book-returned`, `lesson:keys-and-doors`,
`level:the-hidden-key`, `lesson:the-distance`, `level:the-moving-key`,
`level:the-wrong-order`, `lesson:fendra`, `level:the-high-shelf`,
`story:the-wand-bank`. `level:eldras-book` goes: its folder, its
mentions in the tests (`app/e2e/levels.spec.ts`, `chapter-2.spec.ts`,
`tests/`, `world/tests`) and in the course book. The numbers follow
(Lesson 1 to 7, Practice 1 to 5, Improve 1, Fix 1).

**The world (D123).** `world/kydux_world/level.py`: an entry of
`carrying` is a kind, as now, or an object `{"kind": ..., "art": ...}`;
the thing's id is the kind's name, as now. `world.py`: a new method
`wizard.find_item(kind)`, the thing of that kind the wizard carries, or
`None` ("the thing you carry of a kind: `wizard.find_item("book")`"),
beside `find_nearest`, which stays as it is; in `api.py`, in the API
check of `api` lists, in the notebook's descriptions (`i18n`, both
languages, the same key shape as `wizard.find_nearest`), in
`wizard_words` and in D27's vocabulary where the methods are listed. A
test: a level carrying a book from the start, `find_item("book")` gives
it, `find_nearest("book")` does not, and `give` hands it over. The page
(`scene.ts`, `painted.ts`): a carried thing with `art` has its image
loaded and hidden, and `give` shows it going from the wizard's hands to
the actor as it does for a thing picked up. `wizard.find_item` is in
the `api` of `the-book-returned` and of every level of the chapter after
it.

**`lesson:finding-things`** (Lesson 3, Wenna, teaches
`wizard.find_nearest`, `thing.reveal`): as now without its last section
on `give`; its *Try it* finds and reveals the book. **`lesson:giving-
things`** (Lesson 4, Wenna, teaches `wizard.find_item`, `wizard.give`),
new: each level is a new program, so a name kept in the last one is
gone (D75) and the thing in the wizard's hands is asked for again:
`book = wizard.find_item("book")` gives what the wizard carries of a
kind, as `find_nearest` gives what lies nearest on the map; then a thing
kept under a name is given to whoever stands beside the wizard with
`wizard.give(book)`; one *Try it*: `book = wizard.find_item("book")`
then `wizard.give(book)`.
Both drafted by Gemini from one brief (`tools/write/briefs/
chapter-2-finding-and-giving.md`), with the rules of `rules.md` and the
owner's writing rules (natural prose, one idea once, no re-explaining).

**`level:the-lost-book`** (Practice 2): scene the library, start 7,17,
Wenna at 5,17 and the mate at 9,17 as now, no Eldra; `old_book` at
**1,13** (the cell under the top of the pile of books, `u` on the map,
no one walks it; D109 draws the book under row 13's things, so the pile
half covers it; checked on the all-cells sheet and in the game: the book
seen, part of it behind the pile, picked up from 2,13 or 1,12); goals:
`collect old_book`; bonus `uses reveal`. Solution (`solution.py`):
`book = wizard.find_nearest("book")`, `book.reveal()`,
`wizard.move_up(2)`, `wizard.move_left(5)`, `wizard.move_up(2)`,
`wizard.pick_up()`. The starting code is comments only, one a step, in
the child's words: find the book with `find_nearest` and the word
"book", and keep it under a name; make it glow with `reveal`; walk to
it, up through the door, left along the front of the bookcases, up to
the pile; pick it up. Hints: the three steps as now, shorter. Intro:
Eldra lost a book long ago, it lies by the pile of books in the corner,
half hidden; outro: you have it, Eldra waits at the aisle's end; learned:
a method gives something back, a name keeps it, a revealed thing shows
where to go.

**`level:the-book-returned`** (Practice 3), new: start **2,13**,
`carrying` `["wand", {"kind": "book", "art": "old_book"}]`, Wenna at
2,15 and the mate at 3,15 (on the free cells of row 15, checked whole on
the sweep), Eldra at 11,10 facing down; goals: `give book to eldra`;
bonus `lines_under 5`. Solution: `book = wizard.find_item("book")`,
`wizard.move_right(9)`, `wizard.move_up(2)`, `wizard.give(book)`. The
starting code: comments, one a step: ask for the book in your hands with
`find_item` and the word "book", and keep it under a name; walk right
along the bookcases to the aisle's end and up to Eldra; give it with
`give` and the name.
Intro: the book is in your hands, Eldra floats at the aisle's end; take
it to her; outro: Eldra's thanks; learned: a name lives in its program,
and `give` hands a thing to whoever stands beside.

**`level:the-hidden-key`** (Practice 4): as now (the key under the front
bookcase at 3,14, the centre door), with the starting code as comments,
one a step: find the key with `find_nearest` and "key", keep it; reveal
it; go down into the aisle and left to beside it; pick it up; back
right, up, left along the hall and up to the door; open it with `open`;
go through. Hints as now. Its intro says the book is no longer there.

**`level:the-high-shelf`** (Practice 5, the chapter's review): start
2,6 (where *The wrong order* ends), Eldra at **8,6** facing left, the
mate at 10,6, Wenna at 10,5 as now; `rare_book` at 7,3 as now; goals:
`give rare_book to eldra`; bonus `uses reveal`. Solution: `book =
wizard.find_nearest("book")`, `book.reveal()`, `wizard.move_right(5)`,
`wizard.cast("fendra", book)`, `wizard.pick_up()`, `wizard.give(book)`.
Starting code: comments, one a step. Texts: Eldra's other lost book is
up on the high shelf among all the others, she cannot tell which; the
program can: find it, reveal it, stand under it, *fendra*, pick it up,
give it to her; outro: both books back, Eldra at peace; learned: *fendra*
is told what to bring, what it brings is still picked up, and the
chapter's ideas in one line. The level's id and folder stay
`the-high-shelf`; its title may change ("The high shelf" holds).

The four levels' texts (title, intro, goals, starting code's comments,
hints, outro, learned, in English and Spanish) drafted by Gemini from one
brief (`chapter-2-library-levels-2.md`) that gives each level's map,
start, things, goals and solution, and says that the starting code is
comments only, one a step, in the child's words, naming the method of
each step in backticks and never writing the program.

**`story:the-wand-bank`** (Story 5): the steps are 1 the voice, 2 Eldra's
thanks and vanishing, 3 the voice at the wand bank, 4 Baro, then: 5 the
friend appears at **10,5**, the gap between the high shelf and the
counter (or the first cell of the aisle beside it that the sweep shows a
figure whole on), facing down, and says she came for a book, heard the
wizard's voice through the shelves and knew it; 6 the wizard, glad,
introduces the mate by name; 7 the mate greets her; 8 the friend greets
the mate and the wizard gives her spare wand back with thanks (the wizard
speaks: one step, `by` the wizard); 9 Wenna's summing up as now; 10 the
voice at dusk as now. Staged in `story.json` (the friend's `appear` at
the new cell, facing down; the wizard turns up to her), its texts
drafted by Gemini (`chapter-2-wand-bank-2.md`): the friend's reason, the
introduction, warm and short. `docs/dev/story.md`'s closing beat of
chapter 2 says it (this commit).

**Checks.** `ci/check.sh --e2e`: the world's tests run every level's
solution and starting code; the browser tests of chapter 2 play the new
and changed levels with their solutions (`levels.spec.ts`,
`chapter-2.spec.ts`), and the course book (`tools/course_book.py`) is
remade for the owner. In the game: each of the five practices played
with its solution, a screenshot at its win; the story at step 5.

### 22.4 The course book for the owner

`drafts/course-book.es.md` remade with chapter 2's texts, so that the
owner reads the new lessons and practices in order.

### 22.5 The tools' debts

- `tools/art/repaint.py marks`: when it writes a picture that is an
  `also` picture of `doorways`, it writes its untouched copy too (the
  same bytes), so that `doorways` run after it lays the fills on the new
  marked picture. A test.
- `tools/art/sweep.py`: an open leaf's edge is judged on the open
  state's own picture composed on the ground, not on the closed
  composite, so that the room door's hinges need no `kept` box: the
  library's `kept [2.0, 5.2, 2.12, 6.0]` goes and the sweep stays green.
  A test.
- `cut.json`: a `doorways` door's search box is `leaf_box`, so that
  `leaf` names only a state's traced polygon; both scenes' files, the
  tool, `art/README.md`.

## 4. Gemini images

None. Texts: three briefs through `tools/write` (the two lessons, the
four levels, the story's steps), each drafted once and corrected by the
implementer; a second draft of one brief if the first fails the rules.

## 5. Acceptance test (for when the owner tries it)

On `https://localhost:5173/?debug`, in a private window, as a girl with
the look `teal`:

1. **The name.** Skip the creator; in any level's win card the wizard is
   called *Kydux*, in Spanish and in English.
2. **Eldra.** `#level/the-book-returned`: Eldra floats at the aisle's
   end with her hem swaying; walk to her with the solution and give her
   the book; the book is seen to go to her.
3. **The lost book.** `#lesson/finding-things`, then
   `#level/the-lost-book`: the starting code is comments that say the
   steps; the book is seen by the pile of books in the corner, half
   behind it; the solution wins with three stars.
4. **Giving.** `#lesson/giving-things`, then `#level/the-book-returned`:
   the starting code says the steps; the program asks for the book in
   hand with `find_item` and gives it; the notebook lists `find_item`.
5. **The hidden key.** `#level/the-hidden-key`: the comments say the
   steps; no book lies in the aisle.
6. **The moving key.** `#level/the-moving-key`, Run three times at
   speed 1: the key is never seen to move after the scene is back.
7. **The high shelf.** `#level/the-high-shelf`: Eldra's other book, drawn
   down and given; *Eldra's book* is not on the map.
8. **The wand bank.** `#story/the-wand-bank`: the friend comes out from
   behind the shelves, says why she is there, the wizard introduces the
   mate, the spare wand is given back.
9. **The map.** From the start screen, from a lesson and from a story,
   the map scrolls to the place reached and marks it.

## 6. What the implementer hands over

A report in Spanish, one thing after another, each explained for a reader
who does not know the code, and then its picture, only pictures of the
final commit:

1. **The page's small things** (22.1): what was wrong and what is done,
   with a screenshot of the map opened from the start screen.
2. **Eldra** (22.2): the sheet's frames side by side, and three game
   screenshots a second apart.
3. **The course** (22.3): the new order of chapter 2, each practice's win
   screenshot, the story's step 5, and the texts as corrected after
   Gemini.
4. **The debts** (22.5): the sweep's result on the library without its
   `kept` box.
5. The commits, with their hashes, and the state of `ci/check.sh --e2e`.
6. What differs from this plan and why, the Gemini drafts spent, and
   what is left open.
7. The prompt for the designer's review.

## 7. The prompt for CLAUDE-programmer

```
Read /home/other/Projects/kydux/CLAUDE.md and .claude/working-model.md,
then docs/dev/sprint-22.md (this plan), docs/dev/course.md (chapter 2
and "How a level earns its idea"), D37, D75, D109 and D119 to D123 in
docs/dev/architecture.md, tools/write/README.md and rules.md, and the
memory notes kydux-two-agents, kydux-sprint-21-state,
kydux-designer-review-21 and kydux-uat-5-chapter-2. Build sprint 22:
pieces 22.1 to 22.5, one local commit each, ci/check.sh --e2e green
before each, never a push, never a timer (nothing is pushed before
Friday 2026-10-30, and then only by the owner with ci/push.sh). Never
stop or build into the servers on ports 443 and 5173, and never kill a
vite, node or nginx process of the owner's (CLAUDE.md); a vite preview
on 4173 is a leftover of a check run. Gemini drafts every text the
child reads from the briefs section 3 names, through tools/write; read
and correct each draft before it enters content/, by rules.md and the
owner's writing rules in the memory note kydux-writing-feedback. No
Gemini image. The plan decides everything; where it does not, the owner
does, through the designer. Every document and comment in the present.
Before git add, read git diff of each file and stage only your own
hunks; commit promptly. Hand over what section 6 asks, and end with the
prompt for the designer's review.
```
