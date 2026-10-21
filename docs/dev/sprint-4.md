# Sprint 4 — The level, finished

The second half of phase 2 (`plan.md`), with the owner's findings from the
acceptance test of sprint 3 first. At the end a level is played the way the
course will play it: the game's words are the right ones, every action that
could not be done says why, a card opens the level and another closes it
with stars and *Next*, hints help a child who is stuck, the notebook shows
what the wizard can do, and the playback can be dragged back and forth.

The pieces, in this order: 2.11, 2.12, 2.0, 2.7, 2.5, 2.8, 2.6. The rules of
the earlier sprints hold: pieces in order, `ci/check.sh --e2e` green and
one local commit per piece, never a push, every word for the player through
`t()` or a level's `text.<lang>.json`, nothing forbidden and nothing secret.
Section 7 is the owner's acceptance test, for when they try it.

## 1. Decisions taken here

- **D27, already in the log**: an *action* is a method, a *spell* is named
  magic, the button is *Run*, the panel is the *notebook*. This sprint
  applies it everywhere.
- **D28 — An action that cannot be done says why, where it happens.** A
  `blocked` event is shown as a thought over the wizard, in the child's
  words, at the tick it happens; the run's card repeats the first one with
  its line when the run is not won. An attempt that could not even be made
  (a door too far away) is not animated as a try: there is nothing to try.
- **D29 — The level screen is a view of a controller.** `RunController`
  holds the state of a run and what each button does, apart from the DOM
  and tested by Vitest; the screen renders what the controller says.
- **D30 — The notebook's words come from two places by design.** A
  member's example is its docstring's, in the code; its description is in
  `i18n/<lang>.json` under `notebook`, so that the child reads it in their
  language while the code stays English. The world exports its table of
  members as `api.json` at build time, so the page needs no Python to show
  it.

Each goes in `architecture.md`'s log, dated by `date -I`, with its
rationale and what it rules out.

## 2. The pieces

### 2.11 The game's words

D27 applied to everything the child sees, and to the code and documents
that say *spell* for *method*.

**Texts.** In `i18n/en.json` and `es.json` (the Spanish beside each):

| key | before | now |
|---|---|---|
| `level.cast` | Cast | removed; `level.run` **Run** / **Ejecutar** |
| `level.running` | The spell is running… | **Your program is running…** / **Tu programa está en marcha…** |
| `level.code_label` | Your spell, in Python | **Your program, in Python** |
| `outcome.too_many_ticks` | The wizard is tired: the spell ran more than {limit} steps… | **Your program has taken more than {limit} steps and the wizard is tired. Is there a loop that never ends?** |
| `outcome.interrupted` | The spell was stopped… | **Your program was stopped: it ran for more than {seconds} seconds without doing anything.** |
| `error.unknown_spell` | `{object}` does not know the spell `{name}`. | removed; `error.unknown_action` **`{object}` does not know an action called `{name}`.** |
| `error.not_called` | …a spell is cast with brackets… | **`{name}` is an action. An action is done with brackets after it, like `{example}`.** |
| `error.arguments` | `{name}` is not cast like that… | **`{name}` is not used like that. Try it like this: `{example}`.** |
| `error.read_only` | You cannot change `{object}.{name}` yourself: cast a spell to make it change. | **You cannot change `{object}.{name}` yourself. An action changes it.** |
| (new) `error.no_new_attribute` | | **You cannot give `{object}` a new `{name}`. What `{object}` can do is in its notebook.** |
| `error.no_such_module` | …no spell book called… | **There is no book called `{name}` in the school's library.** |
| `app.isolated_yes`, `app.isolated_no` | | removed from the page (below) |

The Spanish texts say the same, in the owner's words: *Ejecutar*, *Tu
programa está en marcha…*, *acción*, *cuaderno*, *libro de la biblioteca*.

**The isolation line.** It is a diagnostic, not something for a child. The
footer loses it; `main.ts` sets `document.documentElement.dataset.isolated`
to `true` or `false` instead, which the browser tests read, and logs one
`console.info` line saying the same for a developer. The status line keeps
*Starting Python again…*, which the child does see.

