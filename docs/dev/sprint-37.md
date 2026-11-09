# Sprint 37 — Lessons try ideas, not the wizard; a stop is not an outcome; the card waits for the words; `osto` earns its level

The owner played the whole game after the release of chapter 3 (2026-11-09)
and found one thing above all: the lessons are full of blocks to run that
try nothing, a walk, a wait, a spell, a thing revealed where no scene shows
it, and many a page exists only to hold its block. A lesson's block is for
trying an idea of the language, print, a value, a variable, a sum, an
expression, a condition, where the wizard is at most a value to look at.
Beside it, four faults of the page and the world: the end-of-level card
covers the wizard's words the moment they are said; a run stopped by the
child during its playback is judged as if it had ended, and a wrong spell
earns the bonus of casting; two lessons of chapter 2 follow each other with
no level between; and `osto`, taught and summed up in the story, is needed
in no level. This sprint answers all of it with no Gemini image and no new
scene.

The pieces, in this order: 37.1 to 37.9 (37.9 and D179 added on
2026-11-09 after the build began, with 37.7's rework: section 5's prompt
says what a builder already at work takes up). The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, never a timer; every word for the player through
`t()` or a content file, in English and Spanish; Gemini writes every text
the child reads from a brief, the code of a block the plan's own, word for
word, D141 and the metaphor rule holding; documents and comments in the
present; no content edited while a browser run is going. Section 3 is the
owner's acceptance test, section 4 the hand-over, section 5 the prompt.

## 1. Decisions taken here

- **D174 — A lesson's block tries an idea of the language, not the
  wizard.** Decided 2026-11-09 by the owner (*las pruebas de código dentro
  de las lecciones son sobre todo para probar conceptos de programación
  complejos, sin pensar en el mago y demás; puntualmente se puede usar
  algún atributo del mago si lo necesitamos, pero no tiene sentido usar
  métodos, waits, etc.*). A block (D142) prints a value, keeps one in a
  variable, adds, compares, chooses with `if` and `else`, counts with
  `for`; an attribute of the wizard or of a figure, `position`, `facing`,
  `locked`, appears where the idea needs a value to look at, and a method
  that gives something back only on the page that teaches that very thing.
  No block moves the wizard, waits, picks up, casts, gives, opens or
  reveals: those are the levels'. A page whose words only present its block
  goes with it (D173), and a sentence of it that taught something moves to
  the page before; the lesson's last page leads to the level. Chapter 1's
  first programs, `move_right()`, two lines, an argument, are the one
  exception: there the block is the idea itself (D170 says so). Rules out a
  block written to have one, and a lesson of three pages where two are a
  button.
