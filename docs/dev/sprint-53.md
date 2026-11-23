# Sprint 53 — Chapter 5: the familiar

The owner's design of chapter 5 (2026-11-17, `drafts/chapter-5/capitulo-5.md`,
in Spanish, third version, with its pictures in `drafts/chapter-5/escenas/`
and its Gemini prompts in `drafts/chapter-5/prompts/`) shapes this sprint.
The chapter is built whole, as chapter 4 was in sprint 39: its two scenes
painted and exported, its world features, its levels and stories placed,
its texts from Gemini, its tests, its documents. It is the last chapter of
the first year. The owner's decisions, given on the three versions and in
the conversations of the days: each first-year pupil describes a familiar
in Python and Orla's word `minka` calls it; a class of the child's is a
kind of familiar, an object one creature; the first year allows six kinds
in their natural colours, a name and nothing more, and anything else is a
stumble of the story told by Orla, never a red error; the description is
a draft through the first three levels and is decided for good when the
creature leaves the circle in the fourth; there is one familiar a game;
the friend's is always a grey hare, a colour kept for her; a child who
asks for a grey hare is told by Orla that it will not come out well, and
gets a hare with no colour; a trial with no colour must be told from a
white creature's trial at a glance; the passage in the wall is narrower
than a cell and lies whole on its cells; the familiar is half a child's
height; Orla says, and does not ask, when the program of the fourth
level is right; a wrong way there is shown in footprints of light; up to
120 Gemini images for the chapter.

The pieces, in this order: 53.1 to 53.10. The rules of the earlier sprints
hold: pieces in order, one local commit each, never a push, never a timer
(the owner pushes with `ci/push.sh`); no commit carries a
`Co-Authored-By` line; per piece `ci/check.sh` and the browser specs the
piece touches green, the whole `ci/check.sh --e2e` once before the last
commit (the owner's rule of 2026-11-09); every word for the player through
`t()` or a content file, in English and Spanish; nothing forbidden and
nothing secret; nothing of `drafts/` enters a commit, except a Gemini
prompt of a picture that is used, copied to `tools/art/prompts/`;
documents and comments in the present (CLAUDE.md); Gemini writes every
text the child reads from a brief, and the implementer reads and corrects
the draft; a scene is asked of Gemini as its base first and every later
picture is an edit of it (`art/README.md`, *How a scene's states are
made*); no content is edited while a browser run is going. The design
document is the truth for what the chapter tells and teaches; this
document says how it is built and, where the two differ (section 2), this
one wins and the difference is said in the commit. Section 5 is the Gemini
budget, section 6 the owner's acceptance test, section 7 the hand-over,
section 8 the prompt.

## 1. Decisions taken here

- **D260 — A class of the child's is a kind of familiar.** Decided
  2026-11-17 from the owner's design (*un familiar no se elige, se
  describe*). A level whose `level.json` has a `familiar` block puts a
  real Python class, `Familiar`, among the program's names. A class the
  child writes with `(Familiar)` is a kind of familiar and its name is
  the kind (`Fox`); an object of it is one creature. `Familiar` is made
  for each world (`world/kydux_world/familiars.py`), needs no `super()`
  and no `__init__` of the child's: its `__new__` takes any data and
  keeps the world's own state under `_k_` names, so that a class with no
  `__init__` called with data gives Python's own error. Its
  `__setattr__` takes `name` and `color` and nothing else; `position` is
  read (D153) and is `None` before the creature is called. The class is
  looked at when Python makes it (`__init_subclass__`): a method other
  than `__init__`, and than `go_to` where the level's block allows it,
  or any other name in its body, stops the program at that line (D261).
  The limits hold only for classes that inherit from the world's
  `Familiar`: a lesson's own `class Crow:` or `class Familiar:` is plain
  Python. The one table of the first year is in `familiars.py`: the six
  kinds with their colours (`Fox`: `red`, `white`, `black`; `Crow`:
  `black`, `white`; `Bat`: `black`, `white`; `Hare`: `brown`, `white`;
  `Mouse`: `brown`, `white`; `Frog`: `green`, `red`), the colour kept
  for the friend (`Hare`, `grey`), the friends' familiars' names (Tolu
  and Kesi, and Rumo and Nabi when the child takes one of those), the
  reserved names, and the default description (`Fox`, `Pimu`, `red`).
  `app/scripts/pack-world.mjs` writes it as `familiars.json` and the
  page reads the same table (`app/src/content/familiar.ts`); the rules
  the two sides share (a name's check, the room-mate's colour, the
  alternate names) are checked on both from one file of cases,
  `world/tests/familiar_cases.json`. The level's block:

  ```json
  "familiar": {
    "stage": "trial",
    "circle": [8, 6, 11, 8],
    "trials": [[10, 7]],
    "methods": ["__init__"],
    "book": false,
    "then": null,
    "draft": {"kind": "Fox", "name": "Pimu", "color": "red"}
  }
  ```

  `stage` is `trial` (a level where the description is tried), `birth`
  (the level where it leaves the circle) or `living` (a level played
  with the familiar there); `circle` is the rectangle of cells inside
  the ring; `trials` the cells where a trial appears, in order;
  `methods` what a class may define; `book` whether the book tries to
  note the trial (D267); `then` what follows a won run (D268); `draft`
  and, in a `living` level, `living` (`kind`, `name`, `color`, `source`,
  `at`, `facing`) are the level's own defaults, so that any level plays
  alone (D49), the tests run it and `#level/<id>` opens it under
  `?debug`; the page writes the game's own over them before a run
  (D265). Rules out a `wizard.describe(...)` action, a menu of creatures
  and a class the game writes for the child.

- **D261 — The first year's limits are stumbles of the story.** Decided
  2026-11-17 by the owner (*ninguno es un error rojo de Python: es un
  tropiezo de la historia, con palabras de Orla*). Two kinds. A
  **warning** stops the program at its line as a refusal does:
  `World.warn(reason, by, **detail)` beside `refuse` gives a tick, a
  `blocked` event with the reason and who says it, `self.error = reason`
  and raises `Refused`. Its reasons: `other_attribute` (anything but
  `name` and `color`, with the name written), `other_method` and
  `other_name` (in the class's body), `go_to_not_yet` (a `go_to` before
  the level that teaches it), `not_a_familiar` (`minka` on an object of
  a class without `(Familiar)`: *`minka` solo llama a familiares, y tu
  clase no dice que lo sea*), `class_changed` (D269), by Orla; and
  `name_letters`, `name_long`, `name_taken`, by the book. A **flawed
  trial** does not stop anything: a kind that is not of the first year
  gives a shapeless spark of light where the trial would stand, and
  Orla's words (`spark`); a colour that is not the kind's own gives the
  trial with no colour (`pale: true`, reason `colour`), Orla's words and
  the book showing the kind's colours as the strings to write; `Hare`
  with `grey` gives the same pale hare with Orla's own words for it
  (reason `grey`: *`{wizard}`, tú no eres tan {bueno|buena} como
  `{friend}`, y lo de la liebre gris no te va a salir bien*) and the
  book shows `"brown"` and `"white"`; no colour at all gives the pale
  trial with no words (reason `none`), and no name a trial with no name.
  A name is checked at every `minka`: a string of letters only
  (`str.isalpha()`), twelve at most, whose lower-case form is not a
  Python keyword, a builtin's name nor a name of the game's
  (`familiars.RESERVED`: `wizard`, `familiar`, `orla`, `bimo`, `rinlo`,
  `friend`, `mate`, `moon`, `sun`, `star`, and every id a chapter 5
  level gives a thing or an actor, kept whole by a test). Rules out a
  Python exception of the game's for any of these, and a silent
  correction of what the child wrote.

- **D262 — `minka` takes an object.** Decided 2026-11-17 from the design.
  `minka` joins `KNOWN_SPELLS` and `SPELLS`, and the notebook's aimed
  spells; `wizard.cast("minka", pimu)` costs the wizard's tick as any
  cast. With no object, or with a thing of the world, it is refused as
  an aimed spell with nothing to aim at is. In a `trial` or `birth`
  level it brings the object's trial into the circle: each object takes
  the next free cell of `trials`; with every cell taken, the oldest
  trial dissolves and the new one takes its cell; an object already in
  the circle is not called twice (`blocked`, `already_here`, not a
  stop). The event is `trial` (the object's id `familiar_<n>`, its
  kind, name, colour, cell, `pale` and its reason, the cell's earlier
  trial dissolved) or `spark`. On a **living** familiar `minka` brings
  it back: after the cast's tick the familiar runs by the shortest way
  over the cells a familiar enters (D270) to the free cell beside the
  wizard that is nearest by that way (ties by y, then x), a cell a tick,
  and hands the wizard everything it carries in its last step's tick
  (the event `hand_over` with the things' ids); beside the wizard
  already, it hands over with no step; with no way, `blocked`, `no_way`.
  Rules out a familiar that appears beside the wizard without walking.

- **D263 — A trial is the figure in light; a trial with no colour is its
  drawing, trembling.** Decided 2026-11-17 by the designer from the
  owner's words (*hay que pensar bien cómo distinguir a los pálidos de
  los blancos, y que sea obvio*), on the picture
  `drafts/chapter-5/escenas/prueba-palida-y-blanca.jpg`, samples 2 to 8;
  it waits for the owner's eye and the plan takes it as given. A trial
  with its colour, white included, is the creature's whole figure, half
  transparent, with an edge of light, and it stands still. A trial with
  no colour is only the figure's lines, drawn in white light with the
  floor seen through, and its light trembles. Both are drawn by the page
  from the creature's sheet (`app/src/engine/silhouette.ts`): no trial
  is painted. A pale trial of a kind is drawn from the kind's first
  sheet. The spark and the footprints of light (D268) are drawn by the
  page as well. Rules out a pale trial as the figure washed to grey
  (sample 1, mistaken for a white creature) and a sheet of trials from
  Gemini.

