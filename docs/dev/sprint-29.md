# Sprint 29 — The rest of the walk as a subtraction, and steps that sound like steps

The owner's pass after sprint 28 (2026-11-01) left two things. In
*Eldra's door* the best program is not to walk back to the start and
then to the door, but to subtract: the steps walked to the key from the
five to the door, and walk the rest; the child should earn the bonus for
that, and the lesson before must teach a sum and a subtraction with a
name. And the steps still sound like a drum: they must be light taps,
like the sample the owner gave (`art/raw/sounds/reference-steps-owner.
mp3`, a reference only), the wizard's its own, the children's alike and
the grown-ups' a little heavier. Two pieces, 29.1 and 29.2, no Gemini
image, one text brief. Chapter 3 is sprint 30.

The rules of the earlier sprints hold: `ci/check.sh --e2e` green and one
local commit a piece, never a push, never a timer (the owner pushes with
`ci/push.sh`); every word for the player through `t()` or a content file;
Gemini writes every text the child reads, from a brief, and the
implementer reads and corrects the draft; documents and comments in the
present (CLAUDE.md); no sound from elsewhere enters the repository (the
game's sounds are synthesized, `sfx.ts`; a sample of another licence is
a reference in `art/raw/`, which git ignores); reports show only pictures
of the current commit. Section 4 is the Gemini budget, section 5 the
owner's acceptance test, section 6 the hand-over, section 7 the prompt.

## 1. Decisions taken here

- **D133 — A sum or a subtraction with a name is taught where a level
  needs the rest of a walk, and a level never asks for a number below
  zero.** Decided 2026-11-01 by the owner. After the variable (D86), a
  lesson teaches that `5 - steps` and `steps + 2` are numbers made from
  a name, kept under a name of their own or written straight into a
  method's brackets, and `print` shows them. The level that needs it
  walks to a key that lies two to five cells away and then the rest of
  the five cells to the door: `rest = 5 - steps`, never fewer than zero,
  since a move of a number below zero is for a later chapter. A level
  that can be won by a longer way gives its bonus to the shorter one:
  the bonus counts the run's ticks (`ticks_under`). Rules out a key
  farther than the door, a subtraction that goes below zero, and a bonus
  the long way earns.
- **D132, built** (this commit, in `architecture.md`): a step is a short
  tap of filtered noise, never a tone; three steps: the wizard's, the
  children's (the friends, Eldra) and the grown-ups' (the teachers,
  Baro), the grown-ups' lower and a little longer, all quiet.

## 2. What the owner found, and where it is fixed

| Finding | Cause | Where |
|---|---|---|
| *Eldra's door*: the best program subtracts; the bonus should go to it; the lesson before must teach sums with a name; the key must never lie farther than the door. | The level was planned with the return by the same name (D86's "used twice"); the course has no arithmetic yet; the far way puts the key at 1,6, six cells, past the door's column. | 29.1 (D133): a lesson, four ways at two to five cells, the bonus by ticks. |
| The steps sound like a drum. | `step` and `step_other` are tones (a triangle and a sine at 130 to 220 Hz). | 29.2: filtered noise taps, three figures' kinds. |

## 3. The pieces

### 29.1 The rest of the walk (D133)

**The ways.** `content/levels/the-moving-key/level.json` and
`eldras-door/level.json`: four ways, the key at 5,6 (`two`), 4,6
(`three`), 3,6 (`four`) and 2,6 (`five`), two to five cells from the
start 7,6; the door at 2,5 above 2,6 as now; `end` 2,6. The content
test that holds the two levels' ways equal, if none, is added.