**The world.** In `explain.py` the kind `unknown_spell` becomes
`unknown_action`, and `read_only` is split: `ReadOnly` gains `exists`,
true when the attribute is one the object has, and `explain` gives
`read_only` for one that exists and `no_new_attribute` for one that does
not. `SpellArguments` becomes `ActionArguments`, `spells_of` becomes
`actions_of`. Every docstring and comment that says *spell* for a method
says *action*; the `Wizard` class's docstring says what its actions are.
`world/tests/test_explain.py` covers the split, with the owner's own case:
`wizard.caminar_derecha = ...` gives `no_new_attribute`.

**Documents.** `architecture.md` outside the log, `plan.md` and `draft.md`
say *action*, *Run* and *notebook* where they said *spell*, *Cast* and
*grimoire*. The sprint documents of sprints done are kept as they were
written; `docs/dev/README.md` says so in one line, and that what changed
after is in the decision log.

**Done when** `grep -ri spell` over `app/src`, `i18n`, `world` and the
documents outside the log and the old sprints finds only the spells of the
story (`wizard.cast`, D27, the future `wizard.spells`), the browser tests
pass with the new words, and the page says *Ejecutar*.

### 2.12 Why an action could not be done

D28. The reasons already exist in the world's `blocked` events; the page
says them.

**The world.** `blocked` keeps its data, `at`, `by` and `reason`, and
gains `tried: bool`: `true` when the wizard tried something and it did not
work (a locked door, nothing to pick up), `false` when it could not even
be tried (`far`, `open`). `Door.open()` from afar records `tried: false`.
Later actions that need a thing the wizard lacks (the wand, the broom)
record `reason: "unknown_action"`, said as *You do not know this action
yet* (D27); not built now, but the key exists.

**The scene.** On a `blocked` event, a thought bubble over the wizard,
drawn differently from a `say` bubble (grey, rounded, with two small
circles beneath it), with the reason in the child's words, for three
ticks; the door or the wizard shakes only when `tried` is true. The scene
writes the thought's text to `data-thought` on its parent while it shows.
The words, through `t()` in `app/src/engine/words.ts` (the scene asks the
page for them; the engine stays free of i18n otherwise):

| reason | key | English |
|---|---|---|
| `far` | `blocked.far` | I cannot reach `{thing}` from here. |
| `locked` | `blocked.locked` | `{thing}` is locked, and I have no key for it. |
| `open` | `blocked.open` | `{thing}` is already open. |
| `nothing` | `blocked.nothing` | There is nothing here to pick up. |
| `unknown_action` | `blocked.unknown_action` | I do not know this action yet. |

`{thing}` is the thing's id as the child typed it (`door`).

**The card.** When a run is `incomplete` and had a `blocked` event, the
card adds a second line, `outcome.blocked`: **On line {line}: {reason}**,
with the first blocked event's reason and line. The reason is the same
text as the thought.

**Tests.** pytest for `tried`; Vitest for the words; the browser: opening
the door from afar shows the thought and no shake (`data-thought` set, and
the door's image position unchanged, read through a `data-shaking`
attribute the scene sets while a shake tween runs), opening it without the
key shows the locked thought and the card's second line.

### 2.0 The run controller

D29. `app/src/ui/controller.ts`:

```ts
export type RunState = 'loading' | 'ready' | 'running' | 'playing' | 'done' | 'failed';
export interface RunSnapshot {
  state: RunState;
  world: WorldResult | null;          // the last run's
  outcome: Outcome | null;            // what the card says, null while hidden
  runningLine: number | null;
  errorLine: number | null;
  goals: GoalMark[];                  // one per goal, at the tick being shown
  tick: number; length: number;       // of the playback
  speed: Speed;
}
export class RunController {
  constructor(parts: { runtime: RuntimeLike; scene: SceneLike; level: LoadedLevel; speed: Speed });
  readonly snapshot: RunSnapshot;
  run(code: string): void;            // Run: stops a playback, clears, runs, plays
  stop(): void;                       // interrupts a run, or stops a playback
  restart(): void;                    // back to the start, card hidden
  setSpeed(speed: Speed): void;
  seek(tick: number): void;           // 2.6
  onChange(listener: (s: RunSnapshot) => void): () => void;
  destroy(): void;
}
```

`RuntimeLike` and `SceneLike` are the interfaces the controller needs of
`Runtime` and `SceneHandle`, so that Vitest gives fakes. The controller
holds what `level.ts` holds today in closures: `world`, the goal marks per
tick, the outcome, the lines. `level.ts` becomes the view: it makes the
DOM once, subscribes to `onChange`, and renders the snapshot into it;
every button calls one method. The behaviour of today's browser tests is
unchanged.