- **D264 — Someone's words in a run, and the playback waits for them.**
  Decided 2026-11-17 by the designer. A new event, `told`: someone of
  the scene says something while a program runs. It is a note in the
  tick going on (it costs no tick): the actor's id, a `key` and the
  values its words take (`kind`, `name`, `color`, `line`). The words
  are the level's own (`text.<lang>.json`, a `told` map) or, without
  one, the chapter's (`told.<key>` in `i18n/<lang>.json`), through
  `personal()`; a kind's and a colour's words come from
  `familiars.<Kind>` and `familiars.colors.<color>` (in Spanish with
  the kind's gender: *un zorro rojo*, *una liebre blanca*). They are
  shown as a bubble over the actor for their reading time (D175), and
  the playback holds until they are read: ten seconds at most, divided
  by the speed; step by step, until the next step; a run shown at once
  (Stop, a replayed end) shows the last words only. They are built on
  `Speech`, as the race's verdict is (D234). Someone painted into a
  scene speaks from a spot the scene names (`scene.json`, `"voices":
  {"bimo": [9, 3]}`); a story's `who` with no actor of that id speaks
  from the same spot. A warning (D261) is told the same way, by Orla or
  in the book's band (D267). Rules out words of the story in the
  outcome card only, and a run that goes on under an unread bubble.

- **D265 — The draft and the familiar are kept with the game, and
  written into the level.** Decided 2026-11-17 from the design.
  `Progress` gains `familiar?: {draft?: {kind, name?, color?}, living?:
  {kind, name, color, source, learned?}}`, validated by `readProgress`
  (a kind and a colour of the table, a name that passes the check, the
  sources strings). The world's result gains `familiar: {trial: {kind,
  name, color} | null, born: boolean, source: string | null, learned:
  string | null}`: the first good trial standing at the end, whether
  the familiar left the circle, and the child's class as written, taken
  from the program with `ast.get_source_segment`. The page saves on a
  win: levels 3, 5 and 7 keep the trial as the draft while no familiar
  lives; level 10 keeps it as `living` with its `source`, for good;
  level 12 keeps `learned`, the class with `go_to`. Before a run, and
  for the starting code, the page writes the game's `draft` and `living`
  into the level's `familiar` block, as it does `api` and `spells`
  (`main.ts`, `showLevel`); a `living` level takes `source` or `learned`
  as its block's `from` says, `learned ?? source` for `learned`. With a
  familiar living, a `trial` level is practice: the page says so on
  entering (`familiar.practice`), fills the starting code from the
  living one and saves nothing of it. The starting code is filled when
  a level is first opened and by *Start over* (D266). Rules out a
  familiar kept in the saved program of a level, and a second familiar.

- **D266 — The familiar in the texts.** Decided 2026-11-17 by the
  designer. `personal()` and the tests' `for_wizard` fill, from the
  game's familiar or draft and, without one, from the level's defaults:
  `{familiar}` (its name, *Pimu*), `{familiar_var}` (`pimu`),
  `{familiar_class}` (`Fox`), `{familiar_color}` (the Python string,
  `red`), `{familiar_kind}` and `{familiar_a_kind}` (*zorro*, *un
  zorro*), `{familiar_color_word}` (*rojo*, agreeing with the kind),
  `{familiar_source}` (the class as kept, its lines), `{mate_familiar}`,
  `{mate_var}`, `{mate_color}` (the room-mate's: the child's kind in the
  table's first colour that is not the child's, named Kesi) and
  `{friend_familiar}` (Tolu). A choice by the kind's gender is written
  `{familiar:el|la}`. After the birth a text names the creature by
  `{familiar}` or as *tu familiar*, never by its kind, so that no text
  needs the kind's gender but those that fill it. Rules out a text for
  each kind.

- **D267 — The world uses the child's class after the program.** Decided
  2026-11-17 from the design (*el libro lo anota en una línea*; *ahora
  lo mandaré yo*). Where the level's block says `book`, when the program
  has ended with a good trial (a first-year kind, a name, its colour),
  the world calls the child's class itself as `Class(name, color)` with
  the trial's own name and colour, inside the sandbox and its limits,
  what it prints dropped, and looks at the object it gets: the same
  name and colour, or the book cannot note it. The event `book` carries
  the line (`Fox("Pimu", "red")`), `ok`, and `ink` (true in the `birth`
  level's passing run only); the page shows it in a band under the
  scene, written in pencil or in ink, and failing with the book's words
  (*tu clase no sabe hacer un familiar con un nombre y un color*). In
  level 12, when the program has ended with the familiar on the sun's
  plate, the world gives Orla's two orders: for each, an `order` event
  with the line the world runs (`pimu.go_to(13, 10)`, then
  `pimu.go_to(11, 10)`) shown in the band, her words (`told`), and the
  call of the child's `go_to`, its steps ticks as any (D270) with the
  child's lines inside `go_to` lit. An error inside is explained as the
  child's own and the goal stays unmet. Rules out a check of the
  program's text for `__init__` or `go_to`.

- **D268 — The fourth level's program is rehearsed, and a familiar is
  born once.** Decided 2026-11-17 by the owner (*si has llegado hasta
  ahí y tienes el programa bien, Orla lo dice, pero no lo pregunta*; a
  wrong way shown in footprints). In a `birth` level `run_code` runs the
  program twice, each in a new world. The first run is silent, a
  rehearsal in which the trial crosses the circle's edge freely. The
  verdict is `passes` when the rehearsal is won and no familiar lives in
  the game. The second run is the one shown, played by the verdict.
  *Passing*: at the `minka` Orla speaks (`go`) and the book notes the
  line in ink; the step that leaves the circle gives the event `born`;
  after the program, the level's `then` (the room-mate's trial steps out
  of the circle and lives, a tick of the world's). *Not passing*: the
  trial walks inside the circle; the step that would leave it is `held`
  (a tick, the line lit, the trial at the edge), and every step ordered
  after it is a `footprint` at the cell it would reach, a tick each,
  with `bump` where it would bump, the way going on as the rehearsal's
  did; at the end, when a step was held, Orla speaks (`not_yet`). With a
  familiar living, the shown run is played as not passing with Orla's
  `halt` (*¡alto! ya tienes un familiar*), and its status and goals are
  the rehearsal's: the practice may be won and nothing is saved. When
  the trial called differs in kind or colour from the room-mate's copy,
  the room-mate's trial is drawn again from it and she speaks (`copy`).
  `check_consistency` holds for both runs. Rules out a question to the
  child before the birth, and a familiar born by a program that then
  fails.

- **D269 — A living familiar is in the programs, and describing it again
  only adds.** Decided 2026-11-17 from the design. In a `living` level
  the world makes the familiar before the program: it runs the kept
  class (`living.source`) under the file name `<book>` with `Familiar`
  in reach, makes the object with the name and the colour, stands it on
  `living.at` and gives it to the program under its name in lower case
  (`pimu`). No line of the program makes it. When the program defines a
  class of the same name with `(Familiar)`, its `__init__` is compared
  with the kept one (`ast.dump` of the two functions): the same, and
  the object becomes of the new class
  (`object.__setattr__(familiar, "__class__", New)`) with the event
  `learned`; another kind's name beside it or a changed `__init__`, and
  Orla warns (`class_changed`). A method the familiar's class lacks is
  explained with its name (*Pimu no sabe hacer `go_to`*) and the
  creature tilts its head (the event `puzzled`). `check_called` and the
  API's check take a method of the child's class as the familiar's own.
  Rules out a second object for the same creature and a familiar that
  forgets what it is.

- **D270 — A familiar's steps are ticks; some cells only a familiar
  enters; it picks up where it stops; what it sees, the wizard finds.**
  Decided 2026-11-17 from the design. `World.act` takes an `actor`
  (`"wizard"` by default): a familiar's `move_up`, `move_down`,
  `move_left` and `move_right` are the wizard's `_move` with the
  familiar as the one that walks, a cell a tick, a bump on what blocks
  and on the wizard, on an actor and on another trial; a count of zero
  walks nothing and costs nothing. `check_consistency` asks one acting
  event for each tick (the wizard's, a familiar's, or the world's own
  after the program) and that each one's steps follow on. A trial moves
  only in the `birth` level; before its `minka` a move is `blocked`,
  `not_here`. The role `familiar` in `api.py`: `familiar.name`,
  `familiar.color`, `familiar.position` (`x`, `y`), `familiar.move_up`,
  `familiar.move_down`, `familiar.move_left`, `familiar.move_right`. A
  scene's terrain with `"walk": "small"` is entered by a familiar and
  not by the wizard, who bumps there with the terrain's kind and a
  thought of its own. A thing kind `thread` joins `THING_KINDS` and
  `CARRIED_KINDS`; a familiar picks up every carried kind of thing on
  the cell where a move of one step or more ends (the familiar's
  `pick_up` event, in that step's tick) and carries it; the wizard has
  it only when `minka` brings the familiar back (D262). A zone's things
  are found from within it (D196) by the wizard **or by its living
  familiar**, and `find_all` orders them as ever, nearest to the wizard
  first. A thing kind `trail` is a thread's end on the floor: not
  carried, walked over, found by no one. A thing kind `plate` lies in
  the floor, is walked over, and is lit when a familiar ends a move on
  it (the event `lit`, the plate's state `lit`); the three plates' ids
  are `moon`, `sun` and `star`. Rules out a familiar that moves without
  ticks and a wizard that sees through walls without it.

- **D271 — The goals and the explanations of the chapter.** Decided
  2026-11-17 by the designer. Goals (`goals.py`, each with its `params`
  for the page): `trial` (at the program's end the circle holds `count`
  trials of a first-year kind, each `named` and `coloured` when the
  goal asks it; with `count` 2 their names differ); `noted` (the book
  can note the trial, D267); `born` (the familiar has left the circle);
  `familiar_at` (the familiar ends the program on a cell, or `on` a
  plate); `orders` (Orla's two orders obeyed: after each the familiar
  stands where she sent it); `no_bumps` with `"of": "familiar"`;
  `collect` with `"all": true` (the wizard ends with every thing of the
  kind). Explanations (`explain.py`): `missing_self` (a `TypeError` of
  one datum too many on a method of the child's class whose first name
  is not `self`: *cuando nace un objeto, Python se lo pasa a `__init__`
  el primero de todos; a este `__init__` le falta un sitio para él:
  `self`*); `no_attribute` (an object without the attribute: *este
  objeto no tiene nada que se llame `name`*); `object_arguments` (too
  few or too many data to make an object, with the numbers);
  `no_such_method` (D269). Rules out a goal that reads the program's
  text.

- **D272 — A lesson's block may end in an error meant to be seen; the
  five ideas of the chapter.** Decided 2026-11-17 from the design.
  `lesson.json` may say `"try": "error"` with the kind expected
  (`"error": "no_attribute"`): the lesson runner shows the error's
  explanation as the block's result, and the test of D142 asks that the
  block ends in exactly that error. The course's concepts gain `class`,
  `attributes`, `init`, `inherit` and `methods`, found in a program by
  `concepts_used()` (an `ast.ClassDef`; an attribute of a name given a
  value; an `__init__` in a class; a class with a parent; a function in
  a class that is not `__init__`) and shown in the notebook's Python
  tab as seven entries: `class` and `object` (with the concept
  `class`), `attribute`, `__init__` and `self` (with `init`), `inherit`
  and `method`. The lessons of the chapter are Orla's. Not taught, and
  in no text: `super()`, attributes of a class, `__str__`, properties.
  Rules out a lesson whose example hides its error.

- **D273 — What the two scenes and the figures hold.** Decided
  2026-11-17 by the designer. The scenes are `the-tower-hall` and
  `the-tower-passage`. The hall's three brass plates are things of the
  settings' kind `plate`, each with a state `lit` made as a door's
  state is (D148): one edit of the base with the three lit, the masks
  by difference. The great book lies open on the lectern in the base
  painting, and Bimo sleeps on the lectern beside it in every picture:
  he is part of the scene, speaks from his spot (D264) and never
  leaves. The hall has a second light, `sunset`, as the dormitory has
  `morning`. The forgotten room's door has no open state. A familiar's
  sheet is `content/art/figures/familiar-<kind>-<color>.webp`, fourteen
  in all, laid out as a wizard's walking sheet (three steps down, left,
  right and up) with each figure half a wizard's height, standing in
  the lower half of its frame, so that it is cut and drawn as any
  figure and comes out at 0.57 of a cell; its row to the right is the
  row to the left mirrored by the tool; a kind's other colours are
  edits of its first sheet. Others' creatures in a level or a story are
  actors of the kind `familiar` (`creature`, `color`, `trial`, `spark`,
  or `"of": "mate"` for the room-mate's copy of the child's; a
  `creature` given as a list is the first kind that is not the
  child's); the child's own is `{"id": "familiar", "kind": "familiar"}`
  in a story. Orla has a walking sheet (`orla`, an adult) and Rinlo a
  sitting row. The thread's piece and the trail's end are sprites
  (D182). A level's plan is its scene's picture in ink (D143, D151).
  Rules out illustrations for the stories (D74), and a picture of Bimo
  awake, of the tin box, of the slate and of the spark.

## 2. What differs from the design document

- **The cells.** The design's cells are read by eye from the trial
  paintings. The final cells come from the final paintings through the
  tools (`map_from_image.py`, `trace.py`), and section 3 gives the ones
  the paintings are asked to keep. The hall's plates are painted on
  whole cells, one further in than in the trial picture: (6,4), (13,4),
  (13,10).
- **Bimo stays asleep.** In the story *El rastro* Orla goes down alone:
  Bimo is painted into the hall and does not walk (D273). His *miau* and
  his opened eye are bubbles from his spot.
- **The forgotten room's door stays shut in the picture.** In *Lo que
  trajo el familiar* the bolt is heard, Rinlo is gone from the room and
  comes into sight at the back stair's arch.
- **Where the first and the last story are told.** *La torre* opens in
  the dormitory by morning (steps 1 and 2) and in the castle's entrance
  (steps 3 and 4) before the hall; no stair is painted. *El fin de
  curso* ends over the welcome's painting of the castle (steps 8 and 9).
- **No picture is made for a story, the tin box, the slate or the
  spark** (D74, D273): the stories are told on their scenes, the slate
  is the level's starting code and the spark is drawn by the page.
- **The starting codes run.** A level's starting code must run without
  an error (`test_the_starting_code_runs_without_an_error`): levels 5
  and 7 give the class's line with `pass` under it and say in comments
  what goes in its place. The slate of level 8 is the exception the
  level is about, and the test learns it (53.2).
- **The mate's third trial.** In level 7 the room-mate's trial is a
  spark that flickers at (11,7) from the start; nothing runs it.
- **The words the design gives in Spanish are kept**, as the owner read
  them: Orla's, the room-mate's and the book's lines of section 3.3.
  Gemini writes their English and every other text.

## 3. The chapter

### 3.1 The stops, in order

`content/chapters/05-the-familiar/chapter.json` (the chapter's id is
`05-the-familiar`, its music `the-familiar`, its title *El familiar* /
*The familiar*), eighteen items:

1. `story:the-tower` — *La torre*
2. `lesson:a-kind-of-thing` — *Un tipo de cosa*
3. `level:the-circle` — Practice 1, *El círculo*
4. `lesson:what-it-knows` — *Lo que sabe*
5. `level:the-name-and-the-colour` — Practice 2, *El nombre y el color*
6. `lesson:born-complete` — *Nacer completo*
7. `level:one-line-in-the-book` — Practice 3, *Una línea en el libro*
8. `level:the-slate` — Fix 1, *La pizarra de `{mate}`*
9. `lesson:what-it-inherits` — *Lo que hereda*
10. `level:out-of-the-circle` — Practice 4, *Fuera del círculo*
11. `lesson:what-it-does` — *Lo que hace*
12. `level:orlas-orders` — Practice 5, *Las órdenes de Orla*
13. `story:the-trail` — *El rastro*
14. `level:the-small-passage` — Practice 6, *El pasadizo pequeño*
15. `story:the-voice-in-the-tunnel` — *La voz en el túnel*
16. `level:the-forgotten-room` — Challenge 1, *El cuarto olvidado*
17. `story:what-the-familiar-brought` — *Lo que trajo el familiar*
18. `story:the-end-of-the-year` — *El fin de curso*

The levels are called here by their stop's number (level 3, level 16).
The chapter has no Improve level. Level 16 is the game's first
`challenge`.

### 3.2 The two scenes

Both are 20 by 15 cells, painted in the look of the castle's inside
(`art/README.md`), asked of Gemini from the trial pictures
(`art/raw/scene-tower-hall`, `art/raw/scene-small-passage-9`) and the
prompts of `drafts/chapter-5/prompts/`, with what follows said in the
new prompts. The margins are the castle (walls, roofs, the stair), never
black.

**`the-tower-hall`**, the highest hall of Orla's tower, by afternoon
sun. Walked floor: columns 5 to 14, rows 4 to 10. On the back wall,
three windows and banners. The lectern stands on (9,3)-(10,4), not
walked, with the great book open on it and Bimo, a grey cat, asleep
beside the book; Bimo's spot for his words is (9,3). The circle is
painted on the floor, a ring of runes whose inside is columns 8 to 11,
rows 6 to 8; the ring itself runs through the cells around them and all
of it is walked. Three round brass plates lie in the floor, each inside
one cell: the moon's (6,4), the sun's (13,4), the star's (13,10); things
`moon`, `sun`, `star` of the kind `plate`, each with its state `lit`. A
tiny arch, a familiar's door, at the foot of the back wall above
(14,4): painted, not a cell. The entrance arch is (9,11)-(10,11), with
the winding stair going down below it (rows 11 to 14), not walked in
any level. Perches, bookcases and baskets stand against the side walls,
outside the walked floor. Lights: the base (afternoon) and `sunset`.
Things a figure walks behind (the lectern's top, a perch that rises
over a walked cell) by the method of D148.

**`the-tower-passage`**, a corridor a floor below and, inside its wall,
the small passage to a forgotten room. The corridor's walked floor is
rows 13 and 14, columns 1 to 18, with a bench and a tapestry against
its wall; at its left end the back stair's arch (columns 1 to 3, rows
10 to 12; the cell under it, (2,12), is where a figure comes into sight
and is not walked in a level). The corridor's wall: its face rows 11
and 12, its top row 10. The mouth, a flap the size of a cat's, is at
the wall's foot on (10,12). Behind the wall the masonry is seen cut
open from above, rubble and beams, rows 5 to 9, and a trench runs
through it: up column 10 from the mouth to row 8, along row 8 to column
13, up column 13 to the room's flap on (13,5). The trench is a little
over half a cell wide (0.55) and runs along the middles of its cells;
no cell beside one of its cells shows any of it; the flaps are half a
cell wide (0.57). The forgotten room is above: its front wall's top is
row 4, its floor rows 1 to 3 with crates, a candle, stools and a
covered mirror; a shut door on its back wall at (9,0)-(10,1). Its free
floor: row 3, columns 8 to 13, and row 2, columns 9 to 11. The cells
only a familiar enters (terrain `"walk": "small"`, kind `passage`):
(10,12), (10,11), (10,10), (10,9), (10,8), (11,8), (12,8), (13,8),
(13,7), (13,6), (13,5), (13,4). On (10,12), (10,11), (10,10), (13,5)
and (13,4) the familiar walks under the painted wall: those cells' wall
is cut as a cover drawn over a figure (`row-N-static-over`). The room
is a zone, `room` (rows 1 to 3). The cold voice's spot is (8,2). The
scene is made by the method the trial was (`pasadizo_estrecho.py` in
the drafts: Gemini paints the trench a cell wide on an enlargement of
the wall, a program narrows it onto the middles of its cells and
shrinks the flaps, Gemini retouches the seams and the rubble); that
program enters `tools/art/` as `narrow.py`, with the scene's numbers in
`art/scenes/the-tower-passage/`.

### 3.3 The levels

All eight say `"speaker"` as given, and their intro is that character's
words on the start card. In the hall the wizard stands on (10,10)
facing up and never moves; no hall level gives the wizard an action but
`cast`. The words in guillemets are the design's and are kept.

**Level 3, `the-circle`, *El círculo*** (`the-tower-hall`, practice 1,
speaker `orla`). Actors: `orla` (11,4) facing down; `friend` (6,7)
facing right; `mate` (13,7) facing left; `friend_familiar`, a trial,
`Hare` with no colour, at (8,7); `mate_familiar`, a trial, `Frog`
`green`, at (11,6). `familiar`: `trial`, circle `[8, 6, 11, 8]`,
trials `[[10, 7]]`, methods `[]`, no `draft`. Spells: `minka`. `api`:
`wizard.cast`. Goal: `trial` (count 1). No bonus. Starting code, three
comments: make a kind of familiar with `class` and `(Familiar)`, and
`pass` under it; make one creature of that kind and keep it in a name;
call it with `minka`. Solution:

```python
class Fox(Familiar):
    pass

