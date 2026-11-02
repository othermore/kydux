# Sprint 28 — Chapter 2 after the owner's pass of 2026-11-01: the wizard's walk to bed, the door's bad frame, the give's way, every figure's steps, and the key and the door as one tale

The owner's pass after sprint 27 (2026-11-01, on commit 549c6f0) found
five things. The wizard still goes straight from the trunk into the bed,
while the other figures walk round as staged; in *The morning* the door
shows a bad frame as it closes; when the first book is given to Eldra it
flies right, toward the wall, instead of up to her; the wizard's steps
sound loud and the other figures' not at all; and *Improve 1* and *Fix
1* make a poor pair: the key is given away, then the door is opened in a
level of its own. Five pieces, 28.1 to 28.5, no Gemini image, one text
brief. Chapter 3 is sprint 29.

The rules of the earlier sprints hold: `ci/check.sh --e2e` green and one
local commit a piece, never a push, never a timer (the owner pushes with
`ci/push.sh`); every word for the player through `t()` or a content file;
Gemini writes every text the child reads, from a brief, and the
implementer reads and corrects the draft; documents and comments in the
present (CLAUDE.md); reports show only pictures of the current commit.
Section 4 is the Gemini budget, section 5 the owner's acceptance test,
section 6 the hand-over, section 7 the prompt.

## 1. Decisions taken here

- **D132 — Every figure's steps are heard: the wizard's soft and its
  own, the others' alike.** Decided 2026-11-01 by the owner. A walk of
  any figure, the wizard's, a friend's, a teacher's, in a level or a
  story, plays a step sound a cell; the wizard's step is quieter than
  now and of its own timbre, and every other figure's steps share a
  second timbre, so that the child tells whose steps they hear. Rules
  out steps heard for the wizard alone, and the wizard's steps louder
  than the scene.
- **D48, a sentence more** (this commit): a thing given goes from the
  middle of the wizard's hands to the middle of the figure that takes
  it, where that figure is drawn (its nudge and its lowering included),
  and fades there.
- **The course, chapter 2** (`docs/dev/course.md`, this commit): *The
  moving key* is Fix 1: Wenna's program from yesterday walks five steps
  to a key that lies at a different distance each time; the child
  repairs it with `distance_to` kept under a name, and the level ends
  with the key picked up. A new level, *Eldra's door*, is Improve 1: the
  repaired program is given whole, and the child makes it do more: come
  back with the same name, walk to the door and open it, and go in. *The
  wrong order* goes; its lesson, that a door listens only to who stands
  beside it, lives in the new level's hints and wrong programs. The
  course rule "a method with a precondition is taught by a level that
  breaks it" reads "or by the hint of the level that needs it".

## 2. What the owner found, and where it is fixed

