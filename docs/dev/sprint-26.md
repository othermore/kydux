# Sprint 26 — Chapter 2's eight improvements from the owner's pass of 2026-11-01

The owner's pass over chapter 2 (2026-11-01, on commit d1c16e5) found
eight things to improve before chapter 3. Three are of the small things'
masks (a key crossed by a plank's line, a book with a shape above it, a
glowing book whose polygon does not sit on its outline); one is of the
course (the last practice's book must be inside Eldra's locked room, on a
bookcase, or opening the door makes no sense); one is of the dormitory by
morning (the windows show square marks where the boxes were taken: the
whole scene by day is wanted if it fits, with the torches, candles and
fire out, and without the hazy light); two are of the page (going to
sleep is too fast to read, and the cell to sleep from wants a mark; a
level opened again shows the last program typed instead of its starting
code); and one of a lesson (two Try buttons). Six pieces, 26.1 to 26.6,
and the hand-over; at most five Gemini images. Chapter 3 is sprint 27.

The rules of the earlier sprints hold: `ci/check.sh --e2e` green and one
local commit a piece, never a push, never a timer (the owner pushes with
`ci/push.sh`); every word for the player through `t()` or a content file;
Gemini writes every text the child reads, from a brief (CLAUDE.md), and
the implementer reads and corrects the draft; nothing forbidden and
nothing secret; documents and comments in the present (CLAUDE.md); a
chosen painting is mended in boxes, never painted again (D88), but for
what D126 says of a whole picture by another hour; reports show only
pictures of the current commit. Section 4 is the Gemini budget, section 5
the owner's acceptance test, section 6 the hand-over, section 7 the
prompt.

## 1. Decisions taken here

- **D129 — A spell's line stops at a doorway the wizard does not stand
  in.** Decided 2026-11-01 by the owner. *fendra* reaches a thing in a
  straight line of at most three cells, and that line does not pass
  through a door's cell, open or shut, unless the wizard stands on it: a
  thing inside a room is reached from its doorway or from inside, never
  from the room before it through the open door. A thing on a shelf is
  never picked up by hand, from beside or from below: it is too high
  (`too_high`), and only the spell brings it down. Rules out a book
  fetched out of a locked room from across its threshold, and a door
  opened for nothing.