- **D175 — The card waits for the words, and the words last as long as
  they take to read.** Decided 2026-11-09 by the owner (*si hay un diálogo
  abierto, debería esperar a que se acabe antes de mostrar el cuadro de fin
  de pantalla, en general, para todas las pantallas*). The outcome's card
  of a level appears once no bubble and no thought is on the scene, after
  the celebration of a run won (14.3) and after the last words of a run
  refused, failed or lost alike. A bubble or a thought in a level stays for
  its reading time, 0.8 seconds and 50 thousandths more for each of its
  characters, three ticks at least (so a word of greeting keeps its 1.2
  seconds and the sealed door's sentence of 58 characters stays near 4);
  in a story a bubble stays until its step ends, as before. Rules out a
  card over the reason the wizard stopped, and a sentence gone before it is
  read.
- **D176 — A bonus for casting a spell is earned by the spell, not by the
  word `cast`.** Decided 2026-11-09 by the owner (*si he hecho mal el
  hechizo no debe marcar el bonus extra*). A goal of kind `cast`,
  `{"kind": "cast", "spell": "orvim"}`, is met at the tick the world notes
  a `cast` of that spell; a spell refused, unknown or cast where it does
  nothing, is a `blocked` event and meets nothing. *El pasillo de las
  puertas* gives its bonus by it. `uses` keeps its place for a member read
  or called, `closed`, `position`, `x`. Rules out a star for a misspelt
  spell.
- **D177 — A stop is not an outcome.** Decided 2026-11-09 by the owner
  (*si hago stop, no debe decir que se ha superado el nivel, debe parar
  ahí y no evaluar*). *Parar* pressed while the program runs interrupts it;
  pressed while the scene plays it out, it leaves the figures where they
  are. Neither shows a card, judges a goal, gives a star or marks the level
  done: the editor keeps the child's code and *Ejecutar* runs it again
  from the start. The one stop that keeps its card is the clock's, a
  program that did nothing for its seconds, with the words it has. Rules
  out a win card after a stop.
- **D178 — A hole that never closes on its own, and `osto` the only way
  across, taught after the `while`.** Decided 2026-11-09 from the owner's
  question (*había un sitio donde se sujetaba un agujero en el suelo, pero
  no veo eso en ningún nivel, ¿por qué?*) and their rule (*no quiero que el
  niño use osto y evite el while*): D53 and D167 made `osto` a help, never
  a need, every solution waits with `while` instead, and *Luz y trampas*
  teaches `osto` before *El agujero que se abre*, whose level knows the
  spell, so a child may hold that hole and never write the `while` the
  level is for. `osto` is taught once the `while` is practised: *Luz y
  trampas* teaches `kirra`, `hole.open` and `hole.closed` and no spell for
  the hole; *El agujero que se abre* does not know `osto`; a short lesson
  of its own, *El portal que no se cierra* (`the-portal`, Lesson 11, no
  block, D174), after the story *Las voces* and before *El paseo
  nocturno*, teaches it. A hole with `"period": 0` is open from tick 0 and
  at every tick, a dark portal that never closes by itself, and is closed
  only while `osto` holds it (HOLD_TICKS, D167). *El paseo nocturno*'s
  hole is one: `osto`, cast beside it, is the way across, and the
  chapter's last level uses both its spells. Rules out a spell taught,
  summed up in the story, and never cast, and a spell that spares the
  child the loop.

- **D179 — The browser tests run on GitHub at a release, and by hand.**
  Decided 2026-11-09 by the owner, on the designer's proposal, after every
  run of 2026-11-09 and the one of 0.0.2 failed there: GitHub's runner
  takes 1.8 hours for the 288 browser tests and six of them, the ones
  that wait the longest in real time (the night that falls, the painted
  doors tick by tick, the loop that never ends, Eldra's book, the
  restart), run out of their time, while every one passes on hija. On
  GitHub the `check` job runs on every push and pull request as it does;
  the `e2e` job runs on a version's tag (`v*`) and when started by hand
  (`workflow_dispatch`). The gate stays `ci/check.sh --e2e` on hija before
  every commit (sprint rules); a release tags its version commit
  `v<version>`, and `ci/push.sh` pushes the tags of the commits it pushes.
  Rules out two hours of a private repository's minutes on every push,
  and a red check that says nothing about the code.

## 2. The pieces

### 37.1 The world: the `cast` goal and the hole that never closes

`world/kydux_world/goals.py`: `CastGoal`, kind `cast`, `spell` a known
spell's name (`LevelError` otherwise), met at the tick of a `cast` event
with that spell, as `OpenGoal` is met by its event; the goals' table in
`architecture.md` names it. `content/levels/the-doors-corridor/level.json`:
the bonus `{"kind": "cast", "spell": "orvim", "bonus": true}`; its goal's
words unchanged. `things.py`: `Hole` with `period` 0 is never closed on
its own, closed only within a hold; `_hold` starts at the next tick; the
spec allows 0. `world/tests`: *El pasillo de las puertas* played with
`wizard.cast("orvin")`, `move_right(14)`, `move_up(9)` is won without the
bonus, and with `"orvim"` with it; a hole of period 0 open at ticks 0 to
20, closed from the tick after `osto` for HOLD_TICKS, open again after; a
step onto it bumps before, lands while held.

### 37.2 The page: a stop is not an outcome (D177)

`runtime.ts`: an interrupt says who asked, the child or the clock
(`interrupted_by`), in the run's result. `controller.ts`: a stop by the
child, during the run or during the playback, ends with no outcome, no
goal state, the status `ready` again and the scene left as it is; the
clock's keeps `interrupted` and its card; `done()` after a stop finishes
nothing. `level.ts` follows (no card, no stars, the level not marked
done). Tests: Vitest on the controller for the three cases; a browser test
on *El pasillo de las puertas*: a run whose playback is stopped halfway
shows no card and no star, and the level is still to do; run again whole,
the card won.

### 37.3 The page: the card waits for the words (D175)

`speech.ts`: a bubble's and a thought's ticks from its words' reading time
(D175's numbers, TICK_MS); `settle(): number`, the milliseconds until the
last of them is gone, 0 when none is on. `scene.ts`: `celebrate()` becomes
`settle()`, the longer of the celebration and the speech's; the bubble
said at the last tick of a run (line 678's clearing) expires by the same
time. `controller.ts`: `done()` waits for `settle()` whatever the status,
not only `won`. Tests: Vitest on the reading time (a greeting three
ticks, a sentence of 58 characters nine or ten) and on `settle`; a
browser test on *La puerta sellada*: `zelim` then `move_up(5)`: the
wizard's words are on the scene with no card, and the card comes once they
are gone; and on a run won with a word said at its end.

### 37.4 Chapter 1: the three blocks gone

`content/lessons/words`, `things-to-carry`, `your-first-spell` (`es.md`
and `en.md`): the page *Pruébalo* / *Try it* and its block removed in
each; two pages remain, their words as they are, the last button leading
to the level. `what-a-program-is`, `objects-and-actions` and `how-much`
keep their blocks (D174). `course.md`'s rows say the three have no try;
`lesson.spec.ts` and `test_course_content.py` follow.

### 37.5 Chapter 2: one lesson of what things know, and three blocks gone

`what-things-know` and `finding-things` are one lesson, id
`what-things-know`, before *El libro perdido*, its `lesson.json` teaching
both lists; `finding-things` removed from `content/lessons`, `chapter.json`
and the tests. Its eight pages, in this order: *Lo que saben las cosas*;
*Mirar un atributo*; *Mostrar el valor* with its block (`print(7)`,
`print(2 + 3)`, `print("Hola")`); *Encontrar cosas* (the words of the old
lesson's first page: a method that gives something back, `find_nearest`);
*Una variable* with its block; *Sumar variables* with its block; *Guardar
lo que devuelve un método* and *Hacer que brille* as one page of words
(`None`, `reveal`); *Pruébalo*, whose block finds the nearest door and
prints whether it is locked, and whose words say that the door the friend
opened is the nearest one, so the program answers `False`:

```python
door = wizard.find_nearest("door")
print(door.locked)
```

The old page *Pruébalo* of `what-things-know` (`print(door.locked)` alone)
and the old block of `finding-things` (`book.reveal()`, seen nowhere) go.
Brief `chapter-2-what-things-know-merged.md`: the merged lesson in both
languages, every kept page word for word, the new words of pages 4 and 8
only (D141, *mirar*, never *preguntar*), the block as above; read and
corrected.

`giving-things`, `keys-and-doors`, `fendra`: the page *Pruébalo* and its
block removed; `fendra`'s sentence that teaches (*un hechizo mueve las
cosas, pero tus manos las llevan: debes recoger la cosa una vez que haya
bajado hasta ti*) moves to the end of its page 2, through the same brief
(`fendra`'s two pages otherwise word for word). `the-distance` and
`counting-with-names` keep their blocks: the value the program cannot
know, printed, is their idea (D174). `course.md`, `lesson.spec.ts`,
`lessons.ts` and the content tests follow; the lessons renumber by
themselves from `chapter.json`.

### 37.6 Chapter 3: the blocks that remain try ideas

- `the-cells`: the block (`cast("orvim")`) removed; page 3 keeps its words
  about the word in the map's corner, under a title of its own (*La
  palabra del mapa* / *The map's word*), no invitation to run anything.
- `where-i-am`: page 3 *Pruébalo* removed (it repeats page 1's block);
  page 1 keeps `print(wizard.position)`.
- `waiting`: page 2 *Pruébalo* and its block removed; one page remains.
- `true-or-false`, `else`, `repeat`: unchanged (prints of expressions, an
  `if`/`else` that prints, a `for` that counts).
- `if`: page 2's block becomes the owner's, and page 3 *Pruébalo* goes;
  page 2's words say that Dask looks up now, so the first line is printed,
  and that changing `"up"` to `"down"` prints the cell alone:

```python
if dask.facing == "up":
    print("Mirando hacia arriba")
print("Posición:", wizard.position)
```

  (the English block prints *Looking up* and *Position:*; the colon's
  string carries no trailing space, `print` puts the one space).
- `while`: page 3 *Pruébalo* and its block removed; two pages remain.
- `kirra-and-osto`: page 3 *Pruébalo* and its block removed; page 2 loses
  `osto`'s sentence (the id stays, a slug saved games may hold; the title
  *Luz y trampas* stands, the hole being the trap); `lesson.json` teaches
  as it does.
- `the-two-coordinates`: page 3's block keeps the wizard's position in a
  variable and prints its two numbers, its words saying so:

```python
position = wizard.position
print(position.x)
print(position.y)
```

Brief `chapter-3-lessons-try-ideas.md`: the pages whose words change
(`the-cells` 3, `if` 2, `kirra-and-osto` 2, `the-two-coordinates` 3), both
languages, every other page word for word, the blocks the plan's; read and
corrected. `course.md`'s rows of chapter 3's lessons; `lesson.spec.ts`,
`lessons.ts` and the content tests.

### 37.7 *El portal que no se cierra* and *El paseo nocturno* need `osto` (D178)

`content/levels/the-opening-hole/level.json`: `spells` without `osto`
(`osto` cast there is refused as unknown, as any spell not yet given);
its solution and its four ways as they are. A lesson `the-portal`,
*El portal que no se cierra* / *The portal that never closes*, speaker the
friend, `teaches` the spell `osto`, two pages and no block: the hole of the
way home is a dark portal that never closes on its own, so no wait ends
it; *osto*, cast with the wand from a cell beside it, holds the floor shut
over it for a while, the crack of light showing it is held, and then the
steps across land; in `chapter.json` after `story:the-voices`, before
`level:the-night-walk`. `content/levels/the-night-walk/level.json`: the
hole's `"period": 0`; the goal `{"kind": "cast", "spell": "osto"}` in the
goals' place of the hole (*Sujeta el agujero con* osto), the bonus
`no_bumps` instead of `uses closed`; `solution.py`: from the cell above
the hole, `wizard.cast("osto")` then `move_down(3)`, the rest as it is;
the three ways still won by it. Brief `chapter-3-the-portal.md`: the new
lesson in both languages (D141, the metaphor once: *un portal oscuro*,
then *el agujero*), and *El paseo nocturno*'s `intro` (a hole that never
closes: hold it shut with *osto*), the goals' words, `starting_code`'s
comments and the hints (`osto` from the cell before the hole, then down
3), both languages, the rest word for word; read and corrected.
`world/tests`: the level won by the solution in its three ways, lost by a
`while not hole.closed` wait (the tick limit, the hole never closed); *El
agujero que se abre* refuses `osto`. The plan window and the scene show
the hole open from the start, held with its crack of light after the
spell (35.8), nothing new to draw; the lesson's pages need no picture.

### 37.8 The documents, the walkthroughs and the hand-over

`architecture.md` D174 to D178 (D142, D170 and D173 say where D174 takes
over; D53 and D167 name the hole of period 0; the goals' table; the
events' table if `interrupted_by` reaches it); `course.md` (chapter 2's
lesson rows, chapter 3's rows of the lessons, the new Lesson 11 and *El
paseo nocturno*, the features list); `plan.md` 5.5. The walkthroughs of the three chapters
played again: `npm run walkthrough -- 01-arrival`, `-- 02-the-library`,
`-- 03-passages`. `ci/check.sh --e2e` green. The report in Spanish with
pictures of the final commit (the merged lesson's last page, the `if`
page, the sealed door's words with no card, a stopped playback with no
card, the night walk's hole held), the commits, the differences from the
plan with their reasons, the walkthroughs' paths, what is left open, and
the prompt for the designer's review in English, in a code block.

### 37.9 GitHub runs the browser tests at a release (D179)

`.github/workflows/check.yml`: `on` gains
`push: tags: ['v*']` and `workflow_dispatch`; the `e2e` job runs only
when the ref is a tag `v*` or the run was started by hand, the `check`
job on every push and pull request as now; the header comment says so.
`ci/push.sh`: pushes with `--follow-tags`, so that an annotated tag on a
pushed commit goes with it; its comment says so. `docs/dev/dev-environment.md`,
the release's section: before `ci/push.sh`, `git tag -a v<version> -m
"Version <version>"` on the version commit, and that the browser tests
run on GitHub from that tag; the tag `v0.0.3` on f82322b is the owner's to
make, named in the report. `docs/dev/README.md` where it names the GitHub
check. No test runs for this piece beyond `ci/check.sh`, and the YAML is
read back after the edit.

## 3. What the owner tries

1. *Palabras*, *Cosas que llevar*, *Tu primer hechizo*: two pages each, no
   block, the button leads to the level.
2. *La puerta sellada*: `zelim`, then `move_up(5)`: the wizard's words stay
   on the scene until they are read; the card comes after them.
3. *Lo que saben las cosas*: one lesson of eight pages before *El libro
   perdido*; its last block prints `False`.
4. *Dar cosas*, *Llaves y puertas*, *Un hechizo que alcanza*: no block;
   *fendra*'s page 2 ends by saying to pick the thing up.
5. *El pasillo de las puertas*: `wizard.cast("orvin")` and the two moves:
   won, the bonus star unlit; *Parar* halfway through the playback: no
   card, no star, the level still to do.
6. *Las casillas*, *Dónde estoy*, *Esperar*, *Si*, *Mientras*, *Luz y
   trampas*, *Las dos coordenadas*: the pages and blocks of 37.6; the `if`
   block prints two lines, and one after `"up"` is changed.
7. *El agujero que se abre*: `wizard.cast("osto")` is refused, the
   `while` the only way. *El portal que no se cierra*: two pages after
   *Las voces*. *El paseo nocturno*: the hole open all the time; `osto`
   from the cell above it, then down 3; a `while not hole.closed` wait
   loses by the tick limit.

## 4. What the implementer hands over

As 37.8 says, and the report names the tag the owner makes (37.9).

## 5. The prompt for CLAUDE-programmer

The first prompt went out with the plan as first committed (c432d8d); the
builder began on it. This is the one given after the plan changed
(4dc77fb, D178 and 37.7 reworked; then D179 and 37.9 added).

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux, and
you are already building sprint 37 from docs/dev/sprint-37.md. The plan
changed after you began; read it again whole, and in particular D178,
D179, 37.6's bullet on kirra-and-osto, 37.7 and 37.9, and section 3.
What changed: osto is taught after the while, not before: Luz y
trampas loses its osto sentence, El agujero que se abre no longer knows
the spell, and a short new lesson the-portal (El portal que no se
cierra, Lesson 11, two pages, no block) after the story Las voces
teaches it before El paseo nocturno, whose hole has period 0 and is
crossed with osto; and a new piece 37.9 makes GitHub's e2e job run only
on a version tag or by hand, with ci/push.sh pushing tags and the
release section of dev-environment.md tagging the version. Go on in
order from the piece you are on; if 37.6 or 37.7 are already
committed, bring them to the plan as it now stands in one more commit
each, saying so. Everything else holds: the first prompt's rules,
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/course.md, tools/write/README.md and rules.md, D28, D51, D53,
D141, D142, D167, D170, D173 and D174 to D179 in
docs/dev/architecture.md, the memory notes kydux-two-agents,
kydux-sprint-36-state, kydux-designer-review-36 and
kydux-metaphors-once; one local commit per piece, ci/check.sh --e2e
green before each, never a push, never a timer, never a tag (the owner
tags, pushes with ci/push.sh and releases); never stop or build into
the servers on ports 443 and 5173, never kill a vite, node or nginx
process of the owner's; a port of your own for any preview, stopped
when you are done; no Gemini image; the code of every block the plan's
word for word, the words around it from the briefs the plan names,
read and corrected, every kept page word for word; every document and
comment in the present; before git add, read git diff of each file and
stage only your own hunks. Hand over as section 4 asks, as a report in
Spanish, and end with the prompt for the designer's review in English,
in a code block.
```