**Tests.** `controller.test.ts`: the states through a run that wins, one
that errs with events, one with none, an interrupt, a restart, a Run
during a playback, a speed change mid-playback.

### 2.7 The cards that open and close a level

**The start card.** Shown over the scene when a level opens for the first
time in a session (`sessionStorage`, `kydux.started.<id>`), and again from
a *?* button (`level.about`) beside the title: the level's title, its goals
with their bonus marks, and a *Start* button (`level.start`); `Escape`
closes it too. Its picture and example come with the lessons (phase 3).

**The win card.** Shown over the scene when a run is won, after the
playback ends: *You did it!*, the stars, and two buttons, *Play again*
(`level.again`, closes the card) and *Next* (`level.next`). Stars: one
for winning, one more for each bonus goal met, three at most, drawn as
`★` with the empty ones as `☆`, and said for screen readers as
`level.stars` (*{n} of 3 stars*). On the last level, *Next* is replaced
by `level.last` (*That is all for now. More levels are coming.*).

**The levels' order.** `pack-world.mjs` writes `public/content/levels.json`:
the level ids in order, the directories' names sorted. `content/levels.ts`
loads it; `nextLevel(id)` gives the next id or null. *Next* goes to
`#level/<next>`, and `main.ts` already opens it.

**Tests.** Vitest for the stars and `nextLevel`; the browser: the start
card on a first visit and not on a second in the same session, *Start*,
*?* opening it again, the win card with its stars after the locked door's
five-line solution (two stars), *Next* going to the teacher's level, and
the last level saying so.

### 2.5 Hints

**Texts.** `text.<lang>.json` gains `hints`, a list in order, from the
gentlest to the one that nearly says it; `tools/i18n_check.py` requires
as many hints in every language. The three levels get two or three each,
in both languages, written for a child of eight: the corridor (*How many
tiles is the door away? Count them.*; *`move_right` can take a number.*),
the locked door (*The door needs the key. Where is the key?*; *Stand next
to the door before you open it.*; *`door.open()` opens it once you carry
the key.*), the teacher (*Watch which way the teacher looks.*; *`wizard.wait()`
lets a tick go by.*; *A `while` can wait while `teacher.facing` is `"left"`.*).

**The screen.** A *Hint* button (`level.hint`) beside *Restart*, enabled
after the first run that does not win; each press shows the next hint in a
box under the editor (`level.hint_n`, *Hint {n} of {total}*), and the
button is disabled after the last. The hints shown stay for the session
(`sessionStorage`, `kydux.hints.<id>`). A hint never contains the
solution; the content check (2.10's test) refuses a hint that is a line
of `solution.py`.

**Tests.** The content check; the browser: the button disabled before a
run, enabled after an incomplete one, the hints in order, in both
languages.

### 2.8 The notebook, and completion in the editor

D30. **`api.json`.** `kydux_world/api.py` gains a `__main__` that prints
the table as JSON, each member with its role, its name, whether it is an
action or an attribute, and its example from the docstring:
`python3 -m kydux_world.api`. `pack-world.mjs` runs it (with `.venv`'s
Python when there is one, else `python3`) and writes `public/api.json`;
CI has the world installed, so it works there.

**Descriptions.** `i18n/<lang>.json` gains `notebook.<role>.<member>` for
every member of the table, one sentence each, in both languages
(`notebook.wizard.move_right`: *Walks right, one tile per step. Stops at a
wall or a closed door.*). `tools/i18n_check.py` requires one for every
member of `api.json`, so a new member cannot be added without its words.

**The panel.** A *Notebook* button (`level.notebook`) opens a panel beside
the editor (or over it, under 800px): for each object the level holds
(`wizard`, then the things and actors by id), the members the level
teaches (`api.members_taught`), each with its example as code and its
description; a click on an example inserts it in the editor at the cursor
on a line of its own. The panel's title is `notebook.title` (*The
wizard's notebook* / *El cuaderno del mago*). What is not taught yet is
not shown.

**Completion.** `@codemirror/autocomplete`'s `autocompletion` with an
override: after `wizard.`, `door.`, `teacher.` (every name the level
holds), the members the level teaches, each with its description as the
detail; `Tab` or `Enter` accepts. Nothing else is completed: Python's
keywords would be noise at this age.

**Tests.** pytest for `api.py`'s JSON; the i18n check; Vitest for the
panel's contents from a level's api; the browser: the notebook lists
`move_right` for the corridor and not `pick_up`, a click inserts the
example, and typing `wizard.` offers the moves.

### 2.6 The timeline

A range input under the scene (`level.timeline`, its label for screen
readers), from 0 to the run's ticks, following the playback as it plays.
Dragging it pauses the playback and shows that tick: the scene rebuilds
the state at the tick by resetting and replaying the ticks up to it
instantly, with no tweens, and the controller's snapshot follows (goals,
the running line). *Run* from a dragged position starts a new run as
always; a *Play* control (`level.play`, the same button as *Stop*,
labelled by state) resumes from there.