- **D130 — Going to sleep is seen: the wizard walks to the pillow's side
  and lies down; the cell to sleep from is marked.** Decided 2026-11-01
  by the owner. `wizard.sleep()` from the cell beside the bed is drawn in
  two parts, each a tick long: the wizard walks along the bed's side to
  the point beside its pillow, then lies down in it, head on the pillow.
  A level whose goal is to sleep marks the cell the wizard must stand on
  to do it (the goal's `at`), with the goal's ring and a sign of sleep
  drawn by the page, as a reach goal marks its cell. Rules out a figure
  that snaps into the bed in a blink, and a child who does not know where
  to stand.
- **D131 — A level opened again starts from its starting code.** Decided
  2026-11-01 by the owner. Opening a level from the map, from the course
  or from its lesson shows the level's starting code, as the first time;
  the program the child typed is kept only while the level's screen is
  open (*Run*, *Restart* and *Play again* keep it). Rules out a level that
  opens on the last program typed days ago, and a child who cannot find
  the comments that guide the practice.
- **D126, a sentence more** (this commit): where Gemini's morning
  picture fits the night painting whole, every wall, bed and door within
  three pixels, the morning is the whole picture: every image of the
  scene has a morning twin cut with the same masks, the torches, candles
  and fire out, and no light is laid over it; where it does not fit, the
  sky, the windows and the outside are taken in boxes with their tones
  matched to the painting along the boxes' edges.

## 2. What the owner found, and where it is fixed

| Finding | Cause | Where |
|---|---|---|
| The last practice's book stands on the high shelf of the top aisle; opening Eldra's room door leads to nothing. | The merge of sprint 22 put Eldra's other book on the high shelf (`rare_book`); her room's shelf holds one painted book (`eldras_book`, no level uses it). | 26.1: the book inside the room, on a bookcase full of books painted by Gemini, reached by *fendra* from the doorway (D129). |
| The hidden key's glow is crossed by a long vertical line. | `centre_key`'s mask (`lying`, cut against the painting without it, snapped to outlines) takes the plank's joint that runs under the key; the glow is the mask's shape (D107). | 26.2: the key traced by hand (`traced`). |
| The old book by the pile has a shape above it in its glow. | `old_book`'s mask takes a bit of the pile's edge above the book. | 26.2: traced by hand. |
| The glowing rare book's polygon does not sit on its outline. | 17 points traced in a hurry (d1c16e5). | 26.1: the book moves to the room; its new picture is traced with care, checked on the states sheet at three times. |
| The dormitory by morning shows square marks round the windows; the torches, candles and fire burn by day; the warm light is a haze. | The boxes taken from Gemini's try keep their own tones; the inside is the night painting's; the morning light is laid at 0.18 (D124). | 26.3 (D126): the whole morning picture, if it fits; else matched tones; no light laid when the picture is whole. |
| Going to sleep is too fast to read. | The page moves the wizard to the pillow and lies it down in 0.8 and 0.3 of one tick. | 26.4 (D130): a walk to the pillow's side, then the lying down, a tick each. |
| Nothing marks the cell to sleep from. | A `sleep` goal has no mark. | 26.4 (D130): the goal's ring with a sign of sleep at `at`. |
| A level opened again shows the last program typed. | `progress.code` keeps the last code per level and the level opens on it. | 26.5 (D131). |
| Lesson 3 (*Encontrar cosas*) shows two Try buttons. | To find (the lesson has one `python try` block, on its last page; the page draws Try on the last page only). | 26.6: one button, on the last page; the cause in the commit. |

## 3. The pieces

### 26.1 Eldra's book in her room, on a bookcase (D129)

**Gemini.** Two edits of the library's painting, in the box of Eldra's
little room above its door (about cells 0.9 to 3.1, 2.9 to 4.6, measured
on the painting; `repaint.py canvas` for the box, D88): (a) the room's
shelf made a bookcase full of books, two or three shelves of books
standing and leaning, the same wood and style, and among them, standing
out a little (leaning out of the row, or lying across the others on the
middle shelf), one old red book with a sigil on its cover, the one the
level is about; (b) the same bookcase without that book, the gap where it
stood showing the books behind or the shelf's back. Prompts
`tools/art/prompts/game-library-room-books.md` and `-room-books-without.
md`; the chosen tries joined with `repaint.py join` (the painting,
`library-book.png`, for (a); the ground-only and marked pictures for (b),
`also`). At most three images: one try each and one more for whichever
fails.

**The cut.** `art/scenes/the-library/cut.json`: `eldras_book` is now
that book, `at` 2,3, its `lying` state traced by hand on (a) (`traced`,
20 to 40 points on its outline, checked on the states sheet at three
times: the magenta edge on the outline all round), its `without` the
joined (b); no `pulled` state (the reveal's glow, D107, stays on it as it
flies). `rare_book` goes from the things (the high shelf keeps its
painted book as one among many; its `nobook` edit is no longer used and
its `pulled` picture goes). The export writes the states; the states
sheet and the all-cells sheet are looked at; `s26-the-library.png` and
`s26-states-the-library.png` kept.

**The world (D129).** `world/kydux_world/world.py`: *fendra*'s line of
reach does not cross a door's cell (open or shut) unless the wizard
stands on it (`out_of_reach` as now when it does not reach). A thing on a
shelf cell is `too_high` for `pick_up` from any cell (as now; a test says
so for a cell beside and below). Tests: from the room's door cell the
book at 2,3 is reached; from 2,6 it is not.

**The level.** `content/levels/the-high-shelf/` becomes `content/levels/
eldras-room/` (`level:eldras-room`, Practice 5, title drafted by
Gemini): scene the library, start 2,6 (where *The wrong order* ends),
Eldra at 3,6 facing left, the mate at 4,6, Wenna at 5,6; things: the
room door at 2,5 open (`art` room_door), `eldras_book` at 2,3; `spells`
fendra; goals: `give eldras_book to eldra`; bonus `uses reveal`.
Solution: `book = wizard.find_nearest("book")`, `book.reveal()`,
`wizard.move_up()`, `wizard.cast("fendra", book)`, `wizard.pick_up()`,
`wizard.move_down()`, `wizard.give(book)`. Starting code: comments, one a
step (course.md). Wrong programs: the cast from 2,6 (`out_of_reach`), a
`pick_up` from the doorway (`too_high`). Texts (title, intro, goals,
comments, hints, outro; no `learned`, D62) drafted by Gemini from
`tools/write/briefs/chapter-2-eldras-room.md`: Eldra's other book is on
the bookcase in her little room, too high for hands; from her doorway
the spell brings it down. `docs/dev/course.md`'s row, `chapter.json`,
the browser tests and the course book (`tools/course_book.py`) follow.

### 26.2 The small things traced by hand

`art/scenes/the-library/cut.json`: `centre_key` and `old_book` get their
`lying` state as `{"picture": ..., "traced": [...]}` on the painting, the
polygon on the thing's outer outline (the key: its bow, its shaft and its
bit, nothing of the floor's joint; the book: its cover and pages, nothing
of the pile), 20 to 40 points each, with `trace.py look --poly` at scale
8; `room_key` the same if its edge is off anywhere on the states sheet.
Checked on the states sheet at three times: each edge on the outline all
round; and in the game with `reveal` on the hidden key (*The hidden key*)
and on the old book (*The lost book*): the glow is the thing's shape
alone. Screenshots `s26-key-glow.png`, `s26-book-glow.png`.

