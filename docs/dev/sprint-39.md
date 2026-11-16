# Sprint 39 — Chapter 4: the broom, and the debts of 0.0.5

The owner's design of chapter 4 (2026-11-10, `drafts/chapter-4/capitulo-4.md`,
in Spanish, second version, with its pictures in `drafts/chapter-4/escenas/`
and its Gemini prompts in `drafts/chapter-4/prompts/`) shapes this sprint.
The chapter is built whole, as chapter 3 was in sprint 30: its four scenes
exported, its world features, its levels and stories placed, its texts from
Gemini, its tests, its documents; before it, the debts left by release
0.0.5. The owner's decisions, given on the first version and in the
conversation of the day: the sabotage is a black knotted thread in each
broom's twigs, untied with `broom.untie()`; flying comes before any ring;
no wand shop; Rinlo is seen at the end muttering what gives him away, not
recognised; Ilda teaches flying; the brooms are untied in two levels (a
row walked in one line, then scattered ones reached by counting x and y)
and checked again with an `if` inside the `for`, mending the previous
program; flying is at least three times as fast as walking and has its
sound, so the two ring fields are wide; a function is made necessary by
different manoeuvres between the pairs of rings; the race is scored by
ticks, lines and rings missed, and a rematch follows with a sharper Zarek;
up to fifty Gemini images without asking. The owner added three streams
of their own the same day, so that the sprint carries a lot at once: a
score of music for every chapter; the look of every page, with a welcome
page that tells what Kydux is; and good portraits of every character and
of every look, for the lessons and the creator.

The pieces, in this order: 39.1 to 39.13. The rules of the earlier sprints
hold: pieces in order, one local commit each, never a push, never a timer
(the owner pushes with `ci/push.sh`); per piece `ci/check.sh` and the
browser specs the piece touches green, the whole `ci/check.sh --e2e` once
before the last commit (the owner's rule of 2026-11-09); every word for
the player through `t()` or a content file, in English and Spanish;
nothing forbidden and nothing secret; documents and comments in the
present (CLAUDE.md); Gemini writes every text the child reads from a
brief, and the implementer reads and corrects the draft; a scene is asked
of Gemini as its base first and every later picture is an edit of it
(`art/README.md`, *How a scene's states are made*); no content is edited
while a browser run is going. The design document is the truth for what
the chapter tells and teaches; this document says how it is built and,
where the two differ (section 2), this one wins and the difference is
said in the commit. Section 5 is the Gemini budget, section 6 the owner's
acceptance test, section 7 the hand-over, section 8 the prompt.

## 1. Decisions taken here

- **D182 — A thing may be drawn from a sprite of its kind, on any scene.**
  Decided 2026-11-10 by the owner (*los aros los dibuja el juego*), after
  Gemini ignored the columns asked for in three race courses. A kind of
  thing may have a picture of its own, `content/art/things/<kind>.webp`,
  listed in `content/art/things/things.json` with its size in cells
  (width and height), the cell its foot stands on and its licence source
  (`SOURCE.md`). A thing on a painted scene whose `art.json` names no
  picture for it, and every thing on a scene that has a sprite for its
  kind and no cut-out of it, is drawn from that sprite at its cell: its
  foot on the cell's lower edge, its depth that of its row, scaled by the
  scene's cell as a figure is (`height_cells`), its width keeping the
  sprite's proportion. A sprite is cut from a painting or asked of Gemini
  as a single thing on a flat magenta background (`tools/art/sprites.py`),
  and is the same on every scene. The broom and the ring are such kinds.
  Rules out a picture of each broom and each ring painted into each scene,
  and a scene asked again for every arrangement of them.
- **D183 — The broom is a thing, knotted and untied.** Decided 2026-11-10
  by the owner. `broom` is a kind of thing, found by `find_all` and
  `find_nearest`, carried (`carrying`) from the first flight on, with the
  attribute `knotted` (true while the black thread is tied in its twigs)
  and the method `untie()`, which works only when the wizard stands on the
  broom's cell (as `pick_up` does; refused `too_far` otherwise) and is an
  error on a broom that is not knotted (`no_knot`, *esta escoba no tiene
  nudo* / *this broom has no knot*: the precondition that teaches the `if`
  in the loop). Untying takes a tick and makes the event `untie`. A level
  gives a broom's knot in `level.json` (`"knotted": true`, false by
  default) and may change it by way. The goal `untied` (`{"kind":
  "untied"}`) is met when no broom in the level is knotted; a level that
  asks it and has a knotted broom the program never unties fails it at the
  run's end. Rules out a counter-spell for the knot, and an `untie` from
  afar.
- **D184 — `find_all`, `len` and a count said.** Decided 2026-11-10. The
  lesson on lists teaches `wizard.find_all(kind)`, which gives every thing
  of a kind nearest first (ties by row, then column), hidden ones revealed
  as `find_nearest` reveals, as a Python list, and `len`, which the sandbox
  lets through among the builtins; `wizard.say` takes a number as it takes
  a word, saying it as text. The goal `say` takes `"count_of": "<kind>"`
  in place of `"text"`: met when the wizard says the number of things of
  that kind the way played has. The notebook's words name `find_all`,
  `len` and `items`. Rules out counting brooms by eye, and a `say` goal
  written once per way.
- **D185 — Flying: `drevo` lifts the broom, the moves fly, and a flown
  cell takes a third of a walked one.** Decided 2026-11-10 by the owner
  (*cuando se vuela se debe mover por lo menos 3x*). `wizard.cast("drevo")`
  needs the wand and a broom carried (refused `no_broom`), takes a tick,
  makes the event `fly` and puts the wizard in the air (`wizard.flying`,
  an attribute no lesson teaches yet, kept for the challenges); from then
  on every `move_*` flies: it crosses the cells the scene marks as low
  (D186) and the rings' cells, and bumps on the high ones as a walk does.
  When the program ends the broom sets down where it is (the event
  `land`); a level's run ends on the ground. The world counts a flown cell
  as one tick, like a walked one, so that counting stays the child's; the
  page plays a flown step in a third of a walked step's time, at every
  speed, so that flying is at least three times as fast to the eye, and
  the race's and the rings' long flights pass quickly. While flying, the
  figure is drawn from its flying rows (D188), lifted half a cell above
  its cell with a soft shadow on the ground, bobbing a little; the steps'
  noise taps are replaced by the flight's sound: a soft continuous wind,
  filtered noise swelling with each flown step, synthesised as the steps
  are (the owner's choice: no sample). Rules out
  a `fly_right` family of methods, and a flight as slow as a walk.
- **D186 — Low and high: what a flight crosses.** Decided 2026-11-10. A
  scene's map gains terrains for flight: `low` (`walk: false, fly: true`:
  water, a hedge, a fence, a bench, a chest, reeds) and `high` (`walk:
  false, fly: false`: a tree's crown and trunk, a wall, a building, a
  tall post). A terrain's `fly` is false unless given; floor flies.
  `map_from_image.py` marks them by kind as it marks furniture, and the
  plan window hatches a low cell lightly and a high one darkly. A walk
  into a low cell is refused with the cell's kind (*el agua no se pisa*,
  the first flight's hint); a flight into a high cell bumps (*las copas no
  se pasan*). Rules out one "blocked" kind for everything a wizard does
  not walk on.
