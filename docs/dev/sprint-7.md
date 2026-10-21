# Sprint 7 — The story and the first chapter

The first pieces of phase 5 (`plan.md`, *The story and the course*). At the
end the game has a story of its own, written down, a course outlined from
the first lesson to the last challenge, and its first chapter built the way
the owner asked: one idea at a time, each explained in a short lesson of
theory before the levels that practise it. The world gains what the chapter
needs, the wand and the first spells.

The pieces, in this order: 5.1, 5.2, 2.13, 5.3a, 5.3b. The rules of the
earlier sprints hold: pieces in order, `ci/check.sh --e2e` green and one
local commit per piece, never a push, every word for the player through
`t()` or a content file, nothing forbidden and nothing secret. Documents and
comments describe the present state, never the path to it (CLAUDE.md,
*Documents describe the present, not the past*). Section 7 is the owner's
acceptance test, which for this sprint is mostly reading.

Phase 4, the art, waits on two things only the owner can bring: an OpenAI
key for GPT Image in `~/.config/kydux/secrets.env` (`OPENAI_API_KEY`) and
an account on autosprite.io, for the trial of plan 4.0. Sprint 8 takes
phase 4 once they exist; until then the course goes on.

## 1. Decisions taken here

- **D41 — A lesson is one idea: its theory first, then how the game says
  it, then Try it.** A lesson's pages go from why to how: the first page
  or two explain the idea in words a child of eight understands (what a
  program is, what an instruction is, what an object is), with no code or
  with one line of it; the next page shows the idea in the game's API,
  with its example; the last page is Try it, into the first level that
  practises the idea. One idea per lesson, and the levels after it need
  only what the course has taught (D40). Conditions come before loops,
  each alone, and a loop with a condition only once both are known.
- **D42 — Spells.** A spell is a string, cast with the wand:
  `wizard.cast("<spell>")` is an action the wand gives (D27); without the
  wand carried it is refused with *You do not know this action yet*.
  A level says which spells exist in it, `"spells": ["..."]` in
  `level.json`; a name not among them is refused with its own explanation
  (*You do not know a spell called X*). Casting makes a `cast` event
  (`spell`, `at`), which the scene shows as a flash from the wizard, and
  does what the spell does where the wizard stands: for now, breaking the
  seal of a door the wizard stands next to. The spells' names are the
  story's own, from `story.md`; none echoes a famous wizard's.
- **D43 — A door opens by key, by word or by spell.** `level.json`'s door
  has `"locked": true` (needs its key and `door.open()`), or
  `"sealed": "<spell>"` (opens when that spell is cast beside it), or
  `"password": "<word>"` (opens when the wizard says exactly that word
  beside it), or none of them (open by hand). A door has one of the three
  at most. The scene draws the three apart: a keyhole, a glowing rune, a
  mouth. `door.open()` on a sealed or password door is refused, and the
  thought says what the door wants (*This door is sealed: it needs a
  spell*, *This door wants a word*), through the words of D28.
- **D44 — An item's id is its slug; its order is the chapter's.** A
  lesson's or a level's directory is a slug with no number in it
  (`the-corridor`, `your-first-action`); where it comes in the course is
  said by `chapter.json` alone (D32), so that a chapter can gain or lose an
  item without renaming the rest. The chapters keep their number, as they
  are few and their order is the story's.
- **D45 — A level may tell its story on its start card.** `text.<lang>.json`
  may have `"intro"`: one to three short sentences a character says before
  the level, shown on the start card above the goals, with the speaker's
  name from `level.json`'s `"speaker"` (a character id from `story.md`;
  the names are not translated). The win card may have `"outro"` the same
  way. Both optional; the three levels of today have none.

Each goes in `architecture.md`'s log, dated by `date -I`, with its
rationale and what it rules out.

## 2. The content, after this sprint

```
docs/dev/story.md       the story bible (5.1)
docs/dev/course.md      the course outline (5.2)
content/
  chapters/
    01-arrival/         chapter.json: the lessons and levels below, in order
    02-the-library/     chapter.json: ["level:the-locked-door"] for now (5.4 fills it)
    03-passages/        chapter.json: ["level:past-the-teacher"] for now (5.5 fills it)
  lessons/
    what-a-program-is/  T1: a program is a list of instructions, done in order
    your-first-action/  T2: objects and actions: wizard.move_right()
    how-much/           T3: arguments: a number in the brackets
    words/              T4: strings: words in quotes, wizard.say("...")
    things-to-carry/    T5: things on the floor, pick_up(), wizard.items
    your-first-spell/   T6: a spell is a word you cast with the wand
  levels/
    the-gate/           L1  one instruction: walk to the gate              (after T1)
    the-corridor/       L2  a sequence of instructions, one tile each       (after T2)
    the-long-corridor/  L3  an argument: move_right(6); bonus lines_under 2 (after T3)
    the-stairs/         L4  arguments in two directions                     (after T3)
    the-password/       L5  say the word to the door that wants it         (after T4)
    the-pedestal/       L6  pick up the wand                                (after T5)
    the-sealed-door/    L7  pick up the wand, cast the spell at the door    (after T6)
    the-way-in/         L8  two sealed doors and a password door; bonus lines_under 8
    the-locked-door/    chapter 2's, as today, with its id made a slug
    past-the-teacher/   chapter 3's, as today, with its id made a slug
```

