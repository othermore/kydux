# Sprint 9 — The passages

The third chapter of the course (`plan.md`, phase 5; `course.md`, chapter
3). At the end the wizard walks the night passages where Dask patrols, and
learns the ideas that make a program decide and repeat: an expression
that is true or false, `if`, `else`, `for` over a range, and `while` with
a condition; `kirra` lights a dark room and `osto` holds a moving stair.
The world gains what a condition needs to mean something: a level played
in several ways, which the same program must win in all of them; darkness;
stairs that come and go.

The pieces, in this order: 2.15, 2.16, 5.5a, 5.5b. The rules of the
earlier sprints hold: pieces in order, `ci/check.sh --e2e` green and one
local commit per piece, never a push, every word for the player through
`t()` or a content file, nothing forbidden and nothing secret, documents
and comments in the present (CLAUDE.md). Section 7 is the owner's
acceptance test.

Phase 4, the art, still waits on the owner's OpenAI key and autosprite.io
account (plan 4.0); the owner's reading of chapters 1 and 2 is pending,
and its notes become fixes at the start of sprint 10.

## 1. Decisions taken here

- **D51 — A level may be played in several ways, and the program must
  win them all.** `level.json` may have `"ways"`: a list of two or more
  objects, each with an `id` and the fields that differ from the base
  level in that way, `things` and `actors` as lists of `{id, ...}`
  matched by id and merged field by field, `carrying`, `spells` and
  `dark` replaced whole; the map is the same in every way. A run executes
  the child's code once per way, in order, each in its own world, and
  the level is won when every way is won; the first way that is not won
  is the one the scene plays back and the outcome card speaks of, naming
  the way (`text.<lang>.json` has `"ways": {id: words}`, *the door
  locked*, *the door open*); when all are won the first way is played.
  A `#way` select on the level screen replays any way's run, for the
  child to see the other outcome; the timeline and the goals follow the
  way shown. The start card lists the ways. Only a level that teaches a
  condition needs ways; a level without `ways` is one world, as today.
  Rules out a random way per run: the child must see that one program
  handles every case, and a test must be able to say so.