- **D187 — The ring: flown through in order.** Decided 2026-11-10. `ring`
  is a kind of thing drawn from its sprite (D182), standing on a cell no
  one walks on; the wizard flies through it by crossing its cell in a
  vertical move, from the row above to the row below or the reverse; a
  horizontal move into its cell while flying bumps (*chocas con el aro*),
  and a walk into it bumps as into furniture. The goal `through_in_order`
  (`{"kind": "through_in_order", "ids": ["ring_1", ...]}`) is met when
  every ring named is flown through, each one after the one before it in
  the list; a ring flown through out of its turn counts as missed, and the
  goal's `missed` lists the rings not flown through in order, for the race
  (D189). Rules out a ring the wizard walks under.
- **D188 — Flying figures, Zarek and Rinlo.** Decided 2026-11-10 by the
  owner (*van a ser nuevas hojas de sprites*). The wizard's sheets gain
  four flying rows after the sleeping one (`rows.fly`, one a way, three
  frames: level, a little up, a little down, for the bobbing), made from
  Gemini's edit of the walking base of each gender (the figure sitting on a
  broom, legs together, the broom's handle ahead and its twigs behind,
  `tools/art/prompts/figure-fly-<gender>.md`) and recoloured into the eight
  looks as the casting rows are (`figures.py --fly`). Zarek (`zarek`, a
  second-year boy, taller than the first-years by the adults' and
  children's rule between, `height_cells` 0.86) has a standing sheet from a
  drawing (`--standing`, `figure-zarek-standing.md`) and flying rows from an
  edit of it; Rinlo (`rinlo`) a standing sheet only. Ilda's sheet stands.
  Rules out a wizard flying in its walking frames.
- **D189 — The race: Ilda's count.** Decided 2026-11-10 by the owner (*ticks
  + líneas + aros saltados*), made visible as the owner asked to see it
  rather than read it. A race level names a racer (`"race": {"against":
  "zarek", "lines": 14, "path": [...], "finish": [x, y]}`): an actor of
  kind `racer` with a fixed path of cells, one a tick, flying, who takes
  off at the tick of his `lines` and crosses the finish at the tick his
  path ends; before the start Ilda reads both programs, one tick a line,
  so the wizard takes off at the tick of the program's counted lines (the
  lines `lines_under` counts: neither blank nor a comment), standing on the
  start until then while the ticks run; a ring missed (D187) costs five
  ticks served circling before the finish line, drawn as a loop over the
  cell before it; the goal `before` (`{"kind": "before", "racer": "zarek"}`)
  is met when the wizard crosses the finish cell at a tick lower than the
  racer's; a tie is the racer's. The win and the lose cards show the
  count: *tus líneas + tu vuelo + penalización = tu tick; Zarek, el suyo*,
  from the goal's `params`. Rules out a race won by a long program that
  arrives first, and a penalty the child cannot see.
- **D190 — A function is taught where a loop cannot serve.** Decided
  2026-11-10 by the owner (*hace que la función sea útil*). The rings'
  level repeats the pair of rings three times with a different manoeuvre
  between each pair (under the trees, over the pond), so that a `for`
  cannot cover the repetition and `def two_rings()` is called from three
  places; the race's pairs differ in their gaps, so that arguments are the
  only way to keep one function, and Ilda's count makes the program
  without a function lose by one tick (D189); the rematch moves the rings
  and sharpens Zarek so that only the arguments change and no line may be
  spared. Rules out a `def` whose only reason is a lines goal a `for`
  would meet.
- **D191 — The browser tests on GitHub run with three times the time.**
  Decided 2026-11-10 from the tag run of v0.0.5, which lost three tests by
  time alone (D179). Under `CI`, Playwright's test timeout is 360 s, its
  expect timeout 45 s and the specs' own waits three times theirs
  (`waitForFunction` 180 s), through one constant in
  `app/playwright.config.ts` and one helper in `app/e2e/`; `retries` stays
  1. Rules out a release whose tag run is red by the runner's speed.

- **D192 — Every chapter has a score of its own, made by the game from
  notes.** Decided 2026-11-10 by the owner (*cada capítulo debe tener una
  banda sonora apropiada, ajustada a la hora del día, el ambiente, si es
  exterior o interior, si es de noche y en secreto*). A theme is a file
  `content/music/<id>.json`: its tempo, its metre, its voices and its bars
  of notes (pitch, start, length, loudness) in sections that loop, with a
  `full` arrangement and a `quiet` one (fewer voices); the page plays it
  with Web Audio (`engine/music.ts`): voices of a few kinds (a celesta's
  bell, a bowed string pad, a plucked string, a flute, a soft drum), each
  an oscillator or two with an envelope, through a generated reverb, under
  the effects' volume; no sound file is loaded. A chapter's `chapter.json`
  names its theme; a story and the map play `full`, a lesson and a level
  `quiet`, a little lower; the win card's flourish is an effect. Music
  starts at the first gesture on the page and goes on across screens
  without a break; the settings gain a music volume (off to full,
  `music` in the settings, kept with them) beside the sounds' switch. The
  themes are original, written for this game and shipped under the GPL as
  the code is; their manner is that of a late-romantic ballet suite and of
  the scores of films about schools of magic: celesta bells, waltzes,
  pizzicato for mystery, strings for warmth, never a quotation. By
  chapter: *Arrival* (dusk, outdoors, a gentle waltz in three, strings and
  celesta, warm and a little shy); *The library* (indoors, evening, harp
  arpeggios and a curious woodwind, quiet); *The passages* (night, secret:
  sparse pizzicato in a minor key, low strings, a tiptoeing celesta motif,
  slow); *The broom* (morning, outdoors, flight: bright, lifting, in six,
  flutes over strings, quick); *The familiar* (the tower: a slow, solemn
  chorale that opens out). Rules out loaded music files and a score that
  names or quotes any work under copyright.
- **D193 — The page's look, and a welcome page.** Decided 2026-11-10 by
  the owner (*una página inicial de bienvenida que explique y venda qué es
  Kydux; el arte de todas las páginas: fondos, botones, cajas; limpio y
  fácil de usar para un niño, un poco más acabado y fino*). One look for
  every screen, written once in `style.css` as tokens and components: the
  palette taken from the paintings (parchment for the page, ink for the
  text, moss green, a warm gold for the accent and the chosen state, a sky
  blue for links, a soft red for a warning), a faint parchment grain on
  the page's background (drawn by code, no file), cards and panels as
  paper with a thin ink border and a soft shadow, buttons rounded with a
  pressed state, a header with a small mark (a hat and a wand, an inline
  SVG) beside the name, the serif kept for the story's words and the
  monospace for code, the editor unchanged in what it does; large touch
  targets, nothing crowded, every page readable at a phone's width. The
  welcome page (`#about`, and the start screen's first visit, before any
  saved game) tells in a few short sections what Kydux is (the README's
  pitch), for whom (eight to twelve), how it is played (a story, a lesson,
  a level, each with a picture of the game), that it is free software of
  the Kidux family, in English and Spanish, and ends on *Play*; its hero
  is a painting of Arvelia on its hill above the lake at dusk (one Gemini
  image). The map's chapter cards carry a crop of each chapter's first
  scene. Rules out a page that looks like a form, and decoration that
  gets in a child's way.