The first chapter's items, in `01-arrival/chapter.json`, in this order:
`lesson:what-a-program-is`, `level:the-gate`, `lesson:your-first-action`,
`level:the-corridor`, `lesson:how-much`, `level:the-long-corridor`,
`level:the-stairs`, `lesson:words`, `level:the-password`,
`lesson:things-to-carry`, `level:the-pedestal`, `lesson:your-first-spell`,
`level:the-sealed-door`, `level:the-way-in`.

What each level teaches (`api`), and nothing more: L1 and L2
`wizard.move_right`, `wizard.move_up`, `wizard.move_down`,
`wizard.move_left` as the map needs them (L1 only `move_right`); L3 and L4
the same with numbers; L5 adds `wizard.say`; L6 adds `wizard.pick_up` and
`wizard.items`; L7 adds `wizard.cast`; L8 adds nothing. `door.open`,
`door.locked`, keys and `find_nearest` are chapter 2's; the teacher,
`wait` and `facing` are chapter 3's. The lessons `02-steps` and
`03-watching` of today go, with their content: chapters 2 and 3 get their
own lessons in their sprints, written from the outline.

## 3. The pieces

### 5.1 The story bible

**`docs/dev/story.md`**, in English, for the writers of the lessons and
levels. The school: its name, where it stands, its parts the chapters
visit (the gate and the courtyard, the corridors, the library, the
passages, the broom field, the tower). The characters, each with a name,
a role, how they speak and what they want: the head of the school; the
first teacher, who narrates chapter 1 and whose voice the lessons have
(today's *your teacher*); a second teacher, strict, who patrols in
chapter 3; a friend the wizard makes on the first day; a rival; the
school's cat; a ghost in the library. The spells, each a word of the
game's own with what it does, for all five chapters (the chapter 1 one
breaks seals; the others are named here and built later). The password of
the gate. The wizard's arc through the chapters, in a paragraph each. The
tone: warm, funny, never scary; the child is never mocked. Every name
invented for Kydux: nothing that recalls a famous wizard, a famous school
of magic or the game that inspired Kydux; `tools/forbidden.py` holds the
owner's list, and a reviewer reads the rest. The names that reach the
player (characters, places, spells, the password) are the same in both
languages; a name that is a plain word is a word of neither language, so
that it needs no translation.

**Tests.** The repository's checks already refuse forbidden words. A test
in `tests/project/` reads `story.md` and requires every character id used
by a level's `speaker` (D45) to be defined there.

### 5.2 The course outline

**`docs/dev/course.md`**: the whole course, lesson by lesson, from the
first to the challenges, following the owner's rules (plan, phase 5) and
D41. For each lesson: its chapter, its id, the one idea it teaches, the
page of theory in one sentence, the API it unlocks, and its levels with
their goals and what they practise. The order of ideas: a program and its
instructions; objects and actions; arguments; strings; things; spells;
variables; attributes; expressions that are true or false; conditions
(`if`, then `else`); loops (`for` over a range, then `while` with a
condition); lists; functions; classes. Chapter 1 in full, as section 2
has it; chapters 2 to 5 at the level of lessons and level titles, to be
built in their sprints; ten challenges by name and idea. The outline says
which world features each chapter needs that the world does not have yet,
so that each sprint knows its world work.

### 2.13 The world for chapter 1: the wand, spells and doors

**`kydux_world`.** `Wand(Thing)`, kind `wand`; `wizard.cast(spell)`:
refused without a wand carried (the refusal of D27, a `blocked` event with
`reason: "no_wand"`, which the scene thinks as *You do not know this action
yet* and the explanation says too), refused for a spell the level does not
have (`reason: "unknown_spell"`), else a `cast` event and the spell's
effect: a door next to the wizard whose `sealed` is that spell opens (an
`open` event follows the `cast`, with `by: "spell"`). `Door` gains
`sealed` and `password`, read from `level.json` and checked, one at most,
and refuses `open()` with `reason: "sealed"` or `reason: "password"` (D43).
`wizard.say(word)` beside a password door whose word it is opens it (an
`open` event, `by: "word"`). `api.py` gains `wizard.cast`, `door.sealed`
and `door.password` (attributes, so that a level may teach reading them
later), with their notebook words in both languages; `explain.py` the
explanations. `api.json` follows from the world.