pimu = Fox()
wizard.cast("minka", pimu)
```

The trial comes pale and nameless (reason `none`). Told at the end of
a won run: Orla, `won` («Es {familiar_a_kind}, sí. Pero aún no sabe de
qué color es ni cómo se llama.», with the trial's own kind); Bimo,
`bimo` (he opens an eye). Wrong: `class Dragon(Familiar)` (a spark,
Orla: not a kind of the first year); `class Fox:` with no parent
(`not_a_familiar`); the class made and no object called (`minka` with
the class itself: refused, nothing to call); a `def fly(self)` inside
the class (`other_method`).

**Level 5, `the-name-and-the-colour`, *El nombre y el color***
(`the-tower-hall`, practice 2, speaker `orla`). Actors as level 3, with
`friend_familiar` now `Hare` `grey` at (8,7) and `mate_familiar` a
trial at (11,8) of `"creature": ["Bat", "Mouse"]`, `black` for the bat
and `brown` for the mouse. The intro has Orla's praise of the friend
(«¡Has logrado una liebre gris! Eso es algo excepcional para un alumno
de primero. Enhorabuena.», *alumna* by the friend's gender). `familiar`
as level 3 with `draft` `{"kind": "Fox"}`. `api`: `wizard.cast`,
`familiar.name`, `familiar.color`. Goal: `trial` (count 1, `named`,
`coloured`). No bonus. Starting code:

```python
class {familiar_class}(Familiar):
    pass