| Finding | Cause | Where |
|---|---|---|
| The wizard goes straight from the trunk into the bed; the others walk round. | Not reproduced in the world (`Your bed`'s solution gives four moves then `sleep` at 18,9; the test holds it) nor in the browser test. Most likely the page the owner tried ran an older `world.zip` (the Python world the browser unpacks) than the page's code: the dev server packs it only when started, and nothing tells which world a page runs. | 28.1: the world carries a build stamp the page shows in `?debug` and refuses when older than its own; the walk verified in the game itself, frame by frame. |
| *The morning*: a bad frame as the door closes. | `doorLook` on closing sets the closed state's depth and crossfades the texture at once; the open and closed pictures differ in size (open 403 × 384, closed 403 × 288) and in row (open 15, closed 14), so for a frame the open leaf is drawn at the closed depth or at the closed picture's size. To be confirmed on a frame capture. | 28.2. |
| The first book given to Eldra flies right, to the wall, not up to her. | `give` tweens the image's corner to the middle of the actor's cell, so the image's middle lands half its size right and down of the actor; and the actor's drawn point (nudged on 11,10) is not the cell's middle. | 28.3 (D48). |
| The wizard's steps sound; no one else's do; the wizard's are loud. | `play('step')` is called only on the wizard's `move`, at volume 0.12. | 28.4 (D132). |
| Improve 1 gives the key to Wenna; Fix 1 opens the door in a level of its own: a poor pair. | Course design. | 28.5: *The moving key* as Fix 1 ending at the key; *Eldra's door* as Improve 1. |

## 3. The pieces

### 28.1 The world's stamp, and the walk to bed seen in the game

`app/scripts/pack-world.mjs` writes into `world.zip` a file `stamp.txt`
holding the content hash of the world's Python files and the level and
scene content it packs (the same hash the page's build computes, put
into the page as a constant by Vite, `__WORLD_STAMP__`); `app/src/
engine/debug.ts` shows the world's stamp beside its own in the `?debug`
corner, and `main.ts` refuses to run a level when the two differ, with
the message `level.stale_world` through `t()` in both languages ("The
game's world is older than the page: restart the server." / "El mundo
del juego es más viejo que la página: reinicia el servidor."), shown
where `load_failed` is shown. A unit test of the stamp's comparison.
Then, in the game served by `npm run dev` on a port of the programmer's
own (4174, stopped after), *Your bed*'s solution at speed 1, recorded by
the browser's screencast as sprint 27's hop was: frames at 16,9, 17,9 and
18,9 with the walking frames (`s28-walk-1.png` to `-3.png`), and the
`data-wizard` sequence in the commit. If the walk does not happen there,
the cause is found and fixed in this piece, and the commit says it.

### 28.2 The door closing without a bad frame

`scene.ts` `doorLook`: on a change of state between pictures of
different sizes or rows, the old picture fades out at its own depth and
size while the new one fades in at its own, two images for the fade's
length (the crossfade helper takes the second image's depth, position
and size from `placeThing` for the new state), and the mark and the
depth change when the fade ends; no frame shows a picture at the other
state's depth, position or size. Verified on a frame capture of *The
morning*'s closing (`s28-door-close-1.png` to `-3.png`, a third of the
fade apart) and of *The first night*'s opening and closing; the browser
test reads `data-opening`/the door's texture through the fade. The
commit names the cause found.

### 28.3 A thing given goes to who takes it (D48)

`scene.ts` `give`: the image's tween target is the point where its
middle lies on the actor's drawn point (`figureAt(actor.tile)`, which
holds the nudge and the lowering), a little above the actor's middle
(the actor's height × 0.5), computed as `handsFor` computes the hands'
point for an image's middle; the fade as now. Checked in *The book
returned* (Eldra at 11,10 above the wizard at 11,11: the book goes up)
and in *Eldra's room* (Eldra beside: the book goes sideways to her);
screenshots mid-flight `s28-give-up.png`, `s28-give-side.png`.

### 28.4 Every figure's steps (D132)

`sfx.ts`: two step sounds, `step` for the wizard (triangle wave as now,
volume 0.07, 220 to 180 Hz over 0.06 s) and `step_other` for every other
figure (a sine, 160 to 130 Hz over 0.07 s, volume 0.09); `scene.ts`
plays `step_other` on every actor's walk cell (`walk` for an actor, in a
level's events and a story's steps, the `shoved` walk included), and
`step` on the wizard's as now; a figure walking out from behind a thing
(D128) steps too; a sleeper's walk to bed steps (the wizard's moves do
already). With `sound` off in the settings nothing plays, as now. A unit
test of `sfx`'s table (two step effects, the wizard's quieter) and the
browser test of a story step with two figures walking reads the sounds
played (`data-sounds`, the last names played, if a hook exists; else the
`play` calls are counted through a test seam).

### 28.5 The key and the door as one tale

**`level:the-moving-key`** (Fix 1): as now, with the goal `collect key`
(the give to Wenna goes), bonus `numbers_under 1`; start 7,6, Wenna 8,6
and the mate 9,6; the three ways; the starting code is yesterday's
program as now (its last two lines, the return and the give, gone: it
walks four, picks up); solution `key = wizard.find_nearest("key")`,
`steps = key.distance_to(wizard)`, `wizard.move_left(steps)`,
`wizard.pick_up()`. Texts (Gemini, the brief below): the intro as now
without the return; the outro says the key is in hand and Eldra's door
waits; learned: a variable for a number the program cannot know when it
is written.