**The scene.** The three doors drawn apart (D43): a keyhole, a rune that
glows, a mouth; the `cast` event: a short flash around the wizard, and the
thought for `no_wand`, `unknown_spell`, `sealed` and `password` through
`words.ts` (D28). The `open` event already opens a door.

**Tests.** pytest: cast without the wand, with the wand and an unknown
spell, with the right spell beside and away from the sealed door; the
password door by the right word, a wrong word, from afar; a door with two
of the three refused by the loader; `open()` on each kind. Vitest for
`words.ts`'s new reasons; the browser: the sealed door opens on the spell,
the thought says why a cast failed.

### 5.3a The first chapter, to the password

**Content.** Chapters `01-arrival` (its items of section 2 as far as
`level:the-password`), `02-the-library` and `03-passages` with their one
level each; the levels of today renamed to their slugs (D44) and the two
lessons of today removed; lessons T1 to T4 and levels L1 to L5, in both
languages, with `solution.py`, three `wrong/` each, hints, `intro` on
each level's start card in the narrating teacher's voice (D45), and the
chapter's `text.<lang>.json`. The lessons in the voice and names of
`story.md`, written as CLAUDE.md says: one idea per sentence, short
sentences, why before how, for a child of eight; the theory page says
what the idea is and why it exists before any code. Every text that
names the wizard with a choice (D37), the child greeted by name where it
is natural. The browser tests that name `01-the-corridor` follow the
rename; the loop suite's words follow the new first lesson.

**The start card** shows `intro` with its speaker's name (D45); the win
card `outro` when there is one. Styles for both.

**Tests.** The content tests already hold a chapter together; they gain:
every level has `intro` or none (no empty one), a `speaker` named in
`story.md`, and the api of each level within what the course has taught up
to it plus its own (D40, D41). The owner reads the texts (section 7).

### 5.3b The first chapter, the wand and the spells

**Content.** Lessons T5 and T6, levels L6 to L8, as section 2 has them,
with everything 5.3a gives each. L8 combines the chapter: a password door,
two sealed doors, the wand on the way, a bonus `lines_under`. Its `wrong/`
hold the mistakes a child makes: the spell cast away from the door, the
wand not picked up, the word in the wrong case.

**Tests.** As 5.3a's. The loop suite gains nothing; `levels.spec.ts`
plays each new level's solution to a win, as it plays today's.

## 4. Documents

- `architecture.md`: D41–D45; the world's events table with `cast`, and
  `open` with `by`; the thing kinds; *Parts* with `story.md` and
  `course.md` under docs.
- `plan.md`: phase 5 says sprint 7 has 5.1, 5.2, 2.13 and 5.3; phase 2
  lists 2.13; section 2.5's content layout follows D44 and D45.
- `dev-environment.md`: the addresses' examples follow the new ids; a
  sentence on `story.md` and `course.md` as where a new lesson starts.
- `README.md` and `README.es.md`: *Lessons* gets its first paragraph: the
  course's chapters by name and idea, and that it grows chapter by
  chapter.

## 5. What this sprint leaves out

Chapters 2 to 5 and the challenges (their sprints). The art and sound
(phase 4, once the owner brings the key and the account). Darkness and
light as a spell's effect, and spells that act on a thing at a distance:
later chapters' spells, in the outline only. A spell as an object (D27):
chapter 5.

## 6. What the owner brings for the next sprints

- For phase 4 (sprint 8): `OPENAI_API_KEY` in `~/.config/kydux/secrets.env`,
  and an account on autosprite.io, with its key or its way of use.
- For chapter 2 (sprint 9): the reading of chapter 1 and the outline
  (section 7), with notes.

## 7. Acceptance test (for when the owner tries it)

1. Read `docs/dev/story.md`: the names recall no famous wizard, the tone
   is the game's, the characters are enough for five chapters.
2. Read `docs/dev/course.md`: the ideas come one at a time, conditions
   before loops, a theory lesson before each idea's levels.
3. In a private window, `https://hija.local:5173`, make a wizard. The
   first lesson explains what a program is before any code. Its Try it
   opens *The gate*, whose start card has a sentence from the teacher.
4. Play chapter 1 to the end in Spanish: each level needs only what its
   lesson and the ones before explained; the notebook shows what was
   taught and nothing more.
5. In *The password*, say a wrong word beside the door: the wizard thinks
   what the door wants. In *The sealed door*, cast the spell without the
   wand: *Todavía no conoces esta acción*; with the wand, away from the
   door: nothing opens; beside it: the door opens with a flash.
6. The map shows chapter 1's fourteen stops, then chapters 2 and 3 with one
   level each, locked until chapter 1 is done.
7. `app/e2e/shots/es/` shows the new first lesson and *The gate*.

## 8. How the implementer works

As in the earlier sprints (sprint-1.md, section 7): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`5.1: the story bible`), never a push; what this document leaves open
decided the simplest way and said in the commit; what turns out wrong done
the working way and logged in `architecture.md`; a short report to the
owner in Spanish at the end, with what differs.
