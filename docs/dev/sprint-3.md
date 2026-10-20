# Sprint 3 — The world grows

The first half of phase 2 (`plan.md`): the world gains what the first
chapters need, things to pick up, doors and keys, a teacher on patrol, a
full set of goals, errors said in the child's words, and two levels that
use them. The screen barely changes; the scene learns to draw what the
world now holds. At the end three levels are played: the corridor, a locked
door, and slipping past a teacher.

The pieces are `plan.md`'s, done in this order: 2.1, 2.2, 2.3, 2.9, 2.4,
2.10. Sprint 2's rules hold: pieces in order, `ci/check.sh --e2e` green and
one local commit per piece, never a push, every word for the player through
`t()` or a level's `text.<lang>.json`, nothing forbidden and nothing secret.
The acceptance test, section 6, is for when the owner tries it.

## 1. Decisions taken here

- **D20 — The child's objects are Python objects with read-only state.**
  What the child commands (`wizard`, `door`, `teacher`, a `key`) are
  instances of the world's classes, with methods for what they do and
  properties for what they are. The properties are read-only, and setting
  any attribute on them raises an `AttributeError` whose explanation says
  *You cannot change `wizard.position` yourself: cast a spell to move the
  wizard*. The world's own state lives under
  names the child does not see (`dir()` hides them). This is a second line,
  like D19: the browser's sandbox stays the wall, and a child who digs past
  it cheats only themselves.
- **D21 — One tick is one thing done.** Every call that does something
  (`move_*` per step, `say`, `wait`, `pick_up`, `open`) advances the world
  one tick, and in each tick, after the wizard, every actor takes its step
  and the goals are checked. Asking (`find_nearest`, reading an attribute,
  `can_see`) takes no tick. So a run's length is what the child did, and
  the playback plays exactly that.
- **D22 — Errors are explained by the world, said by the page.** The world
  turns a Python exception into an explanation, a kind and its parameters,
  with suggestions from the names the level exposes; the page says it
  through `t()` in the player's language. Python's own text stays
  underneath, for an adult.
- **D23 — A level says what it teaches.** `level.json` lists the API the
  level uses (`api`), and a test refuses a solution that calls anything
  outside it, so the course's order cannot be broken by accident. The
  grimoire and the editor's completion (sprint 4) show that list.

Each goes in `architecture.md`'s log, dated by `date -I`, with its
rationale and what it rules out.

## 2. The child's Python after this sprint

Every name a child meets, in English, `snake_case`, with a docstring (the
grimoire reads them in sprint 4). Nothing here takes a tick unless it says
so.

```python
# The wizard: always there.
wizard.move_right(steps=1)      # one tick per step; stops at a wall or a closed door
wizard.move_left(steps=1)
wizard.move_up(steps=1)
wizard.move_down(steps=1)
wizard.say(text)                # one tick
wizard.wait(ticks=1)            # one tick each: stands still while the world moves on
wizard.pick_up()                # one tick: the thing on this tile goes into wizard.items
wizard.find_nearest(kind)       # the nearest thing of a kind ("key", "door", "book"...), or None
wizard.find_all(kind)           # a list of them, nearest first
wizard.position                 # Position(x, y): wizard.position.x, wizard.position.y
wizard.facing                   # "up", "down", "left" or "right"
wizard.items                    # a list of the things it carries
wizard.has(kind)                # True when it carries one of that kind

# A thing on the map, or carried: a key, a wand, a book, a potion.
thing.kind                      # "key"
thing.name                      # its id in level.json, "silver_key"
thing.position                  # where it lies; None once carried

# A door: a thing that stands in a doorway.
door.locked                     # True until opened with its key
door.is_open                    # True once opened; an open door lets the wizard through
door.open()                     # one tick: opens it, when it is not locked or the wizard
                                # carries the key that opens it; else a `blocked` event

# An actor: the teacher, for now.
teacher.position
teacher.facing
teacher.can_see(wizard)         # True when the wizard is in front of them, in a straight
                                # line, within 4 tiles, with nothing closed in between
```

The level puts the things and actors it has into the child's namespace
under their ids (`door`, `key`, `teacher`), beside `wizard`; a level with
two doors gives `left_door` and `right_door`. A thing's position and a
`Position` compare as tuples, so `wizard.position == door.position` works.

### Errors, as the child reads them