- **D194 — Portraits of every character and of every look.** Decided
  2026-11-10 by the owner (*imágenes buenas para todos los personajes,
  para las lecciones cuando hablan y para la selección del personaje*). A
  portrait is a bust, head and shoulders, in three-quarter view looking a
  little to the left, painted as the figures are, asked of Gemini on a
  flat magenta background and cut to a transparent `content/art/
  portraits/<id>.webp` of 512 px, with its `SOURCE.md`: Ilda, Orla, Dask,
  Wenna, Nuri, Teku, Zarek, Baro, Eldra, Rinlo and Bimo; the wizard's
  portraits are one base bust a gender in the sheets' base colours,
  recoloured into the eight looks by the parts' rule of `figures.py` (hat,
  robe, band and stars, hair, skin), so that the portrait matches the
  figure. A lesson's page shows its speaker's portrait where the sprite
  stands now, with the name under it; a story's and a level card's speaker
  shows a small portrait beside the name; the creator shows the eight
  recoloured portraits as the looks to choose and the chosen one large
  beside the name. Rules out the pixel busts, and a portrait that does not
  match the figure's colours.

## 2. What differs from the design document

The design document (second version) is read first and holds; these are
the differences, decided while planning this sprint and told to the owner:

- **Where a level's cells are named below, they are the cells read from
  the painting** by `map_from_image.py grid`; the design's cells were read
  by eye on the painted grid. Where the painting puts an obstacle, the
  stone or the shed's wall a cell off, the level keeps its shape (its
  moves, its ways, its counts) and the cells move with the picture; the
  commit says which. The two wide scenes are 42 by 18 cells over Gemini's
  21:9 picture (6336 by 2688 px; the cell is 149 px, the picture's height
  divided by 18, the columns centred); if the tool's grid fits better at
  another count, the gaps between rings and the manoeuvres' shape are
  kept and the columns move.
- **The brooms' positions are the design's, by way**, and the check
  level's knotted ones; `find_all`'s nearest-first order over them is
  held by a unit test for every way (3.3).
- **Zarek's path in the race and the rematch** is given here (3.3), not in
  the design: the design gives his lines and his arrival tick.

## 3. The chapter

### 3.1 The stops, in order

`content/chapters/04-the-broom/chapter.json` (the chapter's id stays
`04-the-broom`, title *La escoba* / *The broom*), seventeen items:

1. `story:the-morning-after` — *La mañana siguiente*
2. `lesson:lists` — *Las listas*
3. `level:the-shed` — Practice 1, *El cobertizo*
4. `lesson:for-each` — *Para cada una*
5. `level:the-brooms-in-a-row` — Practice 2, *Las escobas de la fila*
6. `level:the-brooms-in-the-straw` — Practice 3, *Las escobas de la paja*
7. `lesson:checking-each` — *Un si dentro del bucle*
8. `level:the-check` — Fix 1, *La revisión*
9. `story:the-flying-lesson` — *La clase de vuelo*
10. `lesson:drevo` — *Drevo*
11. `level:the-first-flight` — Practice 4, *El primer vuelo*
12. `lesson:an-action-of-your-own` — *Una acción propia*
13. `level:the-rings` — Improve 1, *Los aros*
14. `lesson:arguments-of-your-own` — *Argumentos propios*
15. `level:the-race` — Practice 5, *La carrera*
16. `level:the-rematch` — Improve 2, *La revancha*
17. `story:the-finish` — *La meta*

Nothing of an older chapter 4 exists in `content/`; the course's outline
of it (`course.md`) is replaced (39.1).

### 3.2 The four scenes