### 26.3 The dormitory by day, whole (D126)

**Gemini.** One prompt, `tools/art/prompts/game-dormitory-day.md`: the
whole night painting (`dormitory-walls.png`) given as it is, asked for
the same picture in the morning: everything in the same place and the
same size, the morning sky above the walls and in every window, sunlight
on the grass, the towers and the battlements, the rooms lit by day, every
torch, candle and the fireplace out (no flames, no glow), nothing else
changed. At most two tries.

**The fit, measured before anything is cut.** `tools/art/trace.py
the-dormitory fit <try>` (a fourth command): the dark outlines of the
night painting and of the try (`image_first.dark_lines`), and for each
static thing's box and each door's box of `cut.json`, the shift that best
lays the try's outlines on the painting's (the least difference over
shifts of up to 12 pixels) and the share of the painting's outline
pixels the shifted try's outlines cover; written as a table in the
commit. The try fits when every box's shift is at most 3 pixels each
way and its share at least 0.85. If a try fits: the whole-day road
below. If none does: the boxes road.

**The whole-day road.** `cut.json` `sources` takes `hours: {"morning":
"dormitory-morning.png"}` (the fitting try as joined whole, replacing
`grounds` and the `morning` section); `export_scene.py` cuts every image
of the scene a second time from the morning painting with the same masks
(the ground, every row's images, every thing's states, the beds' covers)
into `<name>-morning.webp`, and `art.json` names them (`hours.morning`
on the scene, each row and each state); the page (`painted.ts`,
`scene.ts`) loads the morning twins and shows them over the night ones
by the light's `day` share (as the ground and row 15 are shown now),
things and doors included, and the morning light's alpha is 0: the
picture is the morning. `check` composes `morning-the-dormitory.png`
whole and the programmer looks at it: no night piece anywhere, no flame.
The sweep runs on the night scene as now.

**The boxes road** (only if no try fits). The `morning` section as now,
with each box's pixels brought to the painting's tones along its edges
(`repaint.join` matched as `margin.matched` does, the mean and spread of
colour in a band of 12 pixels inside the box edge against the band
outside), the fades widened to 8 pixels, and the flames of the torches,
candles and the fireplace put out in boxes of their own (Gemini, one
image at most, within the two of this piece); the light stays at 0.18
over the inside. The commit says which road was taken and the fit table.

**Both roads.** *The morning* story and the dawn of *Your bed* show it;
screenshots `s26-morning-story.png` (the camera on the windows) and
`s26-morning-after-dawn.png`.

### 26.4 Sleep seen, and the cell marked (D130)

**The page** (`scene.ts`, `playback.ts`): a `sleep` event of the wizard
takes two ticks (`lengthOf`: `sleep` is in a set of its own, 2.0): over
the first the wizard walks from its cell to the bed's side by the
pillow (the point `head` of `art.json`'s bed, moved toward the wizard's
side of the bed by half the bed's width, so that the figure stands on the
floor beside the pillow, facing the bed), over the second it lies down
as now (the lying frame, head on the pillow, under the quilt), no faster.
In a story an actor's `sleep` is drawn the same. A unit test of the
timings where possible, and the browser test of *Your bed* reads
`data-asleep` lying only after two ticks.

**The mark.** A level's `sleep` goal takes `at`, the cell to sleep from
(`your-bed`: the cell before the trunk of `bed_2`, measured on the map
as the cell beside the bed the solution stands on); `kydux_world.level`
checks it is a floor cell beside the bed; the page draws there the goal's
ring (as a reach goal's, D79) with a sign of sleep inside it, a crescent
and two "z", drawn by the page in the ring's colour (no painted art, no
text); `data-marks` says it. The world's `sleep` from any other cell
beside the bed still works (the goal is the bed). Screenshot
`s26-sleep-mark.png` and three of the going to sleep a tick apart
(`s26-sleep-1.png` to `-3.png`).

### 26.5 A level opened again starts from its starting code (D131)

`app/src/ui/level.ts` and `app/src/progress/`: a level's screen opens on
the level's starting code; `progress.code` is no longer written (the
field stays readable for old saved games and is ignored; `store.ts` says
so); *Run*, *Restart*, *Play again* and the way selector keep the editor
as it is. A unit test: opening a level with a saved `code` shows the
starting code. The documents that say the last code is kept (D-entries
in `architecture.md`, `docs/dev/course.md` if any) say the new rule.