# Make one {familiar_kind} and keep it in a name.

# Give it its name, with .name

# Give it its colour, with .color

# Call it with minka.
```

Solution: the class, `pimu = Fox()`, `pimu.name = "Pimu"`, `pimu.color
= "red"`, the cast. A good trial is the whole figure in its colour and
stands still. Wrong: `pimu.color = "blue"` (pale, Orla's `pale_colour`,
the book shows `"red"`, `"white"`, `"black"`); `Hare` with `"grey"`
(pale, Orla's `pale_grey`, the book shows `"brown"`, `"white"`);
`pimu.age = 3` (`other_attribute`, stops there); no name (a nameless
trial, the goal unmet); `pimu.name = "Pimu 2"` (`name_letters`, the
book's words); the name and the colour given after the cast (the trial
came without them: pale and nameless).

**Level 7, `one-line-in-the-book`, *Una línea en el libro***
(`the-tower-hall`, practice 3, speaker `orla`). Actors as level 5, the
`mate_familiar` a spark at (11,7). `familiar`: `trial`, methods
`["__init__"]`, `book` true, `then` `{"born": "friend_familiar", "to":
[7, 7]}` (Tolu steps out of the circle and lives when the run is won),
`draft` the whole default. `api` as level 5. Goals: `trial` (count 1,
`named`, `coloured`); `noted`. No bonus. Starting code:

```python
class {familiar_class}(Familiar):
    # In place of pass, write __init__ with self, name and color.
    # Its first line keeps the name in self.
    # Its second line keeps the colour in self.
    pass

# Make {familiar}, with its name and its colour, in one line.

# Call it with minka.
```

Solution:

```python
class Fox(Familiar):
    def __init__(self, name, color):
        self.name = name
        self.color = color

pimu = Fox("Pimu", "red")
wizard.cast("minka", pimu)
```

After the program the book's band shows `Fox("Pimu", "red")` in pencil.
Wrong: the attributes given outside the class as in level 5 (the trial
is good, the book cannot note it: «Tu clase no sabe hacer un familiar
con un nombre y un color.»); an `__init__` that takes the two data in
the other order (`def __init__(self, color, name)`: a fox called *red*
whose colour is no colour of the book, pale); `Fox("Pimu")` with one
datum (`object_arguments`); `__init__` without `self` (`missing_self`).

**Level 8, `the-slate`, *La pizarra de `{mate}`*** (`the-tower-hall`,
fix 1, speaker `mate`). Actors: `orla`, `friend` (6,7) with
`friend_familiar` living at (7,7), `mate` (13,7). `familiar`: `trial`,
trials `[[10, 7], [11, 7]]`, methods `["__init__"]`, `draft` the
default; `level.json` says `"fault": "missing_self"`. `api` as level 5.
Goal: `trial` (count 2, `named`, `coloured`). No bonus. It does not
change the draft. Starting code, the room-mate's slate:

```python
class {familiar_class}(Familiar):
    def __init__(name, color):
        name = name
        color = color

{familiar_var} = {familiar_class}("{familiar}", "{familiar_color}")
{mate_var} = {familiar_class}("{mate_familiar}", "{mate_color}")
wizard.cast("minka", {familiar_var})
wizard.cast("minka", {mate_var})
```

Run as given, Python stops at line 6 and the explanation is
`missing_self`. With `self` added and nothing else, two pale nameless
trials come. Solution: `self` in the `def` and `self.` before the two
names kept. At the end of a won run the room-mate, `won`: «Ese. Ese
sí.» Wrong: `self` added only; `self.name = name` and `color = color`
(named, pale); the two last lines swapped with the two before (a name
used before it is made, Python's `unknown_name`).

**Level 10, `out-of-the-circle`, *Fuera del círculo***
(`the-tower-hall`, practice 4, speaker `orla`). Actors: `orla`;
`friend` (7,10) and `friend_familiar` living (6,10); `mate` (13,7);
`mate_familiar`, a trial, `"of": "mate"`, at (11,7). `familiar`:
`birth`, trials `[[10, 7]]`, methods `["__init__"]`, `book` true,
`then` `{"born": "mate_familiar", "to": [12, 7]}`, `draft` the default.
Things: `moon`, `sun`, `star`. `api`: `wizard.cast`, `familiar.name`,
`familiar.color`, `familiar.move_up`, `familiar.move_down`,
`familiar.move_left`, `familiar.move_right`. The intro is Orla's:
«Mientras esté en el círculo, puedes deshacerlo y describir otro. Si
lo sacas, vivirá. Piénsalo, y luego llévalo al plato de la luna.»
Goals: `trial` (count 1, `named`, `coloured`); `noted`; `born`;
`familiar_at` `{"on": "moon"}`. No bonus. Starting code:

```python
class {familiar_class}(Familiar):
    def __init__(self, name, color):
        self.name = name
        self.color = color

{familiar_var} = {familiar_class}("{familiar}", "{familiar_color}")
wizard.cast("minka", {familiar_var})

# Two steps down, and it is out of the circle.

# Four steps to the left.