**Playback.** `seek(tick)`: pauses, resets, and emits ticks 1..tick with a
flag `instant` on each so that the scene draws without tweens, then stays
`paused` at that tick. `play()` from `paused` goes on from there, which it
already does.

**Tests.** Vitest for `seek`; the browser: after a won run, dragging to
tick 3 puts the wizard at `4,1` with the goal still open, and to the end
with it met.

## 3. Documents

- `architecture.md`: D28–D30; *Parts* with `controller.ts`, `words.ts`,
  `api.json` and `levels.json` among the files `pack-world.mjs` writes;
  the words of 2.11; the event table's `blocked` row with `tried`.
- `plan.md`: phase 2's list gains 2.11 and 2.12, and says sprint 4 has
  2.11, 2.12, 2.0, 2.7, 2.5, 2.8 and 2.6; 2.8 says *notebook*; the screen
  of section 2.1 says *notebook* and *Run*.
- `dev-environment.md`: the files `pack-world.mjs` writes, and that the
  hints and the start card's memory live in the browser for the session.
- `docs/dev/README.md`: the line about the sprint documents being kept as
  written.

## 4. What this sprint leaves out

The lessons, the chapter map, saving progress across visits, settings
(font size, the split between scene and editor) and the wizard's look are
phase 3. The art is phase 4. The wand, the broom and the spells of the
story come with their chapters in phase 5; the words for them exist (D27,
`blocked.unknown_action`).

## 5. How the implementer works

As in the earlier sprints (sprint-1.md, section 7): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`2.11: the game's words`), never a push; what this document leaves open
decided the simplest way and said in the commit; what turns out wrong done
the working way and logged in `architecture.md`; a short report to the
owner in Spanish at the end, with what differs.

## 6. The owner's findings this sprint answers

From the acceptance test of sprint 3, for the record: *spell* where the
program was meant (2.11); a door that shook when opened from too far
(2.12); no word on why an action failed (2.12); a message about changing
an attribute when a new method was being added (2.11); the isolation line
in the child's sight (2.11); a way to the next level (2.7).

## 7. Acceptance test (for when the owner tries it)

1. Open the corridor. The button says *Ejecutar*; the footer no longer
   speaks of isolation. The start card shows the level's goal; *Empezar*
   closes it. Reload: no card. The *?* button brings it back.
2. `while True: pass` says the program was stopped; `while True:
   wizard.say("hi")` says the program took too many steps. Neither says
   *hechizo*.
3. `wizard.mvoe_right()` says the wizard does not know an action called
   `mvoe_right`; `wizard.move_right` without brackets says an action is
   done with brackets; `wizard.saltar = 3` says the wizard cannot be
   given a new `saltar`.
4. The locked door: `door.open()` from the start shows a thought, *No
   llego a la puerta desde aquí*, with no shake, and the card says so with
   the line; `wizard.move_right(6)` then `door.open()` shows *La puerta
   está cerrada con llave y no tengo la llave* with the door shaking.
5. Press *Pista* after a failed run: the first hint; again, the second;
   the button goes grey after the last.
6. Open the notebook: the wizard's actions this level teaches, each with
   its example; click one, it lands in the editor. Type `door.` and see
   `open` offered.
7. Win the locked door in five lines: the win card, two stars, *Siguiente*
   opens the teacher's level. Win that: one star, and the card says there
   are no more levels for now.
8. After a won run, drag the timeline back: the wizard walks back to that
   tick; press play to go on from there.