Each 20 by 15 cells but the two wide ones, 42 by 18; every one by
morning, outdoors, its margins the grounds (lawn, hedges, trees, the
lake, the castle's wall), never sky. The paintings are in `art/raw/` under
their candidate names, and their prompts in `drafts/chapter-4/prompts/`,
to be copied into `tools/art/prompts/` as the scenes' sources when they
enter the game (the owner's rule: the prompts of the pictures a scene uses
are kept in the repository).

- **`the-broom-shed`** (`art/raw/scene-broom-shed/scene-broom-shed.png`,
  4:3, 20 × 15): the shed across the middle, its inside rows 6 to 8,
  columns 6 to 13 walked (the bench's columns 4 and 5 and the hay's 14 to
  16 are furniture); the door's cells (9, 9) and (10, 9); the gravel path
  below it; the lawn, the hedge at the left, the trees at the right and
  the castle's wall at the top are the margin. No door that opens. Things:
  none painted; the brooms are sprites (D182).
- **`the-lake-edge`** (`scene-lake-edge`, 4:3, 20 × 15): the arm of the lake
  columns 8 to 12 from top to bottom, `low` (D186); the jetty (7, 7) to
  (9, 7) floor; the path row 7 from the left edge; the white stone at
  (14, 7) floor (the mark); reeds along the banks and the bottom edge
  `low`; the trees of the top edge and the wall at the right `high`.
- **`the-ring-field`** (`scene-ring-field-wide`, 21:9, 42 × 18): the long
  training lawn; the hedge of the top rows and the lake beyond it `low`
  and water; the clump of trees columns 10 to 16, rows 4 to 11, `high`
  (the crowns and the trunks; the tool reads the crowns' outline); the
  pond columns 26 to 31, rows 7 to 11, `low`; the chalk start line column
  4; the white stone at (37, 9); the benches and the chest of the bottom
  rows `low`; the trees at the sides `high`. The rings are sprites.
- **`the-race-course`** (`scene-race-base-wide`, 21:9, 42 × 18): the long
  lawn with the chalk rectangle, its left side column 10 the start and its
  right side column 31 the finish, with a pole and a pennant at each end
  (`high`, two cells); the fence and the shore of the top rows `low`, the
  water beyond; the stand of the bottom rows `low`; the hedge and the gate
  at the right `low` and `high`; the trees at the sides `high`. The rings
  are sprites, placed by the level.

The ring's sprite is cut from `art/raw/scene-ring-field-2/
scene-ring-field-2.png` (the second small ring field, hoops round and
facing the viewer): one hoop with its post, by its outline, about two
cells tall and one and three quarters wide, its foot the post's; the
broom's sprite is asked of Gemini lying on the ground, seen from above,
one cell wide (`sprite-broom.md`).

### 3.3 The levels

Each level's `level.json`, its solution and its three or more wrong
programs, as the course's rule asks; the exact cells from each scene's map
(39.5). Every level's `tick_limit` is 100 but the race's and the rematch's,
120. A reach goal with `"hidden": true` shows no mark. A `uses` bonus
names a member. The ways' names are in the level's `text.<lang>.json`
under `ways`. Every level of the shed has the friend and the mate on the
two free cells nearest the start that no route crosses; the field's
levels have Ilda standing by the start (an actor of kind `teacher` that
does not patrol and sees nothing: `"sight": 0`), the friend and the mate
behind her. The wizard carries the wand in every level, and the broom
from the first flight on.

**P1 `the-shed`, *El cobertizo*** (`the-broom-shed`). Start (9, 8), end
the same, no mark. Things: brooms, knotted, hidden in the straw (drawn
only once found: `"hidden": true`, as a key behind a bookcase is, revealed
by `find_all`/`find_nearest`), at the check level's cells by way: `six`:
(7, 8), (8, 7), (9, 7), (10, 6), (12, 6), (13, 6); `eight`: (7, 8), (7, 7),
(8, 7), (9, 7), (10, 6), (11, 6), (12, 6), (13, 6); `nine`: `eight`'s and
(9, 6). Goals: `say` with `count_of: broom`; bonus `uses` `print`. `api`:
`wizard.find_all`, `wizard.say`, `print`, `len`. Starting code: three
comments (find them all; print the list; say how many). Solution:
`brooms = wizard.find_all("broom")`, `print(brooms)`,
`wizard.say(len(brooms))`. Wrong: `say("6")` typed (wins one way, fails
the others: the test holds it), `find_nearest` and `say(1)`, `say(brooms)`
(a list said, refused: *say* takes a word or a number).

**P2 `the-brooms-in-a-row`, *Las escobas de la fila*** (`the-broom-shed`).
Start (9, 8); end hidden, `on_the_way` ways: `three` (9, 6), `four`
(10, 6), `five` (11, 6). Things: knotted brooms in a row on row 6 from
column 6: `three` (6..8, 6), `four` (6..9, 6), `five` (6..10, 6). Goals:
`untied`; `reach` hidden; bonus `uses` `for`. `api`: the moves,
`wizard.find_all`, `broom.untie`. Starting code: two comments for the walk
(up, left), one for the list, one for the loop and its two steps.
Solution: `wizard.move_up(2)`, `wizard.move_left(3)`, `brooms =
wizard.find_all("broom")`, `for broom in brooms:` / `broom.untie()` /
`wizard.move_right()`. Wrong: three `untie` and moves written out (wins
`three`, fails `four` and `five`: the test holds it), the loop without
the move (the second `untie` refused `too_far`), the move before the
untie (the first broom never untied).

**P3 `the-brooms-in-the-straw`, *Las escobas de la paja*** (`the-broom-
shed`). Start (11, 6); end (6, 8) hidden, the same in every way. Things:
knotted brooms by way: `three` (10, 7), (8, 7), (6, 8); `four` (10, 7),
(9, 8), (7, 8), (6, 8); `four_high` (10, 6), (9, 7), (7, 7), (6, 8). A unit
test holds, for each way, that `find_all` from (11, 6) gives them in that
order and that each lies left of and not above the one before. Goals:
`untied`; `reach` hidden; bonus `uses` `x`. `api`: the moves,
`wizard.find_all`, `broom.untie`, `thing.position`, `wizard.position`,
`position.x`, `position.y`. Starting code: a comment for the list, one for
the loop, two for the two counts (left, down), two for the moves, one for
the untie. Solution: as the design (left = wizard.x − broom.x, down =
broom.y − wizard.y, `move_left`, `move_down`, `untie`). Wrong: the counts
the other way round (negative steps refused), the moves written as
numbers (wins one way only), the untie before the moves.

**F1 `the-check`, *La revisión*** (`the-broom-shed`). Start (6, 8); end
(13, 6) hidden. Things: brooms by way, knotted where said: `six`: (7, 8),
(8, 7), (9, 7)k, (10, 6), (12, 6), (13, 6)k; `eight`: (7, 8), (7, 7),
(8, 7)k, (9, 7), (10, 6), (11, 6)k, (12, 6), (13, 6); `nine`: `eight`'s with
(9, 6), knotted (7, 7), (10, 6), (12, 6) only. A unit test holds the order
(right of and not below the one before, distance growing). Goals:
`untied`; `reach` hidden; `no_error` (the run ends without a refusal:
the goal of D22's errors, new, `{"kind": "no_error"}`); bonus `uses`
`knotted`. `api`: P3's and `broom.knotted`. Starting code: the friend's
program of the design (right, up, `untie`), which fails at (7, 8) with
`no_knot`. Solution: `if broom.knotted:` / `broom.untie()` in the loop.
Wrong: the given program; the `if` without the moves inside the loop;
`if not broom.knotted`.

**P4 `the-first-flight`, *El primer vuelo*** (`the-lake-edge`). Start
(1, 7), `carrying` wand and broom; end (14, 7) with its mark. Ilda at
(1, 5), the friend and the mate at (0, 6) and (0, 8) or the nearest free
cells. `spells: ["drevo"]`. Goals: `reach`; bonus `cast` `drevo` from the
jetty (`{"kind": "cast", "spell": "drevo", "from": [[7, 7], [8, 7], [9, 7]]}`:
the cast goal takes `from`, cells the cast must be made on). `api`: the
moves, `wizard.cast`. Starting code: three comments (walk to the jetty's
end; the word; fly to the stone). Solution: `wizard.move_right(8)`,
`wizard.cast("drevo")`, `wizard.move_right(5)`. Wrong: `move_right(13)`
(refused at the water: *el agua no se pisa*), the cast first on the grass
(wins the walk, fails the bonus), `move_right(4)` after the cast (short).

**I1 `the-rings`, *Los aros*** (`the-ring-field`). Start (4, 7) on the
chalk line, `carrying` wand and broom; end (37, 9), the stone, with its
mark. Rings: `ring_1` (5, 8), `ring_2` (7, 8), `ring_3` (18, 8), `ring_4`
(20, 8), `ring_5` (33, 8), `ring_6` (35, 8). Goals: `through_in_order` the
six; `reach`; `lines_under` 18. `api`: the moves, `wizard.cast`, `def`.
Starting code: the given program of the design, 21 lines, with a comment
above it from Ilda (*the pair of rings is written three times: give it a
name*). Solution: the design's 17 lines. Wrong: the given program (wins
the flight, fails the lines), a `for pair in range(3)` round the pair (the
second pair flown into the trees: a bump), the function defined and
never called.

**P5 `the-race`, *La carrera*** (`the-race-course`). Start (10, 7),
`carrying` wand and broom; end (31, 7) with its mark; Zarek at (10, 5).
Rings on row 8 at columns 12, 15, 17, 20, 22, 24, 27, 29 (`ring_1` to
`ring_8`). `race`: against `zarek`, `lines` 14, `finish` (31, 7), `path`
41 cells from (10, 5): right to (12, 5), down to (12, 6), right to (15, 6),
up to (15, 4), right to (17, 4), down to (17, 6), right to (20, 6), up to
(20, 4), right to (22, 4), down to (22, 6), right to (24, 6), up to (24, 4),
right to (27, 4), down to (27, 6), right to (29, 6), up to (29, 5), right to
(31, 5), down to (31, 6), (31, 7): the implementer counts the cells and
pads the path's last straight so that Zarek crosses (31, 7) at tick 55
exactly (14 + 41), and a unit test holds it. Goals: `through_in_order`
the eight; `before` `zarek`; bonus `lines_under` 12. `api`: the moves,
`wizard.cast`, `def`. Starting code: Ilda's comments: the function with
two arguments, the word, the start, the four pairs. Solution: the
design's 11 lines (`two_rings(3, 2)`, `(3, 2)`, `(2, 3)`, `(2, 2)`);
its tick table: off at 11, cast at 12, flight 37 more, the finish at 49.
Wrong: the 18 lines without a function (the finish at 56, after Zarek's
55: the test holds it), a pair skipped (five ticks served, loses), the
arguments in the wrong order (a bump at a ring's side or a ring missed).

**I2 `the-rematch`, *La revancha*** (`the-race-course`). As the race, with
the rings at columns 12, 14, 17, 19, 22, 25, 27, 29, Zarek's `lines` 12 and
his path 38 cells (the same shape, the dips one cell shallower where the
count asks), crossing at tick 50; the starting code is the race's
solution. Goals: `through_in_order`; `before`. Solution: the calls
`two_rings(2, 3)`, `(2, 3)`, `(3, 2)`, `(2, 2)`, 11 lines, the finish at
49. Wrong: the race's solution unchanged (bumps at the first ring's side),
twelve lines (a tie at 50, Zarek's), a pair missed.

### 3.4 The stories

`content/stories/<id>/story.json` with the staging, as chapter 3's, and
the steps' words from Gemini (39.7); the design's section 4 gives every
step. Figures that go together move in one step (D103).

- **`the-morning-after`**: on `the-dormitory` by morning (its morning
  picture, D126): the wizard, the mate and the friend wake (the sleeping
  rows to standing), gather by the common room's door (steps 1 to 3), then
  the scene changes to `the-broom-shed`: the three walk in from the bottom
  edge up the path to the door and inside to (9, 8), (8, 8), (10, 8) (step
  4); the friend bends (the picking-up row) at (8, 8) and stands (step 5);
  step 6. Two scenes in one story: the story's `scenes` list, the page
  loading the second when the step says `scene` (a story step may change
  the scene, new; the first story of a chapter that starts elsewhere).
- **`the-flying-lesson`**: on `the-lake-edge`: the wizard at (1, 7), the
  friend (0, 6), the mate (0, 8); Ilda walks in from the left edge to
  (1, 5) with two first-years behind her (the friends' other colours,
  `teku-b`/`nuri-b`, to (0, 4) and (0, 3)) (step 2); Zarek flies in from
  the top edge along column 3, circles (3, 3)→(4, 3)→(4, 4)→(3, 4) and
  lands at (3, 5) (step 3); steps 4 and 5.
- **`the-finish`**: on `the-race-course` by the finish: the wizard at
  (31, 7) flying then landing, Zarek landing at (31, 5) a moment later
  (step 1), Ilda walking in from the stand to (30, 9), the friend and the
  mate behind her (steps 2 and 3); Rinlo standing at (38, 10) by the gate,
  facing left; the three walk to (35, 9), (34, 9), (35, 10) (step 4); his
  words in italics inside the voice's step; steps 5 and 6; the chapter's
  map shows chapter 5's first stop locked.

### 3.5 The lessons

Six lessons as the design's section 4 (`lesson.json` with its `speaker`
and `teaches`; `en.md`, `es.md`, from Gemini, 39.7), their *Try it* blocks
plain Python (D170, D174): `lists` (two pages, `teaches` `wizard.find_all`,
`len`), `for-each` (one page), `checking-each` (one page), `drevo` (one
page, no block, speaker `ilda`, `teaches` the spell), `an-action-of-your-
own` (two pages), `arguments-of-your-own` (one page). The lesson runner
(D142) runs the blocks as now.

## 4. The pieces

### 39.1 The debts of 0.0.5

- **D191**: `app/playwright.config.ts` under `CI`: test timeout 360 s,
  expect 45 s; the specs' own waits through a helper `ciTimes(ms)` in
  `app/e2e/support.ts` (×3 under `CI`), used by every `waitForFunction`
  and `waitForTimeout` of the specs; the workflow unchanged.
- **`ci/push.sh` refuses a tag whose version is not the commit's**: for
  every annotated tag `v<x>` it is about to push, the `version` of
  `app/package.json` at the tag's commit must be `<x>`; otherwise it stops
  with the two values and the way out (the version commit first, then
  `git tag -f -a`). A test in `tests/project/test_push.py` runs the check
  on a scratch repository.
- **The debug button in the public build**: *Escribir la solución* shows
  whenever `debugging()` is true (`?debug`), not only under
  `import.meta.env.DEV`; the solution is loaded from the level's
  `solution.py` as now (the pack-world step already ships it; if it does
  not, it ships it under `?debug`'s content only).
- **The stray rim ticks** beside `the-way-down`'s `arch_low` and
  `the-crossing`'s `arch_mid`: the rim's outline stops at a wall joint's
  pixels (a dark pixel row shorter than the rim's minimum run is not
  outline): `image_first.rimmed` takes a `min_run` (default 6 px), the
  two scenes exported again, the doors' sheets looked at.
- **The win card's words**: checked once more with a level whose `learned`
  holds backquotes (`the-three-doors`): if a raw backquote shows, the
  card's `learned` and `outro` go through `withCode` as the outcome text
  does; otherwise the debt is closed in the report.
- Check: `ci/check.sh`; `app/e2e/levels.spec.ts` and `chapter-3.spec.ts`.

### 39.2 The story bible, the course and the chapter

- `docs/dev/story.md`: the places table's chapter 4 row replaced by four,
  one a scene (3.2), in order; the characters table: Zarek's row gains
  that he flies with flourishes and loses the race and its rematch well;
  Rinlo's row that he is seen at the end of chapter 4 muttering, unnamed;
  the spells table: `drevo` as D185 says; *The wizard's way*, chapter 4's
  beats rewritten to the design's section 1 (the morning after, the shed
  and the black thread, the brooms counted, untied in the row and in the
  straw, checked; Ilda's class and Zarek; the first flight over the lake's
  arm; the long ring field with the trees and the pond; the race and Ilda's
  count; the rematch; the broom given; the older pupil muttering by the
  gate; the voice a mystery), no wand shop.
- `docs/dev/course.md`: chapter 4's section rewritten to the seventeen
  stops of 3.1 with the ideas and the API each unlocks, the four scenes
  and the world features it needs (D182 to D190); *How a level earns its
  idea* gains two rules the owner gave: a function is taught where a loop
  cannot serve (D190), and a race is won by a count the child sees (D189);
  the chapter 5 outline unchanged; the count updated.
- `content/chapters/04-the-broom/chapter.json`: the seventeen items.
- `docs/dev/plan.md` 5.6 names this sprint.
- Check: `ci/check.sh`; the course book regenerated.

### 39.3 The world

In `world/kydux_world/`, tests in `world/tests/test_broom.py` (new) and
the ones they touch:

- `broom` and `ring` in `THING_KINDS`; `broom` in `CARRIED_KINDS`; the
  `Broom` class with `knotted` and `untie()` (D183: `too_far`, `no_knot`,
  the event `untie`, a tick); the `Ring` class (D187); their roles in
  `api.py` (`broom.knotted`, `broom.untie`, `ring` a thing).
- `find_all` as it is, with a test of its order on P3's and F1's ways
  (3.3); `len` among `child_builtins`; `say` of a number (D184).
- Goals: `say` with `count_of`; `untied`; `no_error`; `through_in_order`
  with its `missed`; `before`; `cast` with `from` (3.3); their `params`
  for the page.
- Flying (D185, D186): `wizard.flying`; `drevo` in `KNOWN_SPELLS` and
  `SPELLS`, `no_broom`; `World.can_enter(tile, flying)` reads the
  terrains' `fly`; a `low` terrain refused to a walk with its kind, a
  `high` one a bump to a flight; the ring's cell crossed vertically counts
  for the goal, entered sideways bumps; the events `fly` and `land` (the
  land at the run's end, on the cell reached).
- The racer (D189): `ACTOR_KINDS` gains `racer`; `Racer` with its `path`,
  `lines` and `finish`, standing until its tick, then a cell a tick,
  flying, resting at its last cell; the wizard's take-off delay: the
  world's run starts with the wizard held for `lines` ticks (the level's
  `race` present), counted from the program's text by the same rule as
  `lines_under`; the penalty: five ticks held before the finish cell for
  each ring missed when the wizard steps onto it; the goal `before`.
  Tests: the race's and the rematch's tick tables of 3.3; the 18-line
  program loses the race by one; the twelve-line rematch ties and loses.
- `def` in the sandbox: already Python; a test that a function with and
  without arguments runs and that the trace's line numbers inside a
  function are the function's lines (the step-by-step's highlight).
- Scenes: `read_scene` reads `low` and `high` terrains (`fly`), the plan
  window's map carries them.
- The API table and the notebook's words for `find_all`, `len`, `broom.
  knotted`, `broom.untie`, `wizard.cast` with `drevo`, `def`, in
  `i18n/<lang>.json`, Claude's.
- Check: `world/tests`, `test_api_table`, the i18n dynamic names.

### 39.4 The page

In `app/src/`:

- **Sprites of things** (D182): `engine/things.ts` draws a thing without
  a scene picture from `content/art/things/things.json`, at its cell, foot
  on the lower edge, depth by row, scaled by the cell; the broom lying,
  the ring standing; `data-sprite-things` lists them for the tests. A
  hidden broom (P1) is not drawn until revealed, as a hidden key.
- **Flying** (D185): the figure's flying rows (`rows.fly`) while
  `flying`, lifted half a cell with a soft elliptical shadow on the ground
  and a bob of a few pixels over the three frames; a flown step tweened in
  a third of a walked step's time at every speed; the flight's sound,
  `engine/sound.ts`: a filtered-noise wind, starting at `fly`, swelling a
  little with each flown step, fading at `land`; the steps' taps silent
  while flying. The `drevo` cast drawn with the casting rows, then the
  lift.
- **Low and high cells** (D186): the `no_walk` thought with the cell's
  kind (*el agua no se pisa*, *el seto no se pisa*), the bump's thought
  for a high cell (*las copas no se pasan*), through `blockedText`; the
  plan window hatches them.
- **The race** (D189): the racer drawn flying along its path from its
  tick; a start band over the scene while Ilda reads (*Ilda lee los
  programas: tú, 11 líneas; Zarek, 14*), ticking down; the penalty loop
  drawn as a circle over the cell before the finish; the win and lose
  cards' count line from the goal's `params` (`t('race.count')`:
  *líneas + vuelo + penalización = tick*).
- **The camera** follows the wizard on the wide scenes as on the field,
  zooming out on a story's wide shot where the staging says (`camera`).
- **A story that changes scene** (`the-morning-after`): `ui/story.ts`
  loads the step's `scene` and goes on.
- Check: Vitest; e2e in 39.8.

### 39.5 The four scenes' art

For each scene: `art/scenes/<id>/cut.json` and `manifest.toml` as the
storeroom's, `tools/art/export_scene.py <id>`, the sweep green, and
`all-<id>.png` and `states-<id>.png` looked at before the commit. The
order of work for a scene:

1. The prompt copied from `drafts/chapter-4/prompts/` into
   `tools/art/prompts/` under the scene's name (the art's source).
2. `map_from_image.py grid` on the painting (20 × 15, or 42 × 18 with the
   cell the picture's height divided by 18 and the columns centred); the
   cells read against the design's (3.2); `sheet` for marking;
   `marks.txt` → `map.txt` and `scene.json`, with the terrains `low` and
   `high` (D186) and the furniture; no `things` but the race's poles.
3. The grid taken out of the painting by an edit (`<scene>-nogrid.md`, as
   `game-library6-nogrid.md`), the base every later picture is measured
   against.
4. Static things that a figure passes behind (the shed's bench, barrel
   and hay; the jetty's posts; the trees' trunks and the benches of the
   fields; the race's poles and stand) marked and cut, the walls' top
   bands in `cuts` (the shed's and the castle's wall), the thresholds of
   the morning measured (the paintings are bright: the field's).
5. Export, sweep, sheets; a figure on every walked cell whole or hidden
   only behind what should hide it; the owner's `?debug` view opens each.

Images per scene: 1 nogrid each (4), and retries where a nogrid edit
drifts (2). The sprites: the ring cut from `scene-ring-field-2` (no
image); the broom from `sprite-broom.md` (1, +1 retry). The figures
(D188): `figure-fly-boy.md` and `figure-fly-girl.md` (2, +2), `figure-
zarek-standing.md` and `figure-zarek-fly.md` (2, +1), `figure-rinlo-
standing.md` (1, +1). `content/art/scenes/<id>/SOURCE.md`,
`content/art/things/SOURCE.md` and the figures' `SOURCE.md` for each.

### 39.6 The levels and the stories

`content/levels/<id>/level.json`, `solution.py`, `wrong/` and the goals of
3.3 for the eight levels; `content/stories/<id>/story.json` for the three
stories of 3.4; `tools/scene_maps.py` builds each level's and story's map
from its scene. The unit tests of 3.3 (the orders of `find_all`, the race's
tick tables, the losing programs) in `world/tests/test_broom.py`. Check:
`ci/check.sh`; `tests/project` for the placement against the cut-outs and
the sprites.

### 39.7 The texts

Briefs in `tools/write/briefs/`, as chapter 3's (`chapter-3-levels.md`,
`chapter-3-lessons.md`, `chapter-3-stories.md` are the model; the design
document's sections 1, 3 and 4 are given as context in full, since the
owner approved its levels, lessons and stories; a brief's `context` never
names a draft, so the sections are pasted into the brief's words):

- `chapter-4-lessons.md`: the six lessons of 3.5, English and Spanish,
  each with its *Try it* where the design gives one; Ilda speaks *Drevo*,
  the friend the rest; the metaphor rule (a list, a function, an argument
  named by the child's word once, then the programmer's).
- `chapter-4-levels.md`: the eight levels' `text.<lang>.json`: title,
  goals as the child reads them (the race's goals name Ilda's count),
  starting code's comments (one a step, naming the method; the given
  programs of I1, F1 and I2 whole, with Ilda's or the friend's comment
  above), hints (three, the first on the idea, the last the whole, never a
  line of the solution), intro (the friend in the shed, Ilda on the
  field, the situation and the cells the design names, never the
  solution), outro, learned, `ways` names; the facts of 3.3 for each; the
  race's intro says Ilda's count in the child's words.
- `chapter-4-stories.md`: the three stories' `text.<lang>.json` with the
  steps of 3.4, the older pupil's muttered words in italics inside the
  voice's step, never his name.
- The words: the `no_broom`, `no_knot`, `too_far` (for a broom),
  `no_walk` kinds' and the high bump's thoughts; the race's start band
  and count; the notebook's words; `i18n/<lang>.json`, Claude's.
- Every draft read, corrected and moved into `content/`; the course book
  regenerated and read whole in Spanish.
- Check: `ci/check.sh` (i18n keys, forbidden words, the course book).

### 39.8 The tests, the debug view and the pictures for the owner

- Playwright, `app/e2e/chapter-4.spec.ts`: every level won by its
  solution at speed 4, in Spanish for a girl wizard and in English for a
  boy; every way of every level with ways; in P1 the brooms are not seen
  until found; in P2 the written-out program wins `three` and fails
  `four`; in F1 the given program stops with *no tiene nudo* and the fix
  wins all three; in P4 the walk into the water is refused and the flight
  crosses it three times faster (the step's duration measured); the
  flight's sound starts at the cast (`data-sound`); in I1 the loop round
  the pair bumps on the trees and the function wins under 18 lines; in P5
  the 18-line program loses by one tick and the function wins, the start
  band shows the lines; in I2 the race's solution bumps and the new
  arguments win; each story played to its end, the first changing scene;
  the chapter's stops in order on the map. Screenshots of every stop to
  `app/e2e/shots/chapter-4/`, each scene zoomed out once, the race's start
  band once, the count card once, for the owner.
- The sweep's sheets for the four scenes in `art/raw/game-check/`, and a
  sheet of the sprites and the new figures (`figures-check.png`).
- `?debug`: the low and high cells marked in the cells layer; the rings'
  order numbered.
- Check: `ci/check.sh --e2e` green.

### 39.9 Documents, and the walkthrough

- `docs/dev/architecture.md`: D182 to D194 in the decision log; the module
  map (`things.ts`, `sound.ts`'s wind, `music.ts`, `about.ts`, the racer); the world's API lines
  (`broom.knotted`, `broom.untie`, `wizard.find_all`, `len`, `drevo`); the
  goals table (`say` with `count_of`, `untied`, `no_error`,
  `through_in_order`, `before`, `cast` with `from`); the events table
  (`untie`, `fly`, `land`); the map's characters (`low`, `high`).
- `art/README.md`: the four scenes under *Where things are kept*; a
  section *Sprites of things* (D182) and the flying rows under *The
  figures*; the wide scenes' grid under *Where the cells are*.
- `docs/dev/dev-environment.md` if a step changes.
- The walkthrough of chapter 4 for the owner, as chapter 3's
  (`drafts/recorrido-capitulo-4-<date>.es.md`, the captures of every stop
  with a line under each), made by the same tool.

### 39.10 The music

- `content/music/`: five themes (`arrival`, `the-library`, `the-passages`,
  `the-broom`, `the-familiar`), written by the implementer as notes in the
  manner D192 gives, each 48 to 64 bars in two or three sections that
  loop without a seam, `full` and `quiet`; a `README.md` beside them that
  says the file's form and how a theme is tried alone (a page under
  `?debug` that plays any theme, `#music`).
- `app/src/engine/music.ts`: the voices, the sequencer (look-ahead
  scheduling on the audio clock, tempo from the file), the reverb (an
  impulse made of decaying noise), the loop, the cross-fade between a
  chapter's arrangements and between themes when the chapter changes
  (two seconds); the volume setting; start at the first gesture; paused
  while the tab is hidden.
- `app/src/ui/look.ts` and the settings screen: the music slider
  (`t('settings.music')`, off to full, five steps), kept in the progress's
  settings (`music`, default 0.6), the sounds' switch as now.
- `chapter.json` of the five chapters names its theme (`"music"`); a
  content test holds that every chapter has one and every theme parses and
  loops on a bar.
- Tests: Vitest for the sequencer's timing (a bar's notes scheduled at
  their beats at two tempos) and the arrangements' switch; e2e: the music
  starts after the first click on the start screen (`data-music` playing),
  the slider at off silences it, a lesson plays `quiet` and a story
  `full`.
- Check: `ci/check.sh`; `app/e2e/settings.spec.ts` (or where the settings
  are tested).

### 39.11 The page's look and the welcome page

- `app/src/style.css` rewritten around tokens (D193): colours, radii,
  shadows, spacing, type; components: `.card`, `.panel`, `.button`
  (primary, quiet, danger), `.chip`, `.field`, the header, the footer; the
  parchment grain as a CSS gradient noise, no image; every screen (start,
  creator, map, lesson, level with its editor and cards, story, settings,
  the plan window, the notebook, the guide) restyled with them, nothing
  moved in the layout the browser tests rely on (the `data-*` hooks
  unchanged). A before/after sheet of every screen in
  `art/raw/game-check/look-before-after.png` (the shots of `app/e2e/shots/es`
  beside the new ones) for the owner.
- The header's mark: an inline SVG of a pointed hat and a wand, two
  colours, 28 px, beside the name; the browser tab's icon the same.
- The welcome page `#about` (`app/src/ui/about.ts`): the hero painting
  (`tools/art/prompts/welcome-castle.md`: Arvelia on its hill above the
  lake at dusk, the village at the foot, seen from the field's path, 16:9,
  no text; 1 image, +1 retry), cut to the page's width; the sections of
  D193, their words in `i18n/<lang>.json` under `about` (Claude's, from
  the READMEs; short sentences a parent and a child both read); three
  pictures of the game taken from the browser tests' shots (a story, a
  lesson, a level), shipped under `app/public/about/`; the *Play* button
  to the start screen; a link to it in the header (*Qué es Kydux* /
  *About*) and from the start screen's first visit, which shows the
  welcome's first section above *Partida nueva*.