# Five steps up, to the moon's plate.
```

Solution: those lines and `pimu.move_down(2)`, `pimu.move_left(4)`,
`pimu.move_up(5)`: (10,7), (10,9) where it is born on the second step,
(6,9), (6,4); eleven steps. Told (D268): `go` («Si ya estás seguro,
adelante. Deja que escriba la descripción en el libro de Arvelia, y
luego puedes crear tu familiar.»), `not_yet` («Así todavía no. Dentro
del círculo puedes cambiarlo.»), `halt` («¡Alto! Ya tienes un
familiar, y eso es más que suficiente. No puedes crear otro.»), the
room-mate's `copy` («¡Espera, que lo copio otra vez!»). The starting
code run as given: the trial comes and stands, and no one speaks.
Wrong: `move_left(3)` (held at the edge, footprints to (7,9) and up to
(7,4), not the plate); `move_up(5)` first (footprints into the lectern,
a bump); a blue fox with the right way (held at the edge: the trial is
not good); the three moves before the cast (`not_here`).

**Level 12, `orlas-orders`, *Las órdenes de Orla*** (`the-tower-hall`,
practice 5, speaker `orla`). Actors: `orla`; `friend` (7,10),
`friend_familiar` (6,10), `mate` (8,10), `mate_familiar` living (9,10),
`"of": "mate"`. `familiar`: `living`, `from` `source`, `at` `[10, 9]`
facing up, methods `["__init__", "go_to"]`, the default `living` with
the class of level 10's solution as its `source`. Things: the three
plates. `api`: level 10's without `wizard.cast`, and
`familiar.position`. The intro is Orla's: «Ahora lo mandaré yo. Los
familiares nacen sabiendo andar, pero ir a un sitio hay que
enseñárselo. En Arvelia, eso se llama `go_to`.» Goals: `familiar_at`
`{"on": "sun"}`; `orders`. Bonus: `no_bumps` of the familiar. Starting
code:

```python
{familiar_source}

    # Teach it go_to, with self, x and y.

        # If x is less than its own x, it goes left; else, right.

        # If y is less than its own y, it goes up; else, down.

# Send {familiar} to the sun's plate: 13, 4.
```

Solution: the class with

```python
    def go_to(self, x, y):
        if x < self.position.x:
            self.move_left(self.position.x - x)
        else:
            self.move_right(x - self.position.x)
        if y < self.position.y:
            self.move_up(self.position.y - y)
        else:
            self.move_down(y - self.position.y)

pimu.go_to(13, 4)
```

Three to the right and five up, eight steps. Then Orla's orders
(D267): `order_star` («¡A la estrella!») and `pimu.go_to(13, 10)`, six
steps down; `order_wizard` («¡Con tu {mago|maga}!») and `pimu.go_to(11,
10)`, two to the left. The class as the child wrote it is kept as
`learned`, and Orla's last words say she copies `go_to` into the book
(`outro`). Wrong: the row first (four steps up and a bump on the
lectern at (10,4)); a `go_to` with no data that walks to the sun by
fixed moves (the sun is reached, the first order fails with
`object_arguments`: `orders` unmet); no `go_to` and `pimu.go_to(13, 4)`
(`no_such_method`, the head tilted); the `__init__` changed
(`class_changed`).

**Level 14, `the-small-passage`, *El pasadizo pequeño***
(`the-tower-passage`, practice 6, speaker `friend`). The wizard (9,13)
facing up, never moving. Actors: `friend` (8,13), `mate` (11,13),
`rinlo` (8,3) sitting, facing right. `familiar`: `living`, `from`
`learned`, `at` `[10, 13]` facing up, the default `living` with level
12's solution as its class. Things: three of the kind `trail` at
(10,10), (12,8), (13,7). `api`: `familiar.position` and the child's
`go_to` (shown in the notebook from the kept class). Goal:
`familiar_at` `{"at": [13, 3]}`. Bonus: `no_bumps` of the familiar.
Starting code, three comments, a blank line after each: to the
passage's first corner, 10, 8; along it to 13, 8; up into the room,
13, 3. Solution: `pimu.go_to(10, 8)`, `pimu.go_to(13, 8)`,
`pimu.go_to(13, 3)`; thirteen steps. The first and the last of the
three lines win too, since `go_to` walks sideways first and then up
or down. Wrong: `pimu.go_to(13, 3)` alone (along the corridor
and a bump on the wall at (13,12)); a corner a cell short,
`pimu.go_to(10, 9)` and then `pimu.go_to(13, 3)` (a bump on the
trench's side at (11,9), and the familiar stays in the passage);
`pimu.go_to(10, 8)` alone (the familiar is in the passage, not in the
room). The wizard has no move in the level.

**Level 16, `the-forgotten-room`, *El cuarto olvidado***
(`the-tower-passage`, challenge 1, speaker `mate`). As level 14, with
no `trail`; things of the kind `thread` in the zone `room`, by way:
`a` (9,2), (11,3), (12,3); `b` (9,3), (10,3), (11,2); `c` (9,3), (9,2),
(11,3), (12,3). Spells: `minka`. `api`: `wizard.cast`,
`wizard.find_all`, `familiar.position`, `thing.position`. Goal:
`collect` `{"thing": "thread", "all": true}`. Bonus: `no_bumps` of the
familiar. Starting code, five comments: the three corners as in level
14, one each; then, for each thread the wizard finds, send the
familiar to it; then call the familiar back with `minka`. Solution:

```python
pimu.go_to(10, 8)
pimu.go_to(13, 8)
pimu.go_to(13, 3)
for thread in wizard.find_all("thread"):
    pimu.go_to(thread.position.x, thread.position.y)