**`level:eldras-door`** (Improve 1), new, folder `content/levels/
eldras-door/`: the same scene, start, friends, things and three ways as
*The moving key*; the door at 2,5 locked, `end` 2,4 (inside the room,
the cell above the door; checked walkable on the map, else the door's
cell 2,5 with the door open as *The wrong order* had); goals: `collect
key`, `open door`, `reach E`; bonus `numbers_under 2` (the five to the
door is the one number written). Starting code: the repaired program of
Fix 1 whole (the four lines), then comments one a step: come back to
where you started with the same name (`move_right` and the variable);
walk left to the door's cell, below the door; open it with `open`; go
up through it. Solution: the four lines, `wizard.move_right(steps)`,
`wizard.move_left(5)`, `door.open()`, `wizard.move_up(2)`. Wrong
programs: `door.open()` before walking (the door's `far` refusal, the
old *wrong order*), a return without the variable (`move_right(4)`, wins
one way only). Hints: the first on the return with the same name, the
second "a door only listens to who stands beside it", the third the
whole way. Texts by Gemini: intro in Wenna's voice as the owner put it
("But wait: what if, besides taking the key, you want to open the door?
Let's practise it! Let's try again from the start, but this time, once
you have the key, go to the door and open it."), outro, learned (the
same name used twice, and a program made to do more), title ("Eldra's
door" / "La puerta de Eldra"). **`level:the-wrong-order`** goes: its
folder, its mentions in the tests, the course book, the old briefs'
context lists.

**The course.** `content/chapters/02-the-library/chapter.json`: ...,
`lesson:the-distance`, `level:the-moving-key`, `level:eldras-door`,
`lesson:fendra`, `level:eldras-room`, `story:the-wand-bank`.
`docs/dev/course.md`'s rows (this commit); the stories and *Eldra's
room* start where *Eldra's door* ends (2,4 or 2,5: *Eldra's room*'s
start 2,6 is kept if the end is 2,5 with the wizard then stepping out;
the programmer makes the two agree and says how). One brief,
`tools/write/briefs/chapter-2-key-and-door.md`, for both levels' texts,
with the levels' maps, starts, goals, solutions and the owner's words;
the course book remade. The browser tests of chapter 2 follow.

## 4. Gemini images

None. Texts: one brief (28.5), drafted once and corrected.

## 5. Acceptance test (for when the owner tries it)

Restart the dev server after the build (`npm run dev` in `app/`); on
`https://localhost:5173/?debug`, in a private window, as a girl with the
look `teal`:

1. The `?debug` corner shows the world's stamp equal to the page's. (If
   a level ever says the world is older than the page, the server was
   not restarted.)
2. `#level/your-bed` at speed 1: the wizard walks down one and right two
   cells with its walking steps before turning and hopping in.
3. `#story/the-morning`: the door closes behind the two with no odd
   frame; `#story/the-first-night`: the same opening and closing.
4. `#level/the-book-returned`: the book rises from the wizard to Eldra
   above; `#level/eldras-room`: it goes sideways to her.
5. `#story/the-first-night` and any level: every figure's steps are
   heard, the wizard's softer and of another timbre.
6. `#level/the-moving-key`: Fix 1, ends with the key in hand;
   `#level/eldras-door`: Improve 1, the repaired program given, the
   return with the same name, the door opened and entered; *The wrong
   order* is not on the map.

## 6. What the implementer hands over

A report in Spanish, one thing after another, each explained for a reader
who does not know the code, and then its picture, only pictures of the
final commit: the walk frames; the door's closing frames; the two gives;
the two levels' starts and wins; the commits with their hashes and the
state of `ci/check.sh --e2e`; what differs from this plan and why; the
Gemini draft spent; and the prompt for the designer's review.

## 7. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-28.md (this plan), docs/dev/course.md (chapter 2 and
"How a level earns its idea"), D48, D51, D62, D75, D103, D105, D128,
D130, D131 and D132 in docs/dev/architecture.md and its events table,
tools/write/README.md and rules.md, and the memory notes
kydux-two-agents, kydux-sprint-27-state, kydux-designer-review-27,
kydux-uat-10-chapter-2, kydux-writing-feedback and
kydux-dev-server-build. Build sprint 28: pieces 28.1 to 28.5, one local
commit each, ci/check.sh --e2e green before each, never a push, never a
timer (the owner pushes with ci/push.sh). Never stop or build into the
servers on ports 443 and 5173, and never kill a vite, node or nginx
process of the owner's (CLAUDE.md); your own preview or dev server on
4174 is stopped when you are done. No Gemini image; the two levels'
texts drafted by Gemini through tools/write from the brief the plan
names, read and corrected by you before they enter content/. The plan
decides everything; where it does not, the owner does, through the
designer. Every document and comment in the present. Before git add,
read git diff of each file and stage only your own hunks; commit
promptly. Hand over what section 6 asks, as a report in Spanish, and
end with the prompt for the designer's review in English, in a code
block: the commits, the differences from the plan with their reasons,
what to look at with care, what is left open, and the limits.
```