- The map's chapter cards: each with a crop of its first scene's ground
  (`content/art/scenes/<scene>/ground.webp`, taken at build by
  `pack-world.mjs` into a small `card.webp`), the chapter's title over it;
  a locked chapter greyed.
- The READMEs: a line that the welcome page exists.
- Tests: Vitest for the tokens' presence (a smoke test that the computed
  style of a button is the token's); e2e: the about page renders in both
  languages with its three pictures and its button, the start screen's
  first visit shows the welcome, the screenshots of every screen taken
  again into `app/e2e/shots/`.
- Check: `ci/check.sh`; `app/e2e/smoke.spec.ts` (or the spec that walks
  the screens).

### 39.12 The portraits

- `tools/art/prompts/portrait-<id>.md` for the eleven characters (D194):
  each from the character's row of `story.md` and, where a figure sheet
  exists, with the sheet as the reference picture so that the face, the
  hair and the clothes match (Ilda, Dask, Wenna, Baro, Eldra, Nuri, Teku;
  Zarek and Rinlo from this sprint's standing drawings; Orla and Bimo new,
  described from the bible: Orla calm and kind, grey hair gathered, a deep
  blue robe; Bimo a grey school cat with a white chest); the wizard's two
  base busts from the sheets' base (`portrait-wizard-boy.md`,
  `portrait-wizard-girl.md`), recoloured by `tools/art/figures.py
  --portraits` into `content/art/portraits/wizard-<look>-<gender>.webp`
  (sixteen files, no image).