wizard.cast("minka", pimu)
```

On way `a`: thirteen steps in, nine among the pieces (found nearest to
the wizard first: (9,2), (11,3), (12,3)), the cast, fourteen cells
back; thirty-seven ticks. Wrong: the three pieces' cells of way `a`
written as numbers (wins `a`, fails `b`); `find_all` before the
familiar is in the room (an empty list: nothing is seen from the
corridor); no `minka` at the end (the familiar has the pieces, the
wizard none). No text says that the pieces change places.

### 3.4 The stories

One text a step, from Gemini (53.6); a step's `who` as the design
gives it. The child's familiar is the actor `familiar`; `{familiar}`
is its name.

**`the-tower`, *La torre*** (9 steps, speaker `orla`). Steps 1 and 2 on
`the-dormitory`, light `morning`: the wizard (16,8) facing down, the
`mate` (14,9) facing right, the camera on (15,8). Step 3 changes the
scene (`scene`) to `the-entrance`: the wizard (20,19), the `friend`
(19,19), the `mate` (21,19), all facing up, the camera on (20,18);
`zarek` appears at (20,15) and walks to (20,17) facing down; in step 4
he walks away to (20,14) and vanishes. Step 5 changes to
`the-tower-hall`: the wizard appears at (10,11) and walks to (10,10);
the `friend` to (6,7) and the `mate` to (13,7) through (9,10) and row
9; `orla` stands at (11,4); the camera wide. Steps 6 to 8, Orla. Step
9: the `friend` walks a cell into the ring and back (the chalk), the
`mate` speaks, and the last words are Bimo's (`who`: `bimo`, from his
spot).

**`the-trail`, *El rastro*** (7 steps, speaker `friend`). On
`the-tower-hall`: the wizard (10,10), `familiar` (11,10), `friend`
(7,10) with `friend_familiar` (6,10), `mate` (8,10) with
`mate_familiar` (9,10), `orla` (11,4), as level 12 ends. Step 1:
`mate_familiar` hops out of the way, up to (9,8); Orla speaks, walks
down to (11,9), left to (9,9) and down to the entrance, (9,11), and
vanishes; `mate_familiar` hops back to (9,10). Step 2: `familiar`
walks up to (11,9) and left to (7,9), the cell above the friend, and
faces down. Step 3: `familiar` walks right to (13,9), up to (13,5),
right to (14,5) and up to (14,4), under the tiny arch, vanishes,
appears there again and walks back by (14,9) and (11,9) to (11,10).
Steps 4 and 5, the friend and the room-mate. Step 6
changes to `the-tower-passage`: the wizard (9,13), `friend` (8,13),
`mate` (11,13), `familiar` (10,13) facing up; `rinlo` is not placed.
Step 7, the room-mate.

**`the-voice-in-the-tunnel`, *La voz en el túnel*** (8 steps, speaker
`friend`). On `the-tower-passage` as level 14 ends: the wizard (9,13),
`friend` (8,13), `mate` (11,13), `familiar` (13,3) facing left, `rinlo`
(8,3) sitting, the camera wide. Step 2: the cold voice (`who`:
`cold_voice`, no figure, from its spot (8,2); its name on the page is
*Una voz fría* / *A cold voice*, and it has no portrait). Step 3:
`familiar` runs back by the passage, (13,8), (10,8), (10,13). Step 4,
the voice. Step 5, Rinlo (the thread broken is told, not shown). Step
6: the friend faces right, towards the mouth, and speaks; Rinlo
answers from his cell. Steps 7 and 8, Rinlo and the room-mate.

**`what-the-familiar-brought`, *Lo que trajo el familiar*** (8 steps,
speaker `mate`). On `the-tower-passage`: as before with `familiar` at
(10,13) and `rinlo` (8,3). Step 1: `rinlo` vanishes; then he appears
at (2,12), walks down to (2,13) and right to (5,13); the three face
left. Steps 2 and 3, Rinlo and the room-mate. Step 4 changes to
`the-tower-hall`: the wizard (10,5), in front of the lectern, `rinlo`
(9,5), `friend` (8,5), `mate` (12,5), all facing up, `familiar`
(10,6), `orla` (11,4) facing down. Steps 5 to 8, Orla.

**`the-end-of-the-year`, *El fin de curso*** (9 steps, speaker `orla`).
On `the-tower-hall`, light `sunset`, placed as the last story ends.
Steps 1 to 7, Orla, the room-mate in step 6. Steps 8 and 9 are told
over the story's still (`"still": "castle"` in `story.json`, the
welcome's painting of the castle; `still: true` on the two steps,
D251): the dinner, and the last words with `{familiar}` asleep in the
hood.

A cell given for a figure in a scene of another chapter is checked on
that scene's map; one that is not walked gives way to the nearest free
cell of its row, said in the commit.

### 3.5 The lessons

All five: `"speaker": "orla"`, plain Python in their blocks (D170),
their pages and blocks as the design's section 4 gives them.

- `a-kind-of-thing`, *Un tipo de cosa* (4 pages). `teaches`:
  `concept:class`, `wizard.cast`. The block makes `class Crow: pass`,
  two crows, prints them and whether they are the same one. Page 4:
  the six kinds, `(Familiar)` and `minka`.
- `what-it-knows`, *Lo que sabe* (4 pages). `teaches`:
  `concept:attributes`, `familiar.name`, `familiar.color`. `"try":
  "error"`, `"error": "no_attribute"`: the block ends reading the name
  of a crow that was given none. Page 4: the table of colours, without
  grey.
- `born-complete`, *Nacer completo* (4 pages). `teaches`:
  `concept:init`. `__init__` and `self`; Vesso black, Dalu white.
- `what-it-inherits`, *Lo que hereda* (4 pages). `teaches`:
  `concept:inherit`, the four `familiar.move_*`. Page 1 shows the
  child's own description, `{familiar_source}` filled from the draft as
  level 7 left it (the class of level 7's solution with the draft's
  kind, and the line that makes it). The block has its own `class
  Familiar:` with `__init__(self, name)` and `class Crow(Familiar):
  pass`.
- `what-it-does`, *Lo que hace* (5 pages). `teaches`:
  `concept:methods`, `familiar.position`. `Crow` with `hops` and `def
  hop(self, times)`; `vesso.hop(3)`, `vesso.hop(2)`.

`course.concepts` for the levels: level 3 `class`; level 5 and on,
`attributes` too; level 7 and on, `init`; level 10 and on, `inherit`;
level 12 and on, `methods`; with every concept of the earlier chapters
that their solutions use.

## 4. The pieces

### 53.1 The story bible and the course

- `docs/dev/story.md`: the places table gains the tower's highest hall
  and the corridor with its small passage and forgotten room (3.2); the
  characters table gains Bimo (Orla's grey cat, asleep by the great
  book), the three familiars' names and the alternates (D266), and
  Rinlo's row what chapter 5 tells of him (the thread tied to the cold
  voice, broken; he asks for help and is taken to Orla); the cold voice
  as the design's section 1 gives it, never named; the spells table:
  `minka` (D262); *The wizard's way*, chapter 5's beats rewritten to the
  design's section 1 and the five stories of 3.4.
- `docs/dev/course.md`: chapter 5's section rewritten to the eighteen
  stops of 3.1, with the idea and the API each unlocks, the two scenes
  and the world features it needs (D260 to D273); *How a level earns
  its idea* gains the two rules of this chapter: a limit of the first
  year is met as a stumble in the story, never as a list read
  beforehand (D261), and a choice that cannot be undone is rehearsed
  before it is made (D268); the count updated.
- `docs/dev/plan.md` names this sprint under chapter 5.
- Check: `ci/check.sh`; the course book regenerated.

### 53.2 The world

In `world/kydux_world/`, tests in `world/tests/test_familiars.py` (new),
with its cases in `world/tests/familiar_cases.json`, and the tests they
touch:

- `familiars.py` (D260, D261): `Familiar`, the six kinds with their
  colours and sizes, `RESERVED`, the names' rules, the reading of a
  class the child wrote (its parent, its methods, its `__init__`), and
  what a trial is worth (`good`, pale with its reason, `spark`).
- `World.warn(reason, by, **detail)` and the `told` event (D261, D264);
  the level's `familiar` block read and checked in `level.py` (its
  `stage`, `circle`, `trials`, `methods`, `book`, `then`, `draft`,
  `living`, `from`); `"fault"` read as a known explanation's kind.
- `minka` (D262) in `KNOWN_SPELLS` and `SPELLS`: cast with an object;
  the trial's events (`trial`, `spark`); on a living familiar the run
  back and `hand_over`; `already_here`, `no_way`, `not_a_familiar`.
- The book and Orla's orders (D267): the `book` event with its `line`,
  `ok` and `ink`; the `order` events after the program, each a call of
  the child's own `go_to`, run under the sandbox's rules.
- The rehearsal (D268) in `run.py`: level 10's program run twice, the
  first pass deciding `born` or `held` with its `footprint` events, the
  second the one played; `passes` in the result.
- The living familiar (D269): made from `living.source` under the file
  name `<book>`; a class the child writes again takes the familiar over
  by `object.__setattr__(familiar, "__class__", New)` when its
  `__init__` is the kept one; `class_changed` otherwise; `learned` and
  `puzzled`.
- Moves and ticks (D270): `World.act` with its `actor`; the familiar's
  four moves and `position`, its role `familiar` in `api.py`; the
  terrain `"walk": "small"` entered by a familiar only (a wizard is
  refused with the cell's kind, `passage`); `thread` and `trail` in
  `THING_KINDS`, `thread` in `CARRIED_KINDS`, taken by the familiar
  that steps on its cell; `plate` with its `lit` event; a zone's things
  found by `find_all` only when the wizard or its living familiar
  stands in the zone.
- Goals (D271): `trial`, `noted`, `born`, `familiar_at`, `orders`,
  `no_bumps` with `"of": "familiar"`, `collect` with `"all": true`;
  their `params` for the page.
- Explanations (D271): `missing_self`, `no_attribute`,
  `object_arguments`, `no_such_method` in `explain.py`, each with the
  line and the names it needs.
- The course's tests (D272): `CONCEPTS` gains `class`, `attributes`,
  `init`, `inherit`, `methods`, and `concepts_used` finds them in a
  solution; a lesson's `"try": "error"` with its `"error"` is run and
  must end in that explanation; `for_wizard` fills the familiar's
  placeholders with the default draft (D266);
  `test_the_starting_code_runs_without_an_error` takes a level's
  `"fault"`: that level's starting code must stop with that
  explanation and no other.
- The result (D265): `familiar` with `trial`, `born`, `source` and
  `learned`.
- The tests: every case of 3.3 (each level's solution, each wrong
  program with what it must give), written as data in
  `familiar_cases.json` and run on scratch levels until 53.6 gives the
  real ones; the reclassing; the rehearsal's two passes; the sandbox's
  rules holding for a method of the child's class (`test_tampering`).
- The API table and the notebook's words for `class`, `Familiar`,
  `familiar.name`, `familiar.color`, the four moves,
  `familiar.position`, `go_to` and `minka`, in `i18n/<lang>.json`,
  Claude's.
- Check: `world/tests`, `test_api_table`, the i18n dynamic names.

### 53.3 The page

In `app/src/`, with Vitest beside each module:

- **What is kept** (D265): `Progress.familiar` in `progress/store.ts`,
  read by `readProgress` (a save without it is a game with no familiar
  yet); saved on the wins the decision names; `showLevel` in `main.ts`
  writes the kept `draft` or `living` into the level before the world
  reads it (`from`: `source` or `learned`); a level replayed is a
  practice (`familiar.practice`) and changes nothing kept.
- **The placeholders** (D266) in `i18n/personal.ts`, from the kept
  familiar or the default; `content/familiar.ts` reads
  `familiars.json`, which `scripts/pack-world.mjs` writes from the
  table of `familiars.py`; the shared rules checked on the page too
  from `world/tests/familiar_cases.json`.
- **The trial** (D263) on `engine/silhouette.ts`: a trial with its
  colour is the familiar's whole figure, half transparent, with an
  edge of light, standing still; a pale one is the figure's lines
  alone, drawn in white light with the floor seen through, trembling
  (a pixel to each side, about eight times a second); a spark is a
  flicker with no figure; the rehearsal's footprints of light. The
  numbers are those of `drafts/chapter-5/prueba_palida.py` (the
  line's width, the veil, the halo), read there and written into the
  module. The trial's element says what it is for the tests
  (`data-trial`: `good`, `pale` or `spark`, with its kind and colour).
- **The familiar as a figure**: the actor kind `familiar` (D273) drawn
  from its sheet at its size, walking with the steps' sound lighter
  than a wizard's; under a cover (`row-N-static-over`) it is hidden as
  any figure; `"of": "mate"` and the friend's drawn the same way.
- **Words in a run** (D264): a `told` event shown as its speaker's
  bubble, from the speaker's cell or the scene's `voices` spot, the
  playback held while it is read (D175's reading time, ten seconds at
  most, divided by the speed); Orla's orders (D267) the same way.
- **The book's band** (D267) under the scene: the line the book notes,
  in pencil, in ink when the familiar is born; the book's own words
  when it cannot note.
- **The plates**: a plate's `lit` state shown from the `lit` event to
  the run's end.
- **The notebook** (`ui/notebook.ts`, D272): `minka` with its object;
  the seven entries of the tab Python; in a `living` level the
  familiar's actions, with the child's own `go_to` shown from the
  kept class as the child wrote it.
- **The stories** (`ui/story.ts`): a story's `still` named in
  `story.json` (`castle`: the welcome's painting, the one
  `the-letter` shows) for the steps that say `still: true`; a `who`
  with no actor and no portrait (`cold_voice`) speaks from the scene's
  spot under its name.
- **The lessons** (D272): the runner's `"try": "error"` shows the
  explanation as the page's result, not as a failure.
- Check: Vitest; e2e in 53.7.

### 53.4 The two scenes' art

For each scene, `art/scenes/<id>/` with its `cut.json` and
`manifest.toml`, `tools/art/export_scene.py <id>`, the sweep green, and
the scene's check sheets looked at before the commit. The order of
work, as `art/README.md` gives it (*How a scene's states are made*):

1. The prompts of the pictures that are used, copied from
   `drafts/chapter-5/prompts/` into `tools/art/prompts/` under the
   scene's name, with what 3.2 adds (the plates on whole cells, the
   lectern's cells, the corridor's arch).
2. **`the-tower-hall`**: the base from the trial picture; the plan from
   the picture (D143), its cells checked against 3.2 with
   `map_from_image.py`; the three plates' `lit` state as one edit of
   the base, the masks by difference (D148); the light `sunset` as an
   edit of the base, checked by a difference sheet: where a thing has
   moved the edit is asked again, twice at most, and if it still moves
   the last story is told on the day's hall and the report says so;
   what a figure walks behind, cut.
3. **`the-tower-passage`**: `tools/art/narrow.py`, the drafts'
   `pasadizo_estrecho.py` made a tool (its steps `squeeze`, `green`,
   `scene`; the scene's numbers in `art/scenes/the-tower-passage/`):
   Gemini paints the trench on the wall's enlargement, the tool narrows
   it onto the middles of its cells and shrinks the flaps, Gemini
   retouches the seams; a guide sheet shows that no cell beside the
   trench holds any of it; the covers over (10,12), (10,11), (10,10),
   (13,5) and (13,4); the terrains `small` in `scene.json`; the zone
   `room`; the `voices` spots of both scenes.
4. Export, sweep, sheets: a wizard on every walked cell and a familiar
   on every `small` cell, whole or hidden only behind what should hide
   it; the owner's `?debug` view opens each.
5. The chapter's card, cut from the hall's ground by
   `tools/art/chapter_cards.py`.

`content/art/scenes/<id>/SOURCE.md` for each. Images: section 5.

### 53.5 The figures and the sprites

- **The familiars' sheets** (D273): fourteen,
  `content/art/figures/familiar-<kind>-<color>.webp`, each the walking
  sheet of four rows of three as `familiar-fox-walk.md` asks it (the
  right-facing row checked figure by figure: every one faces right).
  Six first sheets, one a kind, asked from the trial's picture of the
  six animals; the other eight as colour edits of their kind's first
  sheet, checked by a difference of outlines. The trial's fox sheet is
  used if it passes the check. A trial is drawn by the page from the
  same sheet (D263): no sheet of trials.
- **Orla's walking sheet** and **Rinlo's sitting row**, as the
  teachers' and the pupils' sheets are made (`tools/art/figures.py`).
- **The sprites** (D182): `thread`, a short piece of black thread, and
  `trail`, a wisp of black thread on the floor, in
  `content/art/things/` with `things.json`; one picture for both.
- `figures.json` with the familiars' size (0.57 of a cell) and rows;
  `SOURCE.md` for each; a contact sheet of the fourteen and the two
  figures (`art/raw/game-check/figures-check-5.png`) looked at before
  the commit.
- Check: `ci/check.sh`; `tests/project` for the sheets' sizes and the
  sprites.

### 53.6 The levels, the lessons and the stories, with their texts

- `content/chapters/05-the-familiar/chapter.json` with the eighteen
  items and `"music": "the-familiar"`; its `text.<lang>.json`.
- `content/levels/<id>/level.json`, `solution.py`, `wrong/` (three or
  more each, those of 3.3) and the goals for the eight levels;
  `content/lessons/<id>/` for the five lessons of 3.5;
  `content/stories/<id>/story.json` for the five stories of 3.4;
  `tools/scene_maps.py` builds each level's and story's map from its
  scene. The cases of `familiar_cases.json` run on the real levels.
- The briefs in `tools/write/briefs/`, as chapter 4's are
  (`chapter-4-lessons.md`, `chapter-4-levels.md`,
  `chapter-4-stories.md`); a brief's `context` never names a draft, so
  the design's sections are pasted into the brief's words:
  - `chapter-5-stories.md`: the five stories' `text.<lang>.json` with
    the steps of 3.4 and the design's section 1; the Spanish lines the
    design gives are kept as they are and Gemini writes their English;
    the cold voice's words short and never explained.
  - `chapter-5-lessons.md`: the five lessons, Orla speaking; the
    metaphor rule (a class, an attribute, a method and `self` named by
    the child's word once, where the idea is first explained, then the
    programmer's); each *Try it*; lesson 4's page with
    `{familiar_source}`.
  - `chapter-5-levels.md`: the eight levels' `text.<lang>.json`: title,
    goals as the child reads them, the starting code's comments (one
    an instruction, D218), hints (three: the first on the idea, the
    last the whole, never a line of the solution), intro (its
    speaker's words; no way is told, D204), outro, learned, and the
    `told` map of each level with the lines of 3.3 kept in Spanish.
- The words, Claude's, in `i18n/<lang>.json`: `told.*` for the lines
  more than one level says (the limits of D261, the pale reasons, the
  book's), `familiars.<Kind>` and `familiars.colors.<color>`,
  `explain.*` for the four explanations, the goals' words, the
  notebook's, `familiar.practice`, the cold voice's name.
- Every draft read, corrected and moved into `content/`; the course
  book regenerated and read whole in Spanish.
- Check: `ci/check.sh` (i18n keys, forbidden words, the course book,
  every solution and wrong program).

### 53.7 The tests, the debug view and the pictures for the owner

- Playwright, `app/e2e/chapter-5.spec.ts`: every level won by its
  solution at speed 4, in Spanish for a girl wizard and in English for
  a boy; the default familiar and one other (a white crow named Nabi)
  carried from level 5 to level 16, its name in the texts and its
  sheet on the scene; in level 3 a dragon gives a spark and Orla's
  words; in level 5 a blue fox and a grey hare come pale, a white fox
  comes whole (`data-trial` says `pale` or `good` and its colour); in
  level 7 the book's band shows the line; level 8 as given stops with
  the explanation of `missing_self`; in level 10 the wrong way leaves
  footprints and nothing is born, the solution's birth is kept and a
  second run of the level is a practice; a second familiar is refused
  with Orla's `halt`; in level 12 the two orders are walked and the
  class is kept; in level 14 `go_to(13, 3)` alone bumps on the wall,
  and in the solution the familiar is hidden under the covers; in
  level 16 the three ways are won by the solution and the
  numbers-only program fails `b`; each
  story played to its end, the first changing scene twice, the last
  ending over the still; the chapter's stops in order on the map.
  Screenshots of every stop to `app/e2e/shots/chapter-5/`, each scene
  zoomed out once, a pale trial beside a white one once, the
  footprints once, for the owner.
- The sweep's sheets for the two scenes in `art/raw/game-check/`.
- `?debug`: the `small` cells marked in the cells layer; the zone
  `room` outlined; *Escribir la solución* (`#debug-solution`) writes
  the solution with the kept familiar's names; the ways' select
  (`#way`) on level 16.