**The world.** `world/kydux_world/goals.py`: a goal `ticks_under`
(`{"kind": "ticks_under", "count": 8, "bonus": true}`): met when the run
ends in fewer ticks than `count`, as `lines_under` is met by lines; in
`goals` of `level.py`'s checks and in `architecture.md`'s goal table.
`wizard.move_left(0)` (a rest of zero, the key at 2,6) takes no tick and
is no error: a test says so (and a move of a number below zero stays
refused as it is now, with its reason, a test saying which). *Eldra's
door*'s goals: `collect key`, `open door`, `reach E`, bonus `ticks_under
8` (the subtraction takes `steps + 1 + (5 − steps) + 1` = 7 ticks in
every way; the return takes 11 or more); `numbers_under` goes.

**The lesson.** `content/lessons/counting-with-names/` (`lesson:
counting-with-names`, Lesson 7, Wenna, `teaches` `concept:arithmetic`
if the notebook lists concepts so, else nothing), between
`level:the-moving-key` and `level:eldras-door` in `chapter.json`; the
lessons after renumber (Fendra is Lesson 8). Three pages: a number from
a name (`5 - steps` is a number, the five less the steps walked;
`steps + 2` another); keep it under a name or write it in the brackets
(`rest = 5 - steps`, `wizard.move_left(rest)`, or `wizard.move_left(5 -
steps)`); *Try it*: `key = wizard.find_nearest("key")`, `steps =
key.distance_to(wizard)`, `print(5 - steps)`, tried in *Eldra's door*.
No number below zero is mentioned; the key is never past the door.

**The level.** `eldras-door`: starting code the four repaired lines,
then comments: subtract from five the steps you walked and keep the
rest under a name; walk left the rest, to the cell under the door; open
it with `open`. Solution: the four lines, `rest = 5 - steps`,
`wizard.move_left(rest)`, `door.open()`. Wrong programs: the return and
the five (wins, no bonus: a test holds `ticks_under` unmet), `move_left
(5)` after the key (fails the ways but `five`), `door.open()` before
walking. Hints: the rest is five less the steps; a door listens only to
who stands beside it; the whole. Texts (title as now, intro in Wenna's
voice as the owner wrote it plus the subtraction, outro, learned: a
number made from a name) and *The moving key*'s intro ("two to five
steps", not "three, five or seven") drafted by Gemini from one brief,
`tools/write/briefs/chapter-2-the-rest-of-the-walk.md`, with the
lesson's three pages in both languages; corrected by the implementer.
`docs/dev/course.md`'s rows and the lesson's row (this commit); the
course book remade; the browser tests follow.

### 29.2 Steps that sound like steps (D132)

`app/src/engine/sfx.ts`: three step effects, each a tap of noise
through the lowpass filter (the `noise` wave): `step` for the wizard,
0.03 s, the filter from 2600 to 900 Hz, volume 0.05; `step_child` for
the friends and Eldra, 0.035 s, 2200 to 800 Hz, volume 0.06;
`step_adult` for the teachers (Wenna, Ilda, Dask) and Baro, 0.05 s, 1300
to 450 Hz, volume 0.08. Every other step alternates a second variant a
little lower (the filter's frequencies × 0.85), so that a walk does not
tick like a clock. The figures' kinds come from `figures.json`
(`adults`, written by `tools/art/figures.py` from its set of grown-ups,
if not there yet) and the actor's id; the wizard by its id. `scene.ts`
plays the one for the figure walking (stories included, the shove and
the walk out from behind a thing included); `data-sounds` says the
names. The owner's sample (`art/raw/sounds/reference-steps-owner.mp3`,
git-ignored, a reference only, never shipped) is the character to aim
for: the programmer listens to it and to the three taps, and adjusts the
numbers until the taps are light and the grown-ups' a little heavier;
the numbers chosen go in the commit. The `?debug` panel gets a row of
three buttons that play each step, so that the owner tunes by ear and
says the numbers. A unit test of the effects' table (three steps, all
noise, the wizard's the shortest and quietest, the adults' the lowest).

## 4. Gemini images

None. Texts: one brief (29.1).

## 5. Acceptance test (for when the owner tries it)

Restart the dev server after the build; on `https://localhost:5173/
?debug` in a normal window (your saved games are there), as a girl with
the look `teal`:

1. `#lesson/counting-with-names`: three pages on a number made from a
   name; the Try it prints the rest.
2. `#level/the-moving-key`: the key lies two to five cells away in the
   four ways; the repaired program wins them all.
3. `#level/eldras-door`: the subtraction wins all four ways with the
   bonus; the return-and-five wins without the bonus; `door.open()` from
   afar is refused with the door's reason.
4. Steps: in any level and in *The first night*, the wizard's steps are
   light taps, the friends' alike, Ilda's and Wenna's a little heavier;
   none sounds like a drum. The `?debug` row plays each of the three.

## 6. What the implementer hands over

A report in Spanish, one thing after another, each explained for a reader
who does not know the code, and then its picture, only pictures of the
final commit: the lesson's pages, the two levels' starts and wins; the
sounds' numbers chosen; the commits with their hashes and the state of
`ci/check.sh --e2e`; what differs from this plan and why; the Gemini
draft spent; and the prompt for the designer's review.

## 7. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-29.md (this plan), docs/dev/course.md (chapter 2 and
"How a level earns its idea"), D27, D33, D51, D62, D86, D132 and D133
in docs/dev/architecture.md and its goal and events tables,
tools/write/README.md and rules.md, and the memory notes
kydux-two-agents, kydux-sprint-28-state, kydux-designer-review-28,
kydux-uat-11-chapter-2 and kydux-writing-feedback. Build sprint 29:
pieces 29.1 and 29.2, one local commit each, ci/check.sh --e2e green
before each, never a push, never a timer (the owner pushes with
ci/push.sh). Never stop or build into the servers on ports 443 and
5173, and never kill a vite, node or nginx process of the owner's
(CLAUDE.md); your own preview or dev server on 4174 is stopped when
you are done. No Gemini image; the lesson's and the two levels' texts
drafted by Gemini through tools/write from the brief the plan names,
read and corrected by you before they enter content/. No sound file
enters the repository: the steps are synthesized in sfx.ts, the
owner's sample in art/raw/sounds/ is a reference only. The plan
decides everything; where it does not, the owner does, through the
designer. Every document and comment in the present. Before git add,
read git diff of each file and stage only your own hunks; commit
promptly. Hand over what section 6 asks, as a report in Spanish, and
end with the prompt for the designer's review in English, in a code
block: the commits, the differences from the plan with their reasons,
what to look at with care, what is left open, and the limits.
```