- `tools/art/sprites.py portrait <png>`: cuts the bust from the magenta,
  trims, scales to 512 px tall, writes the webp.
- The page: the lesson's speaker (`ui/lesson.ts`), the story's and the
  level card's speaker (`ui/story.ts`, `ui/cards.ts`), the creator's looks
  and chosen portrait (`ui/screen.ts`'s creator); the pixel busts removed
  with their files; `data-portrait` names the file shown.
- `content/art/portraits/SOURCE.md`; `figures-check.png` gains a row of
  the portraits.
- Tests: a content test that every speaker a lesson, a story or a level
  names has a portrait, and every look of each gender; e2e: the lesson
  page shows the speaker's portrait, the creator the eight.
- Images: 11 characters + 2 bases = 13, and 7 retries: 20 at most.
- Check: `ci/check.sh`; `app/e2e/lessons.spec.ts` and the creator's spec.

### 39.13 The report, and the prompt for the review

The report in Spanish and **the prompt for the designer's review**: a
Markdown block the owner pastes, naming the commits in order, what differs
from this plan and the design document and why, what was corrected by hand
in Gemini's drafts, the Gemini images spent (the counts against 50 and 30), the
check sheets, the look's before/after sheet and the screenshots to look
at, and what is left open.

## 5. Gemini images

Two budgets, each image named in its commit, and one rule for both (the
owner, 2026-11-10): a budget may be exceeded by up to a quarter without
asking; beyond that quarter nothing is asked of Gemini until the owner
says so, through the report. **Chapter 4:** eleven of its fifty are spent
(the design's bases and trials); this sprint's budget for it is
**twenty-four** (4 nogrid + 1 broom + 2 + 2 + 1 figures = 10 planned, and
14 retries), so thirty at most without asking, and the chapter's fifty
stretch to sixty-two the same way. **The look and the portraits:** a
budget of **thirty** (the welcome's hero 1 + 1, the portraits 13 + 7, and
8 for whatever the owner's review of the look asks), so thirty-seven at
most without asking. Text drafts: three briefs (39.7), asked again when a
draft is wrong in its facts; the welcome's words and the music are
Claude's, not Gemini's.

## 6. Acceptance test (for when the owner tries it)

On `https://localhost:5173/?debug` in a normal window, a new game as a
girl and again as a boy, from chapter 4's first stop:

1. **La mañana siguiente.** The dormitory by morning: the three wake and
   gather; the scene changes to the shed; they walk in; the friend bends
   over a broom; the black thread is told.
2. **Las listas** and **El cobertizo.** *Try it* prints a list and its
   length. In the level no broom is seen; `find_all` shows them; the
   number said wins; in `?debug` the three ways show six, eight and nine.
3. **Para cada una** and **Las escobas de la fila.** The loop unties the
   row in every way; three untied lines written out fail the longer ways.
4. **Las escobas de la paja.** The counted walk reaches each broom in the
   three ways; `print(broom.position)` in the loop shows the cells.
5. **Un si dentro del bucle** and **La revisión.** The given program
   stops at the first broom with *esta escoba no tiene nudo*; the `if`
   wins all three ways.
6. **La clase de vuelo.** Ilda and the class arrive; Zarek flies in and
   lands; the broom is handed.
7. **Drevo** and **El primer vuelo.** A walk into the water is refused;
   from the jetty the word lifts the wizard, the wind sounds, the flight
   crosses in a third of the time, the broom lands on the stone.
8. **Una acción propia** and **Los aros.** The 21 lines fly the course and
   fail the lines goal; a `for` round the pair bumps on the trees; the
   function wins. The camera follows the flight across the long field.
9. **Argumentos propios** and **La carrera.** The start band shows the
   lines read; Zarek takes off at 14; the 18-line program crosses one
   tick after him; the function with arguments crosses first; the card
   shows the count.
10. **La revancha.** The race's program bumps at the first ring; the new
    arguments win by one tick; twelve lines tie and lose.
11. **La meta.** Zarek lands and concedes; Ilda gives the broom; the
    three walk to the older pupil by the gate; his muttered words; the
    chapter's map shows chapter 5's first stop locked.
12. In `?debug`, every scene's cells look right (low and high hatched),
    the sprites stand on their cells, the figures' flying rows and the
    new figures' sheets have no stray pixels; the sweep's sheets show no
    figure cut wrong.
13. The debts: `ci/push.sh` refuses a tag whose version is not the
    commit's (tried on a scratch tag, then deleted); *Escribir la
    solución* shows under `?debug` in a preview build; the way down's
    arch has no stray ticks.
14. **The music.** On the start screen the first click starts chapter 1's
    waltz; the map and a story play it full, a lesson and a level quieter;
    chapter 3's theme is the night's, chapter 4's the morning's; the
    settings' slider lowers it and silences it at off, and the choice
    survives a reload; `#music` under `?debug` plays each theme alone.
15. **The look.** Every screen in the new look at a desktop's and a
    phone's width: parchment page, paper cards, rounded buttons, the mark
    in the header; nothing crowded, nothing moved from where it was;
    `#about` tells what Kydux is in both languages with the castle's
    painting and the three pictures, and *Play* starts; the first visit
    shows the welcome above *Partida nueva*; the map's chapter cards show
    their scenes.
16. **The portraits.** The creator offers the eight looks as painted busts
    and shows the chosen one large; every lesson shows its speaker's bust
    (Teku or Nuri in chapters 1 and 3, Wenna in 2, Ilda in *Drevo*), and
    a story's bubble a small one; each portrait matches its figure's
    colours.

## 7. What the implementer hands over

A report in Spanish, one thing after another, each explained for a reader
who does not know the code, and then its picture, only pictures of the
final commit: every scene zoomed out, each level's start and win, the
flight, the race's start band and count card, each story's first step,
the new figures' sheets and the sprites; the commits with their hashes and
the state of `ci/check.sh --e2e`; what differs from this plan and the
design document and why; what was written by hand in Gemini's drafts; the
Gemini images spent, named, and the count against 50; what is left open;
and the prompt for the designer's review.

## 8. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-39.md (this plan, whole), drafts/chapter-4/capitulo-4.md
(the owner's design, in Spanish, second version, with its pictures in
drafts/chapter-4/escenas/ and the Gemini prompts of the scenes in
drafts/chapter-4/prompts/), docs/dev/sprint-30.md (how chapter 3 was
built), docs/dev/course.md ("How a level earns its idea" and chapter 4),
docs/dev/story.md, art/README.md whole (especially "How a scene's states
are made" and "The figures"), D51, D85, D133, D142, D148, D149, D160,
D170, D174 to D181 in docs/dev/architecture.md with its API, goal and
events tables, tools/write/README.md and rules.md, and the memory notes
kydux-two-agents, kydux-sprint-38-state, kydux-designer-review-38,
kydux-designer-chapter-4-proposal, kydux-checks-per-piece,
kydux-designer-scene-states-method, kydux-chapter-design-learnings and
kydux-writing-feedback. Build sprint 39 whole: pieces 39.1 to 39.13 in
order, one local commit each; before each commit ci/check.sh and the
browser specs the piece touches green, and the whole ci/check.sh --e2e
once before the last commit; never a push, never a timer (the owner
pushes with ci/push.sh). Never stop or build into the servers on ports
443 and 5173, and never kill a vite, node or nginx process of the
owner's (CLAUDE.md); your own preview or dev server on 4174 is stopped
when you are done. Gemini's budgets are 24 images for the chapter in
this sprint and 30 for the look and the portraits, each image named in
its commit; a budget may be exceeded by up to a quarter (30 and 37)
without asking, and beyond that you stop painting and ask through the
report; the music and the welcome's words are yours, not Gemini's;
Gemini writes every text the child reads from the briefs the plan
names, and you read and correct every draft before it enters content/.
The plan decides everything; where it does not, take the smallest
choice that keeps its intent and say it in the commit; a choice that
changes what the owner sees is asked first, through the owner. Every
document and comment in the present. Before git add, read git diff of
each file and stage only your own hunks; commit promptly. Hand over
what section 7 asks, as a report in Spanish, and end with the prompt
for the designer's review in English, in a code block: the commits, the
differences from the plan with their reasons, what to look at with
care, the images spent, what is left open, and the limits.
```