| What happened | Kind, parameters | English (the Spanish beside it in `i18n/es.json`) |
|---|---|---|
| `AttributeError` on a world object | `unknown_spell` `{object, name, suggestion?}` | The wizard does not know the spell `mvoe_right`. Did you mean `move_right`? |
| `NameError` | `unknown_name` `{name, suggestion?}` | There is nothing called `wizrd` here. Did you mean `wizard`? |
| Setting an attribute (D20) | `read_only` `{object, name}` | You cannot change `wizard.position` yourself: cast a spell to move the wizard. |
| `SyntaxError`, a bracket or quote left open | `unclosed` `{what}` | This line opens a `(` that never closes. |
| `SyntaxError`, a `:` missing after `if`/`while`/`for`/`def` | `missing_colon` `{keyword}` | A line that starts with `while` ends with `:`. |
| `IndentationError` | `indentation` | The lines inside a `while`, `if` or `for` need four spaces in front. |
| any other `SyntaxError` | `syntax` `{message}` | Python cannot read this line: {message}. |
| `TypeError`/`ValueError` from a spell's arguments | `arguments` `{name, example}` | `move_right` takes a number of steps, like `move_right(3)`. |
| `TypeError`, a spell called without `()` or with too many arguments | `arguments` | (the same, with the spell's example) |
| `ModuleNotFoundError` for a refused module (D19) | `no_such_module` `{name}` | There is no spell book called `js` in this school. |
| `ModuleNotFoundError`, any other | `no_such_module` | (the same) |
| `TooManyTicks` | (status `too_many_ticks`, as now) | |
| anything else | `other` `{type, message}` | Python says: {type}: {message} |

`suggestion` comes from `difflib.get_close_matches` against the names the
level exposes (`api`) for a spell, and against `wizard` plus the level's
ids for a name; `example` comes from the spell's docstring's first
backticked call. The page adds ` (line {line})` as today.

## 3. Repository layout after the sprint

```
world/kydux_world/
  level.py        Level: map, things, actors, api, goals; LevelError
  world.py        World, Wizard, ticks, events; actors' steps each tick
  things.py       Thing, Door, Key; the read-only base (D20)
  actors.py       Actor, Teacher: patrol, facing, can_see
  goals.py        reach, collect, open, say, not_seen_by, lines_under; bonus; goals.py per level
  explain.py      a Python exception -> {kind, params} (D22)
  run.py          RunResult gains status "caught" and error.explanation
  api.py          the names a level may expose, their docstrings and examples (D23)
world/tests/      one file per module, plus test_levels_content.py grown
app/src/engine/
  placeholders.ts door closed/open, key, book, wand, teacher (four facings), the sight cone
  scene.ts        draws things and actors, plays their events
app/src/ui/outcome.ts  says an explanation through t()
content/levels/
  01-the-corridor/     api added; a third wrong answer
  02-the-locked-door/  level.json  text.en.json  text.es.json  solution.py  wrong/ (3)
  03-past-the-teacher/ the same
i18n/<lang>.json       error.* keys
```

## 4. The pieces

### 2.1 The level definition, grown

`level.json`:

```json
{ "id": "02-the-locked-door",
  "map": ["##########",
          "#S...K...#",
          "#######D##",
          "#......E.#",
          "##########"],
  "things": [
    { "kind": "key",  "id": "key",  "marker": "K", "opens": "door" },
    { "kind": "door", "id": "door", "marker": "D", "locked": true }
  ],
  "actors": [],
  "api": ["wizard.move_right", "wizard.move_left", "wizard.move_up", "wizard.move_down",
          "wizard.pick_up", "wizard.find_nearest", "wizard.position", "wizard.items",
          "door.open", "door.locked", "thing.position"],
  "goals": [
    { "kind": "collect", "id": "key" },
    { "kind": "open", "id": "door" },
    { "kind": "reach", "marker": "E" },
    { "kind": "lines_under", "lines": 6, "bonus": true }
  ],
  "tick_limit": 100 }
```

- A thing or actor is placed by `marker` or by `at: [x, y]`; its `id` is
  the name the child uses and must be a Python identifier not `wizard`;
  ids are unique. A marker with no thing on it stays a plain floor tile
  the goals may name (`E`).
- `api` is a list of dotted names; `Level.from_dict` refuses a name
  `kydux_world.api` does not know. Reading an attribute is listed as the
  attribute (`wizard.position`), a method as the method.
- `goals` may carry `"bonus": true`: not needed to win, counted for stars
  later. A level needs at least one goal that is not a bonus.
- `tick_limit` as before. `Level` gains `things`, `actors`, `api` and
  validation of all of it with messages that say what is wrong.

`kydux_world/api.py` holds the registry: for each dotted name, the class
and member it refers to, so that `Level.from_dict` can check it and the
test of 2.10 can check a solution against it. Docstrings live on the
classes; `api.py` reads them.

**Tests:** parsing of things, actors, api and bonus goals; every refusal.

### 2.2 Things, doors, keys, and the teacher

**`things.py`.** `Thing` with `kind`, `name`, `position` (a property,
`None` once carried) and the read-only base of D20 (`__setattr__` refuses
with the `read_only` explanation; `__dir__` shows the child's names only;
the world's state under `_Thing__world`-style names). `Key(opens: str |
None)`. `Door(locked: bool)` with `is_open` and `open()`: when locked and
the wizard carries no key that opens it (a key whose `opens` is the door's
id, or any key when the door names none), records `blocked` with
`{"at": door tile, "by": "door", "reason": "locked"}` and stays closed;
else records `open` with `{"id": ..., "at": ...}` and the doorway becomes
free. Opening takes a tick either way. A door's tile is not free while it
is closed: a move into it is a `bump` with `"by": "door"` (a wall's bump
gains `"by": "wall"`).

**`world.py`.** `Wizard` gains `wait`, `pick_up`, `find_nearest`,
`find_all`, `has`, `items`, and `position`/`facing` as properties.
`pick_up` on a tile with nothing records `blocked` `{"reason": "nothing"}`.
`find_*` measure Manhattan distance from the wizard, ties by reading
order. `World.record` runs the actors' step after appending the wizard's
event and before checking the goals: each actor's step records its own
events (`move`, `turn`) with the same tick and the child's line. The
namespace handed to the child's code (`run.py`) holds `wizard` and every
thing and actor by id.

**`actors.py`.** `Actor(kind, name, position, facing)` on the same
read-only base; `Teacher(patrol: list[Position], sight: int = 4)`: walks
the patrol path one tile per tick, back and forth (`A B C B A B ...`),
turning to face the way it walks, and turns in place at an end for one
tick before coming back; `can_see(target)` is true when the target stands
on one of the up to `sight` tiles straight ahead and no wall or closed
door stands between. Seeing the wizard records `seen` `{"by": "teacher",
"at": wizard tile}` and ends the run as `caught` (2.3).

**`placeholders.ts` and `scene.ts`.** Placeholders for a closed door
(brown planks on the wall's colour), an open door (a dark doorway), a key,
a book and a wand (small, on the floor tile), the teacher (a grey robe,
four facings), and the sight cone (a translucent yellow over the tiles the
teacher sees, redrawn each tick from the teacher's position and facing,
stopping at walls and closed doors). The scene draws every thing and actor
from `level.json` at the start and plays their events: `pick_up` makes
the thing vanish, `open` swaps the door's frame, `blocked` shakes the door
or the wizard, an actor's `move` tweens it, `turn` sets its frame, `seen`
flashes the cone. `data-wizard` as before; `data-actors` gains
`teacher:x,y,facing` pairs joined by `;`, for the tests.

**Tests:** pytest for everything above, including the patrol's rhythm and
`can_see` through an open and a closed door, and a Vitest for the cone's
tiles (a pure function `sightTiles(level, position, facing, sight)` shared
by the scene, with the same rule as Python's; a test fixture lists cases
both suites run).

### 2.3 The goals

`goals.py` grows: `reach` (marker or at), `collect` (`id`, or `kind`:
the wizard carries it), `open` (`id`), `say` (`text`: said exactly once or
more), `not_seen_by` (`id`: fails fatally at `seen`), `lines_under`
(`lines`: the code has fewer lines than that, blank and comment lines not
counted; checked once, before the run), and a level's own `goals.py`
beside `level.json`, loaded by the world under `kydux_world.levels.<id>`,
exposing `GOALS: dict[str, type]` of its own kinds, each a class with
`check(world) -> bool` and an optional `failed(world) -> bool`.

`GoalResult` gains `failed: bool` and `bonus: bool`. `RunResult.status`
gains `caught`, set when a fatal goal fails; the events up to the `seen`
are kept. `won` is every goal that is not a bonus met and none failed.

The level screen's outcome gains `caught` (`outcome.caught`: *The teacher
saw you! Try again, and watch which way they look.*) and the goals panel
marks a failed goal `failed`, a bonus goal with a star in its text
(`goals.bonus` prefix, "Bonus: ").

**Tests:** each goal met, not met, failed; bonus not counted for `won`; a
custom `goals.py` loaded; `caught` keeps the events.

### 2.9 The world refuses to be tampered with

D20 done: the read-only base on `Wizard`, `Thing`, `Door`, `Key`, `Actor`,
`Teacher`; the world reachable from none of them by a public name; and
`run.py` checks a result's consistency before returning it: every
`met_at_tick` is a tick that exists, `ticks == len(events)` on the wizard's
side, and the final `won` is recomputed from the goals. The explanation
`read_only` for a set attribute.

**Tests:** `wizard.position = (7, 1)` is an `AttributeError` with the
explanation; `wizard._world` and `dir(wizard)` give nothing of the world's;
a solution that only sets attributes does not win.

### 2.4 Errors in the child's words

`explain.py`: `explain(error: BaseException, level: Level) -> Explanation
| None` with `kind` and `params` as in section 2, and the suggestion logic.
`ErrorInfo` gains `explanation`. `outcome.ts` says it: a `switch` on the
kind with one `t('error.<kind>', params)` each, falling back to
`outcome.error` with Python's text when there is no explanation. The keys
in `i18n/en.json` and `es.json` under `error`, with the texts of section 2
and their Spanish.

**Tests:** pytest, one per row of the table, with the suggestions; Vitest
for `outcomeText` with an explanation in both languages; the level
browser test's error step now expects the child's words.

### 2.10 Two more levels

- **`02-the-locked-door`** (section 4, 2.1): pick up the key, open the
  door, reach the room beyond; bonus under six lines. Solution with
  `find_nearest` and `door.open()`. Wrong: walking to the door without the
  key (blocked), picking up before reaching the key (nothing), reaching the
  room through the wall (bump). Texts: title *The locked door* / *La puerta
  cerrada*, goals, starting code with comments in each language.
- **`03-past-the-teacher`**: a corridor the teacher patrols, facing the
  way they walk; the wizard waits in a side nook and crosses when the
  teacher looks away; goals `reach` and `not_seen_by`. Solution with
  `wait` and `can_see` in a `while` (the ideas of chapter 3; the level is
  the engine's proof, and the course of phase 5 will place it). Wrong:
  walking straight in (caught), waiting for ever (too many ticks), crossing
  too early (caught).
- `01-the-corridor` gains `api` and a third wrong answer.
- **`test_levels_content.py`** grows: every level has `api`, its solution
  calls nothing outside it (by `ast`: every `wizard.x`, `door.x`... whose
  name is a thing's or actor's id), at least three wrong answers, both
  texts, and a `starting_code` that runs without an error (it may not
  win).
- `tools/i18n_check.py` already keeps the texts in step.
- `app/e2e/levels.spec.ts`: the two levels played in the browser to
  `won`, the teacher's `data-actors` seen moving, a `caught` run saying
  so, the locked door's `blocked` leaving it closed.

**Done when** the three levels pass pytest and the browser, in both
languages.

## 5. Documents

- `architecture.md`: D20–D23; *Parts* with `things.py`, `actors.py`,
  `explain.py`, `api.py`; the event kinds listed in one place (the
  `WorldEvent` table: kind, actor, data, what the scene does).
- `plan.md`: phase 2's pieces say which sprint has them (this one: 2.1,
  2.2, 2.3, 2.9, 2.4, 2.10; sprint 4: 2.0, 2.5, 2.6, 2.7, 2.8), and 2.2's
  text gains `wait` and the teacher's rhythm.
- `draft.md`'s API sketch (section 1) is replaced by a pointer to
  `architecture.md`'s API section, so that one place says what the child
  can type.

## 6. Acceptance test (for when the owner tries it)

1. `#level/02-the-locked-door`: the key and the door show; the starting
   code walks to the key; `wizard.pick_up()` makes it vanish and
   `wizard.items` holds it; `door.open()` before the key is picked up
   shakes the door and the card says the door is still locked; the
   solution wins with the goals ticking in order and the bonus star.
2. `#level/03-past-the-teacher`: the teacher walks back and forth with the
   yellow cone ahead; walking straight in gets the wizard caught, with
   the card saying so; waiting with `while teacher.can_see(wizard):
   wizard.wait()` and then crossing wins.
3. Misspell `move_right` and see *The wizard does not know the spell…
   Did you mean `move_right`?* in the page's language; forget a `:` after
   `while` and see the colon message; `wizard.position = (7, 1)` and see
   *You cannot change…*.
4. The corridor still plays as before.

## 7. How the implementer works

As in sprints 1 and 2 (sprint-1.md, section 7): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`2.2: things, doors, keys and the teacher`), never a push; what this
document leaves open decided the simplest way and said in the commit;
what turns out wrong done the working way and logged in `architecture.md`;
a short report to the owner in Spanish at the end, with what differs.