- **D52 — A dark room hides what the wizard cannot see.** `"dark": true`
  in `level.json`: until the room is lit, `find_nearest`, `find_all` and
  a thing's `position` see only what lies within one tile of the wizard,
  and the scene covers every tile but the wizard's and its eight
  neighbours; the map, the doors and the actors are drawn as they are
  (the castle's shapes are known; what lies on the floor is not). The
  spell `kirra` lights the room: a `light` event (`at`), the world's
  `lit` turns true, and the dark is gone for the rest of the run. An
  actor's sight is not darkness's business: Dask carries a lantern, in
  the story, and sees as far as ever. Rules out darkness that moves with
  the wizard (a fog of war), which a child cannot reason about from the
  code.
- **D53 — A stair comes and goes, and `osto` holds it.** A thing of kind
  `stair` lies in a doorway or across a gap, and is in place on some
  ticks and away on others: `"period": 2` means two ticks in place, two
  away, from tick 0 in place. `stair.in_place` is true while the wizard
  can walk onto it; a step onto a stair that is away bumps, as into a
  closed door (`by: "stair"`). `osto`, cast beside a stair, holds it in
  place for six ticks (`HOLD_TICKS`) from the tick it next is in place,
  with a `hold` event (the stair's, in the wizard's tick, `id`, `until`);
  away from a stair, `osto` is refused with `nothing_near`. The scene
  draws the stair in place or away from its period and the holds, since
  the events say the tick. A stair is not a door: it is never locked,
  sealed or opened by hand.
- **D54 — `not`, `==` and `can_see` belong to the lesson on true and
  false.** An expression that is true or false is the idea; `==` asks
  whether two values are the same, `not` turns the answer round, and an
  action can give the answer back (`teacher.can_see(wizard)`,
  `stair.in_place`, `door.locked`). One lesson, since each is a way of
  writing the same kind of question; `and` and `or` wait for the
  challenges.

Each goes in `architecture.md`'s log, dated by `date -I`, with its
rationale and what it rules out; the events table gains `light` and
`hold`, the thing kinds `stair`, and the child's Python `stair.in_place`.

## 2. The content, after this sprint

```
content/
  chapters/03-passages/chapter.json    the items below, in order
  lessons/
    true-or-false/      T12 an expression is a question with a yes or no answer
    if/                 T13 a condition: lines that run only when it is true
    else/               T14 else: the lines for when it is false
    repeat/             T15 for over a range: the same lines a number of times
    while/              T16 while: again and again, as long as it is true
    kirra-and-osto/     T17 two spells: light, and holding a stair
  levels/
    the-watchtower/     L16 print what Dask faces, and whether he can see the wizard
    the-watch/          L17 two ways: Dask looks away, or this way: if, then wait
    left-or-right/      L18 two ways: one of two doors is locked: if, else
    the-long-stairs/    L19 the same two moves eight times: for
    past-the-teacher/   L20 today's, with Dask's intro, after the lesson on while
    the-dark-room/      L21 a dark room, the key somewhere in it: kirra, then find it
    the-moving-stairs/  L22 a stair in the way: wait while it is away, or hold it
    the-night-walk/     L23 the chapter together: dark, a stair, Dask on his round
```

The chapter's items, in order: `lesson:true-or-false`,
`level:the-watchtower`, `lesson:if`, `level:the-watch`, `lesson:else`,
`level:left-or-right`, `lesson:repeat`, `level:the-long-stairs`,
`lesson:while`, `level:past-the-teacher`, `lesson:kirra-and-osto`,
`level:the-dark-room`, `level:the-moving-stairs`, `level:the-night-walk`.

What each level teaches (`api`), beyond chapters 1 and 2: L16
`teacher.facing`, `teacher.position`, `teacher.can_see`; L17 to L19
nothing new (Python's own `if`, `else`, `for`); L20 `wizard.wait`; L21
nothing new (a spell); L22 `stair.in_place`, `thing.position` is chapter
2's; L23 nothing new. The speaker is Dask for the passages' levels, Ilda
for the lessons' voice as always. In L17 and L18 the `ways` make the
condition matter: a program that ignores it wins one way and loses the
other. The bonuses: `uses` of `can_see` (L16), `lines_under` (L19, fewer
than 4 lines), `uses` of `in_place` (L22).

The lessons as D41 says, with care for the three hardest ideas:

- T12 says a question has an answer that is yes or no, `True` or
  `False`; that `3 > 2` and `door.locked` are such questions; that `==`
  asks *is it the same?* and is not `=`; that `not` turns the answer
  round; and that an action can answer, `teacher.can_see(wizard)`.
- T13 says that `if` is *only when*: the lines under it, moved in by four
  spaces, run only when the question's answer is yes; the four spaces
  say which lines belong to the `if`. The level is played two ways, and
  the same program must get through both.
- T15 says that `for step in range(4):` does its lines four times; that
  `step` counts from 0 and the child need not use it; that the lines
  under it are moved in, as under `if`.
- T16 says that `while` is *as long as*: it asks its question, runs its
  lines, and asks again, until the answer is no; and that a `while`
  whose answer never turns to no never ends, which the tick limit stops.

## 3. The pieces

### 2.15 The world for chapter 3: ways, darkness, stairs

**`kydux_world`.** `Level.ways` (D51): `Level.from_dict` keeps the base
and the ways; `level.way(id)` gives the merged `Level` for one way;
`run_code(level, code)` on a level with ways runs each way and returns a
`RunResult` whose `ways` lists each way's own result (id, status, events,
goals, ticks, stdout, error) and whose own fields are the first way not
won, or the first way; `status` is `won` only when every way is. `dark`
(D52): `World.lit`, `Wizard._nearby` and `Thing.position` limited to one
tile in the dark; `kirra` in `SPELLS` sets `lit` and notes `light`.
`Stair(Thing)` (D53), kind `stair`, `period`, `in_place` from the tick
and the holds; `World.is_free` false on a stair away; `osto` in
`SPELLS`. `api.py` gains `stair.in_place`, and the notebook's words.
`explain.py` and the words: `nothing_near` already serves `osto`.

**Tests.** pytest: a level with ways merges each way; a run with ways
reports each, wins only when all do, and shows the first not won; a dark
room hides what is far and shows it once lit; a stair is in place and
away on the right ticks, bumps when away, and holds for six ticks after
`osto`; `check_consistency` for every way; the loader refuses a way
without an id, two ways with one id, a way naming a thing the base
lacks, a stair with no period, a dark level without `kirra` among its
spells. The spells' lists stay held together (`test_library.py`).

### 2.16 The page for chapter 3: ways, darkness, stairs

**The runtime and the controller.** `RunResult.ways` reaches the page;
the controller keeps every way's world and shows one, the first not won,
with a `#way` select (`level.way`, *Way: {name}*) when there are ways,
whose change loads that way's events into the playback and marks the
goals from that way; the outcome card names the way shown
(`outcome.way`, *In the way "{name}":*) before its words, and on a win
says *in every way* (`outcome.all_ways`). The start card lists the ways
(`level.ways`, *This level is played {n} ways:*) with their words from
`text.<lang>.json`. The scene: darkness as a layer over every tile but
the wizard's and its eight neighbours, moving with the wizard and gone
at `light`; the stair drawn in place or away, from its period and the
`hold` events, so that a seek shows it right; the `hold` event shown as
a glow on the stair. `layout.ts` carries the stair's period, `dark`, and
nothing of the ways (the scene is the same in every way: the map does
not change).

**Tests.** Vitest: the controller with a result of two ways, the way
select, the goals of the way shown; the stair's state at a tick from its
period and holds (a pure function in the engine). The browser: in
`the-watch`, a program that ignores Dask wins one way, fails the other,
and the card names it; the way select replays the other; in
`the-dark-room`, the floor is covered until `kirra`.

### 5.5a The passages, to the long stairs

**Content.** Lessons T12 to T15 and levels L16 to L19, in both languages,
with everything a level has (D45's intro from Dask; hints; solution;
three `wrong/`), and chapter 3's `chapter.json` with its items to
`level:the-long-stairs`; `past-the-teacher` stays in the chapter after
`lesson:while`. The `wrong/` of L17 and L18 hold a program with no
condition, which wins one way and not the other: the content tests run
every `wrong/` through every way and require that none wins them all.
`course.md` follows what is built.

**Tests.** The content tests as they are, over every way; `levels.spec.ts`
wins each new level with its solution.

### 5.5b The passages, the night

**Content.** Lessons T16 and T17, levels L21 to L23; Dask's intro on
`past-the-teacher` (its lesson comes before it now, so its text may say
`while` out loud); L23 brings the chapter together: dark, a stair, Dask
on his round, with an `outro` where Dask, impressed, lets the wizard
through, as `story.md` has it.

**Tests.** As 5.5a's; the loop suite needs nothing new.

## 4. Documents

- `architecture.md`: D51–D54; the events table (`light`, `hold`); the
  child's Python (`stair.in_place`); the thing kinds; the run result's
  `ways` under *The world's events*.
- `course.md`: chapter 3's rows say what was built; its world features
  paragraph says they are built.
- `plan.md`: phase 5 says sprint 9 has 2.15, 2.16 and 5.5; phase 2 lists
  2.15 and 2.16.
- `README.md` and `README.es.md`: *Lessons* says three chapters are
  ready.
- `dev-environment.md`: a level's ways and the `#way` select, in a
  sentence, where the level screen is described.

## 5. What this sprint leaves out

Chapters 4 and 5 and the challenges. `and`, `or` and `elif`: the
challenges. A fog of war. A stair the child rides. The art and sound.

## 6. What the owner brings

- The reading of chapters 1 and 2 with notes; fixes at the start of
  sprint 10.
- For phase 4: `OPENAI_API_KEY` in `~/.config/kydux/secrets.env` and an
  autosprite.io account.

## 7. Acceptance test (for when the owner tries it)

1. On the map, chapter 3, *The passages*, has fourteen stops and opens
   once chapter 2 is done.
2. The lesson on true and false explains a question with a yes or no
   answer before any code; in *The watchtower*, `print(teacher.can_see(wizard))`
   shows `True` or `False`.
3. *The watch* says on its start card that it is played two ways. A
   program that walks at once wins one way and is caught in the other;
   the card names the way, and the way select shows both. With `if`, the
   same program wins both.
4. *Left or right*: a program with `if` and `else` goes through
   whichever door is open, in both ways.
5. *The long stairs*: `for` with two moves inside wins in three lines
   and earns the bonus.
6. *The dark room*: the floor is covered but the tiles around the wizard;
   `kirra` lights it, and `find_nearest` then finds the key.
7. *The moving stairs*: the stair comes and goes; `while not
   stair.in_place:` with `wizard.wait()` inside, then a step, gets across;
   `osto` beside it holds it.
8. *The night walk* needs everything of the chapter, and Dask lets the
   wizard through at the end.

## 8. How the implementer works

As in the earlier sprints (sprint-1.md, section 7): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`2.15: ways, darkness and stairs in the world`), never a push; what this
document leaves open decided the simplest way and said in the commit;
what turns out wrong done the working way and logged in
`architecture.md`; a short report to the owner in Spanish at the end,
with what differs.