### 26.6 One Try button on lesson 3

`#lesson/finding-things` in Spanish and in English shows one Try button,
on its last page, as every lesson does. The programmer finds why two are
drawn (the page's own buttons, a second block, the `backTo` button from
a level), fixes it for every lesson, says the cause in the commit, and
adds the test that holds it (a unit test of the lesson screen, or a
browser test).

## 4. Gemini images

At most five: three for Eldra's bookcase (26.1), two for the dormitory by
day (26.3). Texts: one brief (26.1).

## 5. Acceptance test (for when the owner tries it)

On `https://localhost:5173/?debug`, in a private window, as a girl with
the look `teal`:

1. `#level/eldras-room`: Eldra's book stands on a full bookcase in her
   little room; from 2,6 the spell does not reach it; from the doorway
   it does; a `pick_up` from the doorway is refused as too high; the
   solution wins; the book's glow is the book's shape.
2. `#level/the-hidden-key` and `#level/the-lost-book`: `reveal` glows the
   key and the book alone, no line, nothing above.
3. `#story/the-morning` and `#level/your-bed` after the dawn: the
   dormitory by day, no flames, no haze (if the whole picture fitted; else
   no square marks round the windows).
4. `#level/your-bed`: the cell before the trunk is marked with a ring and
   a sign of sleep; on `sleep` the wizard walks to the pillow's side and
   lies down, readable at speed 1.
5. Win *Your bed*, go to the map, open *Your bed* again: the starting
   comments, not the last program.
6. `#lesson/finding-things`: one Try button, on the last page.

## 6. What the implementer hands over

A report in Spanish, one thing after another, each explained for a reader
who does not know the code, and then its picture, only pictures of the
final commit: Eldra's bookcase with and without the book and the level's
win; the key's and the book's glow; the dormitory by day (or the boxes,
with the fit table); the sleep mark and the three moments; the commits
with their hashes and the state of `ci/check.sh --e2e`; what differs from
this plan and why; the Gemini images spent; and the prompt for the
designer's review.

## 7. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md (the project's rules), .claude/working-model.md (your working
model), docs/dev/README.md, docs/dev/sprint-26.md (this plan), the
decisions D47, D62, D79, D85, D88, D89, D93, D107, D124, D126, D129,
D130 and D131 in docs/dev/architecture.md, art/README.md ("How a scene
is made", "What surrounds a scene", "The rules for the cut-outs"),
tools/write/README.md and tools/write/rules.md, and the memory notes
kydux-two-agents, kydux-sprint-25-state, kydux-designer-review-25,
kydux-uat-8-chapter-2, kydux-writing-feedback and
kydux-friends-server-4173. Build sprint 26: pieces 26.1 to 26.6, one
local commit each, ci/check.sh --e2e green before each, never a push,
never a timer (the owner pushes with ci/push.sh). Never stop or build
into the servers on ports 443 and 5173, and never kill a vite, node or
nginx process of the owner's (CLAUDE.md); a vite preview on 4173 is a
leftover of a check run. Gemini: at most five images (three for Eldra's
bookcase, two for the dormitory by day), from the prompts the plan
names, the key read from ~/.config/kydux/secrets.env and never written
anywhere; the level's texts drafted by Gemini through tools/write from
the brief the plan names, read and corrected by you before they enter
content/. The plan decides everything; where it does not, the owner
does, through the designer. Every document and comment in the present.
Before git add, read git diff of each file and stage only your own
hunks; commit promptly. Hand over what section 6 asks, as a report in
Spanish, and end with the prompt for the designer's review in English,
in a code block: the commits, the differences from the plan with their
reasons, what to look at with care, what is left open, and the limits
(nothing pushed; the servers).
```