- Check: the specs this piece adds, and those of the modules 53.3
  touched (`story.spec.ts`, `lesson.spec.ts`, `notebook.spec.ts`,
  `cards.spec.ts`).

### 53.8 Documents, and the walkthrough

- `docs/dev/architecture.md`: D260 to D273 in the decision log; the
  module map (`familiars.py`, `content/familiar.ts`, the trial's
  drawing); the world's API lines; the goals table; the events table
  (`trial`, `spark`, `told`, `book`, `order`, `footprint`, `born`,
  `held`, `learned`, `puzzled`, `hand_over`, `lit`); the level's
  `familiar` block; the terrain `small`.
- `art/README.md`: the two scenes under *Where things are kept*;
  `narrow.py` and how a passage narrower than a cell is made; the
  familiars' sheets under *The figures*.
- `docs/dev/README.md` and `docs/dev/dev-environment.md` if a step
  changes.
- The walkthrough of chapter 5 for the owner
  (`cd app && npm run walkthrough -- 05-the-familiar`), one way a
  level, with the default familiar.
- Check: `ci/check.sh`.

### 53.9 The whole check

`ci/check.sh --e2e` green, whole, once; what it finds is fixed in this
piece's commit, each fix said in its message.

### 53.10 The report, and the prompt for the review

What section 7 asks.

## 5. Gemini images

The chapter's budget is **120 images** (the owner, 2026-11-17), and
twelve are spent on the design's trials. A budget may be exceeded by up
to a quarter without asking (150); beyond that nothing is asked of
Gemini until the owner says so, through the report. Each image is named
in its commit. What this sprint plans, about forty-five with the
retries:

- **`the-tower-hall`**, about eight: the base with the plates on whole
  cells and the lectern on its cells (1 to 3); the plates lit, one edit
  (1); the light `sunset` (1 or 2; if a thing moves in every edit, the
  last story is told on the day's hall and no more is asked); what a
  figure walks behind (1 or 2).
- **`the-tower-passage`**, about eight: the base (1 or 2); the wall's
  enlargement with the trench (1); the retouches after `narrow.py` (2);
  the covers (1 or 2).
- **The familiars**, fourteen to twenty: six first sheets and eight
  colour edits, the trial's fox sheet used if it passes.
- **Orla's walking sheet** (1 or 2) and **Rinlo's sitting row** (1 or
  2).
- **The sprites** `thread` and `trail`, one picture.

No image is asked for a plan (D143, D151), the chapter's card
(`chapter_cards.py`), a story, the tin box, the slate, a trial or a
spark. Text drafts: three briefs (53.6), asked again when a draft is
wrong in its facts.

## 6. Acceptance test (for when the owner tries it)

The test is played on the owner's development server. Open this address
in a normal window:

```
https://localhost:5173/?debug
```

Start a new game as a girl and play chapter 5 from its first stop.
Then start another as a boy and play it again with another familiar.
`?debug` gives the button *Escribir la solución*, which writes a
level's solution, so that each step below is quick to reach.

1. **La torre.** The story opens in the dormitory by morning, goes on
   in the castle's entrance, where Zarek comes and goes, and ends in
   the tower's hall. Orla speaks. Bimo sleeps by the great book and has
   the last word.
2. **Un tipo de cosa** and **El círculo.** *Try it* makes two crows and
   says they are not the same one. In the level, write the solution
   and run it: a pale fox appears in the circle, a drawing in lines of
   white light that trembles. Orla says it has no colour and no name
   yet. Now change `Fox` to `Dragon` and run: a spark, no figure, and
   Orla says it is not a kind of the first year.
3. **Lo que sabe** and **El nombre y el color.** *Try it* ends in an
   error that the page explains: the crow has no name. In the level,
   the friend already has a grey hare and Orla praises it. Run the
   solution: a red fox stands whole in the circle, steady.
4. **Pale against white.** This is the step to look at with care. In
   the same level, run it three times: with `"white"`, with `"blue"`,
   and with `Hare` and `"grey"`. The white fox is a whole white figure
   that stands still. The blue fox and the grey hare are drawings in
   lines, with the floor seen through them, trembling. With `"blue"`
   Orla says the book has no such colour and the book shows the three
   it has. With `"grey"` Orla says the wizard is not as good as the
   friend, and the book shows `"brown"` and `"white"`. Nobody should
   mistake a pale trial for a white one.
5. **Nacer completo** and **Una línea en el libro.** Run the solution:
   the trial appears and the band under the scene shows the book's
   line, `Fox("Pimu", "red")`, in pencil. The friend's hare steps out
   of the circle and lives.
6. **La pizarra.** Run the program as it is given: it stops and the
   page explains that `self` is missing. Add `self` in the `def` only
   and run: two pale trials with no name. Fix the two lines under it:
   two good trials, and the room-mate says *Ese. Ese sí.*
7. **Lo que hereda** and **Fuera del círculo.** The lesson's first page
   shows the class the wizard wrote in the level before. In the level,
   run the starting code: the trial stands and nobody speaks. Write
   `move_left(3)` in place of the 4 and run: Orla says *Así todavía
   no*, the trial stays in the circle and footprints of light show the
   wrong way. Run the solution: Orla says *Si ya estás seguro,
   adelante*, the book writes the line in ink, the fox steps out of the
   circle and is a living animal, and it walks to the moon's plate,
   which lights. The room-mate's frog is born after it.
8. **A second familiar.** Open *Fuera del círculo* again from the map.
   The page says it is a practice. Change the name or the kind and
   run: Orla says *¡Alto! Ya tienes un familiar*. The familiar of the
   game is the first one.
9. **Lo que hace** and **Las órdenes de Orla.** Run the solution: the
   familiar walks to the sun's plate. Then Orla gives two orders, one
   after the other, and the familiar walks each with the `go_to` the
   wizard wrote: to the star's plate, and to the wizard's side.
10. **El rastro.** Orla leaves. The familiar tugs, walks to the tiny
    arch, goes in and comes back. The scene changes to the corridor.
11. **El pasadizo pequeño.** Write only the last line of the
    solution, the `go_to` to 13, 3, and run: the familiar walks along
    the corridor and bumps on the wall. The way in is the mouth. Run
    the solution: the familiar goes into the
    mouth, is hidden under the wall, is seen in the trench, and comes
    out into the room beside Rinlo. The trench is narrower than a
    cell, and no cell beside it shows any of it.
12. **La voz en el túnel.** The cold voice speaks from the room with no
    figure and no portrait. The familiar runs back.
13. **El cuarto olvidado.** Run the solution: the familiar gathers
    every piece of thread and `minka` calls it back with them. Under
    the scene, pick each way in the *way* box: `a`, `b` and `c` are all
    won. Then write way `a`'s three cells as numbers: `a` is won and
    `b` is not.
14. **Lo que trajo el familiar** and **El fin de curso.** Rinlo comes
    into sight at the back stair and walks to the three. In the hall,
    Orla. The last story is told at sunset and ends over the painting
    of the castle. The map shows the chapter done.
15. **The second game.** As a boy, take a white crow called Nabi in
    level 5 and keep it to the end. Every text names Nabi and the
    crow, the friend still has the grey hare, and the room-mate's
    familiar has another name and colour than the wizard's.
16. **The notebook.** From level 3 on it shows `minka` with its object.
    Its tab Python has the seven new entries. From level 12 on it
    shows the familiar's actions, `go_to` among them.
17. **The debug view.** In `?debug`, both scenes' cells look right: the
    passage's cells are marked as `small`, the room's zone is
    outlined, and every figure stands on its cell. The fourteen
    familiars' sheets have no stray pixels and every figure of a
    right-facing row faces right.

## 7. What the implementer hands over

A report in Spanish, one thing after another, each explained for a
reader who does not know the code, and then its picture, only pictures
of the final commit: both scenes zoomed out, each level's start and
win, a pale trial beside a white one and beside a spark, the book's
band, the footprints of level 10 and the birth, Orla's orders, the
familiar in the trench and under a cover, each story's first step and
the last story's still, the fourteen familiars' contact sheet, Orla's
and Rinlo's sheets and the sprites; the commits with their hashes and
the state of `ci/check.sh --e2e`; what differs from this plan and the
design document and why; what was written by hand in Gemini's drafts;
the Gemini images spent, named, and the count against 120; what is left
open; and the prompt for the designer's review.

## 8. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-53.md (this plan, whole), drafts/chapter-5/capitulo-5.md
(the owner's design, in Spanish, third version, with its pictures in
drafts/chapter-5/escenas/, the Gemini prompts in
drafts/chapter-5/prompts/ and the programs that made the trials beside
it), docs/dev/sprint-39.md (how chapter 4 was built),
docs/dev/course.md ("How a level earns its idea" and chapter 5),
docs/dev/story.md, art/README.md whole (especially "How a scene's
states are made" and "The figures"), D20, D27, D49, D51, D56, D70,
D74, D131, D142, D143, D148, D151, D153, D170, D174, D175, D182, D196,
D199, D204, D218, D223, D234, D251, D256, D258 and D259 in
docs/dev/architecture.md with its API, goal and events tables,
tools/write/README.md and rules.md, and the memory notes
kydux-two-agents, kydux-sprint-52-state, kydux-designer-review-52,
kydux-designer-chapter-5-proposal, kydux-designer-sprint-53-plan,
kydux-checks-per-piece, kydux-designer-scene-states-method,
kydux-chapter-design-learnings, kydux-writing-feedback,
kydux-metaphors-once, kydux-no-co-authored-by and
kydux-github-only-code-and-docs. Build sprint 53 whole: pieces 53.1 to
53.10 in order, one local commit each, none with a Co-Authored-By
line; before each commit ci/check.sh and the browser specs the piece
touches green, and the whole ci/check.sh --e2e once, in 53.9; never a
push, never a timer (the owner pushes with ci/push.sh). Nothing of
drafts/ enters a commit, except a Gemini prompt of a picture that is
used, copied to tools/art/prompts/. Never stop or build into the
servers on ports 443 and 5173, and never kill a vite, node or nginx
process of the owner's (CLAUDE.md); your own preview or dev server on
4174 is stopped when you are done. Gemini's budget is 120 images for
the chapter, of which 12 are spent; the plan expects about 45 more,
each named in its commit; 150 is the most without asking, and beyond
that you stop painting and ask through the report. Gemini writes every
text the child reads from the briefs the plan names, and you read and
correct every draft before it enters content/; the Spanish lines the
plan and the design give in guillemets are the owner's and are kept.
The plan decides everything; where it does not, take the smallest
choice that keeps its intent and say it in the commit; a choice that
changes what the owner sees is asked first, through the owner. Every
document and comment in the present. Before git add, read git diff of
each file and stage only your own hunks; commit promptly. Hand over
what section 7 asks, as a report in Spanish, and end with the prompt
for the designer's review in English, in a code block: the commits,
the differences from the plan with their reasons, what to look at with
care (the pale trial against the white one first), the images spent,
what is left open, and the limits.
```
