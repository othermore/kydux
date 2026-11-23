# Sprint 55 — A trial seen before it fades, a wizard that faces the circle, the plates' light whole, and Rinlo down the back stairs

On 2026-11-19 the owner read chapter 5's walkthrough made on
sprint 54's review (the sixth of 2026-11-18) and wrote nine
comments under its pictures. Two were about words, and the
designer entered them, in Spanish and in English, before this
plan (`be385c0`): *El nombre y el color*'s card names the friend
whose grey hare Orla praises, and *Una línea en el libro*'s card
says what the level asks in the owner's own sentence. One was a
staging the designer entered as well (`7613524`): in *El rastro*,
while the familiar is inside the passage, the friend who stood by
the second flap walks over to the others, beside the passage's
mouth. The rest are this sprint. In the owner's words:

> (*El círculo*, inicio) No llego a ver la criatura de Teku.
> Deben aguantar suficiente tiempo antes de desvanecerse, para
> que se vea aquí
>
> (*El círculo*, al ganar) El mgo debería estar mirando hacia el
> círculo,no hacia abajo.
>
> (*Fuera del círculo*, tick 12) El circulo de luz en torno a
> donde el zorro está cuando llegua a la luna, sale cortado por
> abajo, en la linea de la casilla.
>
> (*Las órdenes de Orla*, tick 9) Aquí el círculo también sale
> cortado.
>
> (*Las órdenes de Orla*, tick 16) Aquí el círculo no sale
> cortado poque lo tapa el muro. Pero la máscara debería estar en
> el muro, no en el círculo.
>
> (*Lo que trajo el familiar*, paso 1) Rinlo tiene que aparecer
> desde arriba, abrir la puerta y bajar las escaleras. Está toda
> esa animación hecha? No la veo en las capturas.

**Where each is today.**

- *The friend's hare.* A staged trial with no colour is seen four
  seconds from the start card's close and fades in one, and those
  seconds are shorter as the speed is higher (D276,
  `TRIAL_SEEN_MS`, `fadeTrials` in `scene.ts`). The walkthrough
  closes the card, sets speed 4 and takes its start picture
  within three seconds: the hare has had one second and a
  quarter, and is gone. A child who reads the card, closes it and
  looks at the book first does not see it either, though the
  card says *Mira: Teku ya tiene su prueba en el círculo*.
- *The wizard's back.* A wizard faces down when a level opens:
  the world places it so (`world.py`, `facing=Direction.DOWN`)
  and the page too (`scene.ts`, `placeWizard(this.map.start,
  'down')`), and no key of a level says otherwise. In the hall's
  six levels the wizard stands at (10, 10), under the circle
  (8, 6) to (11, 8), and never moves: it faces away from its own
  familiar from the first tick to the win.
- *The plates' light.* The moon, the sun and the star are things
  lying in the floor, each with a state `lit` cut by the
  difference (D273, D148). The exporter cuts a thing's picture at
  the bottom of its row (`clip_below`, `export_scene.py`): the
  moon and the sun, on row 4, lose their glow below y = 5.0, a
  straight line across it, though their boxes go down to 6.2.
  The star's glow is cut by its own box above (9.35) and on the
  left (12.3); below, the box ends at 10.74, the top edge of the
  hall's front wall, and the wall is what ends it there. Looked
  at four times its size, the glow's rim is besides a hard line
  with a fringe of loose dots, since a mask by difference is 0 or
  1 (D155) and the glow's difference dies away slowly.
- *Rinlo.* The animation is not made. In *Lo que trajo el
  familiar*'s first step Rinlo, seated in the forgotten room at
  (8, 3), is taken out of sight where he sits and comes into
  sight at (2, 12), under the arch at the corridor's far end. The
  room's side door, painted shut and seen from its edge at
  (5, 3), has no open state (D273), and the landing and the back
  stairs the painting shows beyond it are wall in the map: no
  figure can be staged there. The walkthrough takes one picture
  of a step, at its end, so that nothing a figure does on its way
  is in the pictures.

**What this sprint holds:**

1. A staged trial with no colour is seen ten seconds, whatever
   the speed (D285).
2. A level says which way its wizard faces when it opens; in the
   hall's six levels and the passage's two it faces up (D286).
3. A plate's light is drawn whole and ends softly (D287).
4. Cells only a story's figure walks: the forgotten room's
   landing and its back stairs (D288).
5. The forgotten room's side door opens, and Rinlo is seen
   opening it and going down the back stairs before he comes out
   under the arch (D289).
6. The walkthrough takes pictures of a long step while it plays.

It is built after sprint 54, on the designer's last commit.

## 1. Decisions taken here

Their words are here; the programmer enters them in
`docs/dev/architecture.md` as it builds each, and brings to them
the decisions they touch (D103, D148, D155, D270, D273, D276).

- **D285 — A staged trial with no colour is seen ten seconds from
  the start card's close, whatever the speed.** Decided
  2026-11-19 by the owner (*No llego a ver la criatura de Teku.
  Deben aguantar suficiente tiempo antes de desvanecerse, para
  que se vea aquí*). A trial staged with no colour (D276) is what
  the level's card points at, and the child must find it in the
  circle after closing the card. It is seen for ten seconds of
  the page's clock from the start card's close
  (`TRIAL_STAGED_SEEN_MS`, `scene.ts`) and then fades in one
  (`TRIAL_FADE_MS`). The speed does not shorten them: the speed
  is a run's, and the staged trial was called before any run. It
  waits while a run is paused, and it does not come back when a
  run starts again in that visit, as D276 says. A trial called in
  a run keeps D276's four seconds, shorter as the speed is
  higher. The walkthrough's start picture of *El círculo* shows
  the hare. Rules out a staged trial gone before the child has
  looked at the scene, and one that stands the whole level.
- **D286 — A level says which way its wizard faces when it
  opens.** Decided 2026-11-19 by the owner (*El mago debería
  estar mirando hacia el círculo, no hacia abajo*). A level's
  `facing` is `up`, `down`, `left` or `right`, and `down` where
  it has none. It is the way the wizard faces at tick 0: in the
  world, which reads it wherever it reads the way a wizard faces,
  and on the page, when the level opens, when a run is started
  again or stopped, and on the timeline's first tick (D241). A
  level whose wizard stands still before what the level is about
  says it: the hall's six levels, whose wizard stands under the
  circle, and the passage's two, whose wizard stands under the
  passage's mouth, say `"facing": "up"`. Rules out a wizard with
  its back to its own familiar's birth, and a turn asked of the
  child's program only to look the right way.
- **D287 — A light lying in the floor is drawn whole and ends
  softly.** Decided 2026-11-19 by the owner (*El circulo de luz …
  sale cortado por abajo, en la linea de la casilla*; *la máscara
  debería estar en el muro, no en el círculo*). A plate's `lit`
  picture (D273) holds the whole of its glow as Gemini painted
  it: its box is as large as the glow and its `reach` takes the
  picture down to the box's bottom, past the bottom of the
  plate's row. No edge of the picture cuts the glow on the floor;
  the one straight edge is where a wall stands over it, the
  star's bottom on the top edge of the hall's front wall. A state
  of a thing lying in the floor may give its difference a
  `feather`, in cells: the mask's alpha rises from 0 on the
  difference's outline to 1 at that distance inside it, so that
  the glow dies away with no line and no loose dot at its rim.
  The feather is measured on the difference before the box cuts
  it, so that an edge the box makes on a wall stays sharp. It is
  the one mask by difference that is not 0 or 1 (D155): a thing
  lying in the floor is under every figure, and nothing is seen
  through it. Rules out a glow cut on a cell's line or on its
  box's, and a soft mask on anything a figure walks behind.
- **D288 — Some cells only a story's figure walks.** Decided
  2026-11-19 by the designer, for the owner's (*Rinlo tiene que
  aparecer desde arriba, abrir la puerta y bajar las escaleras*).
  A scene's terrain with `"walk": "story"` is floor the painting
  shows where no level goes. In a level's map it is what it is
  with `"walk": false`, a wall or, with `"sight": true`, a shelf:
  the wizard, a familiar, a flight, the sight, the plan and the
  goals read it so, and a level on the scene is, to the letter,
  the level it is without it. A story's staging (`story_on_scene`)
  counts it floor: a figure of a story stands on it, walks over
  it, and a door of the story stands on it. The sweep counts it
  among the cells walked on. `the-tower-passage` has two such
  terrains: `l`, the landing outside the forgotten room and the
  back stairs (`"kind": "wall", "sight": false`), on (2, 3) to
  (5, 3) and (2, 4) to (2, 8); and `v`, the floor before the
  room's crates and stool (`"kind": "furniture", "sight": true`),
  on (6, 3) and (7, 3). Rules out a level's cell opened to make
  room for a story, and a figure of a story staged on a wall.
- **D289 — The forgotten room's side door opens, and Rinlo comes
  down the back stairs.** Decided 2026-11-19 by the owner (*Rinlo
  tiene que aparecer desde arriba, abrir la puerta y bajar las
  escaleras*). The forgotten room's side door, in its left wall
  at (5, 3), onto the landing of the back stairs, is the thing
  `room_door` of the scene's settings: its base is Gemini's edit
  of the painting with the doorway empty and the floor running
  through it, its state `closed` the painting's own leaf, its
  state `open` Gemini's edit of the base with the leaf turned on
  its far jamb and swung onto the landing, flat against the wall
  under the scroll shelves, each cut by the difference (D148); it
  rests closed (D104), so every level and story of the scene
  shows it shut. Each edit is asked on a part of the painting and
  laid on it by `tools/art/lay.py`, the difference within its box
  only (D281): every other pixel of the ground is the painting's
  own, and the trench's covers stay fitted. The open leaf stands
  against the wall, on row 2: a figure on the landing passes in
  front of it. The door is a story's thing (`"art":
  "room_door"`); no level has it, and the arched door in the
  room's back wall has no open state. In *Lo que trajo el
  familiar* Rinlo stands up, walks to the door, opens it, crosses
  the landing and goes down the stairs to their foot at (2, 8),
  walking out of sight there; in the next step he comes into
  sight at (2, 12), under the corridor's arch, and walks to the
  children. Between the stairs' foot and the arch no figure is
  drawn: there the painting shows the corridor's wall from above
  and its arch from the front, and a figure walking through would
  have its head over the wall's top while its legs stood in the
  arch's opening. Rules out a Rinlo who is taken out of his room
  and put in the corridor, and a figure drawn across the arch's
  stones.

## 2. What is asked

### 2.1 The staged trial is seen (D285)

**Where it is.** `app/src/engine/scene.ts`: `TRIAL_SEEN_MS`
(4000), `TRIAL_FADE_MS` (1000); a staged pale trial enters
`fading` with `left: TRIAL_SEEN_MS + TRIAL_FADE_MS, staged:
true`; `fadeTrials` spends `delta * this.playback.speed` on every
trial, and skips a staged one until `startClosed`. The one staged
trial with no colour in the course is the friend's hare of
*El círculo* (`the-circle`, the actor `friend_familiar`).

**What is asked.**

- A constant `TRIAL_STAGED_SEEN_MS = 10000`. A staged trial's
  `left` starts at `TRIAL_STAGED_SEEN_MS + TRIAL_FADE_MS`.
- `fadeTrials` spends the plain `delta` on a staged trial and
  `delta * speed` on the others. Paused, both wait, as today.
- Nothing else of D276 changes: the wait for the card's close,
  the fade's second, `fadedStaged`, `data-trials`.
- The walkthrough's `01-inicio` of *El círculo* shows the hare:
  look at the picture once the walkthrough is made anew. If it
  does not, the cause is found and told, not worked around with a
  longer number.

**Tests.** The unit tests of the fade hold both clocks: at speed
4, a staged trial is whole at nine seconds after the card's close
and gone at eleven and a quarter; a called one is gone in a
second and a quarter. `chapter-5.spec.ts`: the hare is in
`data-trials` behind the card and three seconds after its close
at speed 4, and leaves it; the spec may wait the real eleven
seconds once, and no other test waits for them.

### 2.2 The wizard faces the circle (D286)

**Where it is.** `world/kydux_world/world.py`: the wizard is made
with `facing=Direction.DOWN`. `world/kydux_world/level.py`: a
level's keys, and what the page is given of a level.
`app/src/engine/scene.ts`: the wizard's figure is made facing
`'down'` and `placeWizard(this.map.start, 'down')` puts it back;
`app/src/engine/layout.ts` reads the level. The hall's six levels
(`the-circle`, `the-name-and-the-colour`, `one-line-in-the-book`,
`the-slate`, `out-of-the-circle`, `orlas-orders`) start at
(10, 10); the passage's two (`the-small-passage`,
`the-forgotten-room`) at (9, 13), a cell below and left of the
passage's mouth at (10, 12). In none of the eight does the
solution move the wizard.

**What is asked.**

- `level.py`: the key `facing`, one of `FACINGS`; any other value
  is refused with the level's id; `down` where there is none. The
  level keeps it, and the page's level carries it.
- `world.py`: the wizard is made facing the level's `facing`.
- The page: the wizard's figure is made, and placed again
  (`placeWizard` at the start, a run started again, Stop, the
  timeline's first tick, a run shown ended and taken back),
  facing the level's `facing`. The way is kept as D241 says.
- `"facing": "up"` in the eight levels' `level.json`.
- The plan, the goals, the stars and the words read nothing of
  it.

**Tests.** `test_level.py`: the key read, its default, a wrong
value refused. `test_world.py`: a level with `"facing": "left"`
has its wizard facing left before any act, and an act that reads
the way (a bump's event, a cast) says left.
`test_levels_content.py` or `test_chapter_5_scenes.py`: the eight
levels say `up`. The page's unit tests: the level's facing
reaches the scene's first placing. `chapter-5.spec.ts`: in
*El círculo* the wizard faces up when the level opens, at the
solution's win, and after the run is started again (the scene's
own word for a figure's way, as the spec reads it today for a
familiar's).

### 2.3 The plates' light whole (D287)

**Where it is.** `art/scenes/the-tower-hall/cut.json`, the things
`moon` (box `[5.0, 3.42, 8.0, 6.2]`, row 4), `sun` (box
`[12.05, 3.42, 15.0, 6.2]`, row 4) and `star` (box
`[12.3, 9.35, 14.9, 10.74]`, row 10), each `"lying": true`, with
its state `lit` cut from `tower-hall-lit-laid.png` against
`tower-hall-base-4.png` with `"diff": {"threshold": 10, "soft":
6, "speck": 8, "holes": 60000, "scraps": 0.3}`.
`tools/art/export_scene.py`: `clip_below` cuts a thing's picture
at its row's bottom, and `reach` lowers that cut; the difference
is `trace.py diff`'s, with `DIFFERENCE`'s settings. The exported
pictures are `content/art/scenes/the-tower-hall/moon-lit.webp`,
`sun-lit.webp`, `star-lit.webp` and their `-sunset` twins.

**What the designer measured**, on exports made and thrown away:

- `moon` with `"reach": 1.2`: the picture is 288 by 267 at
  (480, 328), its four edges at alpha 0. The glow is whole.
- `sun` with `"reach": 1.2`: 283 by 267 at (1157, 328), its four
  edges at alpha 0. Its box is not raised: a top above 3.42
  takes in the wall behind it.
- `star` with its box's top at 9.0, left at 12.0 and right at
  15.0: the picture's top, left and right edges are at alpha 0.
- The sweep says what it says today, *2 of 70 cells walked on
  have something in front*, with each of them.

**What is asked.**

- `cut.json`: `"reach": 1.2` on `moon` and on `sun`; `star`'s box
  `[12.0, 9.0, 15.0, 10.74]`. The star's bottom stays on the
  wall's top edge: it is the wall that ends the glow, with a
  sharp line, as the owner reads it today.
- A difference's setting `feather`, in cells, read by the
  exporter for a state of a thing with `"lying": true` and
  refused on any other thing. The mask is made as today, 0 or 1,
  cleaned of its specks and holes; then its alpha at a pixel is
  that pixel's distance inside the mask's outline over the
  feather's width, 1 from there inward. A speck narrower than the
  feather comes out at next to nothing. The difference is read a
  feather's width beyond the box, and the box cuts the picture
  after: the star's bottom is sharp, the three other sides of
  each picture are at alpha 0.
- `"feather": 0.1` in the `diff` of the three plates' `lit`.
- The hall exported again
  (`.venv/bin/python tools/art/export_scene.py the-tower-hall`),
  in its two lights. Look at each lit plate at four times its
  size on the game's ground, in both lights: no straight line
  across a glow except the star's on the wall, no line of dots
  round it, no step in the glow where the mask begins. If 0.1
  leaves a line, the width is raised by 0.05 at a time, to 0.25
  at most, and the number taken is told.
- The sweep is not loosened, no figure and no plate is moved,
  and the masks of the hall's other things are, byte for byte,
  what they are.

**Tests.** `tests/tools/test_art.py`: a feather on a lying
thing's state gives a mask whose alpha grows inward over its
width, with nothing outside the difference's outline, and a sharp
edge where the box cuts; the setting on a standing thing is
refused. `tests/project/test_chapter_5_art.py`: each plate's
`lit` picture, in both lights, has its top, left and right
columns at alpha 0, the moon's and the sun's bottom rows too, and
is as tall as its box. `sweeps.spec.ts`, `painted.spec.ts` and
`chapter-5.spec.ts` green.

### 2.4 Cells only a story's figure walks (D288)

**Where it is.** `world/kydux_world/level.py`: `read_scene`
reads a terrain's `walk` as true, false or `"small"`; `on_scene`
makes the level's map from it (`FLOOR`, `SMALL`, `LOW`, `SHELF`
or `WALL`); `story_on_scene` builds the story on its scene with
`on_scene` and asks `walked()` of every cell a figure stands on
or walks to: any letter but `WALL` and `SHELF`, so that the
room's furniture, a shelf in the map, is refused.
`tools/art/sweep.py`: `walks()` gives the cells walked on from
the scene's map and terrains. `content/scenes/the-tower-passage/`:
`map.txt` and `scene.json`, with the terrains `u` (furniture) and
`p` (the familiars' passage).

**What is asked.**

- `read_scene`: `walk` may be `"story"`; `sight` is false where
  the terrain does not say; `fly` is false.
- `on_scene`: such a terrain's cell is `SHELF` with `sight`,
  `WALL` without, as with `"walk": false`.
- `story_on_scene`: `walked()` is true on such a cell for a
  figure on foot, and a door of the story may stand on one. The
  check reads it from the scene, not from a letter of the map.
- `sweep.py`: `walks()` counts such cells among those walked on.
- The scene's `scene.json`, two terrains:
  `"l": {"kind": "wall", "walk": "story", "sight": false}` and
  `"v": {"kind": "furniture", "walk": "story", "sight": true}`.
- The scene's `map.txt`, rows 3 to 8:

  ```
  ##llllvv......u#####
  ##l##########p######
  ##l##########p######
  ##l##########p######
  ##l##########p######
  ##l#######pppp######
  ```

  Rows 0 to 2 and 9 to 14 are as they are. (2, 9), (2, 10) and
  (2, 11) stay wall: no figure is drawn between the stairs' foot
  and the arch (D289).
- The page reads nothing of it: a level's map is what it is, and
  a story's figure is drawn where its steps put it.
- The documents that list a terrain's `walk` say the three
  values.

**Tests.** `test_scenes.py`: the terrain read, and a level on a
scene with it has the map it has with `"walk": false`.
`test_levels_content.py` or `test_chapter_5_scenes.py`: the maps
of `the-small-passage` and `the-forgotten-room`, built, are
letter for letter what they are on the commit before (the
strings written in the test). `test_stories.py`: a figure of a
story walks a story cell and stands on one; on a furniture cell
that is not one it is refused as today. `tests/tools`: `walks()`
counts the cells.

### 2.5 The side door, and Rinlo down the back stairs (D289)

**Where it is.** `art/scenes/the-tower-passage/cut.json`: its
painting and ground are `game-tower-passage-flap.png`
(`art/raw/game-tower-passage/`), with the things
`corridor_mouth`, `room_mouth` and `trench_rim` cut from the
painting, and `laid`, the second flap (D281). On the painting, in
cells: the room's left wall is a strip of pale stones from
(5.45, 0) to (5.9, 2.5); the door's leaf, seen from its edge, is
the wooden strip from (5.6, 2.5) to (5.85, 4.0); a stone block
from (5.45, 4.05) to (6.0, 4.5) is the doorway's near jamb. Left
of the door, the landing's floor runs from x = 0 to 5.4 and from
y = 2.95, the foot of the wall with the scroll shelves, to 4.4.
From the landing, between the banister at x = 1.45 to 1.75 and
the wall at x = 3.4, the floor goes down from y = 4.4 to 6.05,
the stairs from 6.05 to 8.6, and the floor at their foot to 9.48,
where the arch's ring of stones begins. Inside the room, the
crates end at y = 3.3 and the stool at 3.7, with floor before
them. A figure's feet are drawn at 0.8 of its cell
(`FOOT_IN_CELL`) and its head some 1.7 cells above them.
`content/stories/what-the-familiar-brought/`: twenty-seven steps;
the first is the voice's, with the camera wide, and its acts take
Rinlo out of sight, bring him into sight at (2, 12) and walk him
to (5, 13) while the three children turn left. The storeroom's
`store_door` (`art/scenes/the-storeroom/cut.json`) is a door
with its two states by difference and `"rest": "closed"`;
*En la biblioteca*'s `wenna_door` is a story's door that names
the settings' door (`"art"`).

**What is asked: the door.**

- Two pictures of Gemini, each asked on a part of the painting
  without its grid and laid on the painting by
  `tools/art/lay.py`, the difference within its box only, as the
  second flap was (D281); the part, columns 0 to 10 and rows 0
  to 6, or the part that serves the model best; each box the
  smallest that holds the change, measured and written in
  `cut.json` (`laid`).
  1. **The base**: the doorway empty. The leaf's strip is gone;
     the wall's strip ends at (5.9, 2.5) and the block at
     (5.45, 4.05) as they do; between them the landing's floor
     runs through into the room's floor, with no step and no
     line of its own. Nothing else changes.
  2. **The door open**, an edit of the base: the same leaf, of
     the same wood and ironwork, turned on its far jamb, the end
     of the wall's strip, and swung onto the landing, flat
     against the wall under the scroll shelves, to the left of
     the doorway. Its foot is on that wall's foot: nothing of the
     leaf below y = 3.0, nothing of it in the doorway, nothing
     over the landing's floor that a figure's feet cross (row 3,
     feet at 3.8). Nothing else changes.
- A try whose edit changed what it should not, or whose leaf
  stands on the walked floor or in the doorway, is asked again:
  three tries at most for each picture (D148). The prompts are
  written in `tools/art/prompts/`, and the scene's `SOURCE.md`
  names them.
- `cut.json`: the ground is the base; the thing `room_door`, a
  door as `store_door` is, `"at": [5, 3]`, `"rest": "closed"`,
  `"without"` the base, its state `closed` cut from the painting
  as it is today, on row 3, its state `open` from the second
  picture, on row 2. The three covers, `laid`'s flap, `hides`,
  `rims`, `nudged`, `lowered` and `kept` are untouched.
- The scene exported again
  (`.venv/bin/python tools/art/export_scene.py the-tower-passage`).
  Outside the two boxes the exported ground is, pixel for pixel,
  today's: compare them and say so in the report. The trench's
  rim and the two mouths cover a familiar as they do on the
  commit before: the sweep says what it says today of them, and
  nothing new of the story's cells. If the sweep finds something
  in front of a figure on a story's cell, the mask is fitted
  (its row, its box); no figure is moved and the sweep is not
  loosened.
- Enlarged, at four times its size on the game's ground: the
  door shut is the painting's door, with no line round it; the
  door open has its leaf whole against the shelves' wall and the
  doorway clear; Rinlo on (4, 3) and on (5, 3) is in front of
  the leaf and of the wall's strip, whole.
- No level's world has the door, and nothing of the two levels
  changes: their plan shows the door shut, as the painting does.

**What is asked: the story.** `story.json` has the door among
its things, shut:

```json
"things": [
  {"kind": "door", "id": "room_door", "at": [5, 3], "art": "room_door", "open": false}
]
```

Its first step is two, twenty-eight in all; every later step is
as it is, one place on:

```json
{"who": "voice", "camera": {"wide": true}, "by": "rinlo", "do": [
  {"stand": true},
  {"walk": [6, 3]},
  {"open": "room_door"},
  {"walk": [[2, 3], [2, 8]], "vanish": true}
]},
{"who": "voice", "camera": {"wide": true}, "do": [
  {"by": "rinlo", "appear": [2, 12]},
  {"by": "rinlo", "walk": [[2, 13], [5, 13]]},
  {"by": "wizard", "face": "left"},
  {"by": "friend", "face": "left"},
  {"by": "mate", "face": "left"}
]}
```

The first step's words are parted in two at the sentence's end,
with no word changed. `text.es.json`:

1. `Tienes un puñado de trozos de hilo negro en la mano. Arriba
   se oye un cerrojo, y pasos en la escalera de atrás.`
2. `Rinlo aparece por el arco del fondo del pasillo, muy pálido.`

`text.en.json`:

1. `You have a handful of pieces of black thread in your hand.
   Above, a bolt is heard, and steps on the back stair.`
2. `Rinlo comes out of the arch at the end of the corridor, very
   pale.`

Rinlo's walk is a person's, at a person's pace in a story. The
door opens with a door's sound and its fade (D156). The children
turn left as Rinlo comes into sight, not before.

**Tests.** `test_stories.py` and `tests/project/test_story.py`:
the story is built, with its twenty-eight steps and its texts'
twenty-eight in both languages; a walk through `room_door` shut
is refused. `tests/project/test_chapter_5_art.py`: the door's two
states are in the scene's `art.json`, it rests closed, and its
open picture has nothing below y = 3.0. `story.spec.ts`: the
story's first step ends with the door's open picture drawn
(`data-door-looks`) and Rinlo out of sight; its second with Rinlo
at (5, 13) and the three children facing left; the test that
goes on to the evening counts one step more. `sweeps.spec.ts`
and `painted.spec.ts` green.

### 2.6 The walkthrough shows a long step as it plays

**Where it is.** `app/e2e/walkthrough.spec.ts`, `story()`: a
picture of the story's first step once it is settled, and one of
each step after a click on `#story-next`, once it is settled.
`tools/walkthrough.py` writes the document, one picture and its
*Comentarios* for each step.

**What is asked.**

- While a step's acts still play (the scene's `data-state` is
  not `done`), from the story's opening or from the click, the
  walkthrough takes a picture every second and a half:
  `story-<id>-<step>-a.png`, `-b`, and so on, eight at most; and
  then the step's own picture at its end, as today. A step that
  is settled within a second and a half has only its own.
- `tools/walkthrough.py` lists them before the step's own
  picture, each with its caption (*…, paso 1, mientras ocurre
  (a)*) and no *Comentarios* line of its own: the comments go
  under the step's last picture.
- Nothing changes for a level's or a lesson's pictures.

**Tests.** `tests/tools/test_walkthrough.py`: a step with two
such pictures is written with the three, in order, and one
*Comentarios*.

### 2.7 What the owner will try

1. *El círculo*: behind the start card, the friend's hare, a
   drawing with no colour. The card closed, it is still there:
   count ten seconds, at any speed, and it fades.
2. The same level: the wizard faces the circle from the start,
   at the win, and after Stop. The same in the hall's other five
   levels; in the passage's two it faces the wall with the
   passage's mouth.
3. *Fuera del círculo*: the fox on the moon. The light round the
   plate is whole, round, and dies away on the floor, with no
   line across it.
4. *Las órdenes de Orla*: the sun's light whole as the moon's;
   the star's whole above and at its sides, ending below where
   the wall stands.
5. *El pasadizo pequeño* and *El cuarto olvidado*: the room's
   side door is shut, as it has been, and nothing else is new.
6. *Lo que trajo el familiar*, first page: Rinlo gets up, walks
   to the side door, opens it, crosses the landing and goes down
   the back stairs, out of sight at their foot. Second page: he
   comes out under the corridor's arch, and the children turn to
   him.
7. The walkthrough: that story's first step has pictures taken
   while it plays, Rinlo at the door, on the landing and on the
   stairs.

### 2.8 What is left out, and why

- **Rinlo drawn through the arch.** Between the stairs' foot and
  the arch the painting has no floor a figure can be drawn on
  (D289). A walk seen all the way asks another painting of that
  corner; it is the owner's to ask.
- **The wall's stones lit by the star.** Gemini's lit picture
  has a soft light on the two stones of the wall's top under the
  star. The star's box ends on the wall's edge and leaves them
  out: the owner reads the wall as what ends the glow.
- **A wizard that turns by itself** toward a cast or toward its
  familiar: D286 is where it faces when the level opens, and no
  more.
- **A sound for the bolt.** The story's words say it; the door's
  own sound plays.
- **The arched door in the room's back wall**: no one goes
  through it.
- **The owner's three comments about words and the staging of
  *El rastro***: entered already (`be385c0`, `7613524`).

## 3. The pieces

One local commit each, in order.

### 3.1 The staged trial (D285, 2.1)

`scene.ts` and its tests, `chapter-5.spec.ts`; D285 entered,
D276 brought to it. `ci/check.sh` and `chapter-5.spec.ts` green.

### 3.2 The wizard's facing (D286, 2.2)

`level.py`, `world.py`, the page's level and `scene.ts`, the
eight `level.json`, the tests of 2.2; D286 entered, D241 named.
`ci/check.sh`, `chapter-5.spec.ts`, `level.spec.ts` and
`restart.spec.ts` green.

### 3.3 The plates' light (D287, 2.3)

`export_scene.py` (and `trace.py` if the feather is made there),
the hall's `cut.json`, the hall exported, the tests of 2.3; D287
entered, D155 and D273 brought to it. `ci/check.sh`,
`sweeps.spec.ts`, `painted.spec.ts` and `chapter-5.spec.ts`
green.

### 3.4 A story's cells (D288, 2.4)

`level.py`, `sweep.py`, the passage's `map.txt` and `scene.json`,
the tests of 2.4; D288 entered, D270 brought to it. `ci/check.sh`,
`sweeps.spec.ts`, `chapter-5.spec.ts` and `story.spec.ts` green.

### 3.5 The door and the story (D289, 2.5)

The two pictures from Gemini, the passage's `cut.json` and
`SOURCE.md`, the scene exported, the story's three files, the
tests of 2.5; D289 entered, D103, D148 and D273 brought to it.
`ci/check.sh`, `story.spec.ts`, `sweeps.spec.ts`,
`painted.spec.ts` and `chapter-5.spec.ts` green.

### 3.6 The walkthrough's pictures (2.6)

`walkthrough.spec.ts`, `tools/walkthrough.py`, its test.
`ci/check.sh` green; the walkthrough of one story played to see
the pictures come.

### 3.7 The whole check, the walkthrough and the report

`ci/check.sh --e2e` whole, once, in a copy. Then chapter 5's
walkthrough, made anew
(`cd app && npm run walkthrough -- 05-the-familiar`). The report
in Spanish, in `drafts/`: the seven steps of 2.7; pictures of the
current commit only (the circle with the hare after the card's
close; the wizard facing the circle; each lit plate at four times
its size, in both lights; the side door shut and open, enlarged;
Rinlo at the door, on the landing, on the stairs and under the
arch); the feather's width taken; the Gemini pictures spent,
named, and the chapter's count; the ground compared outside the
door's boxes; what was decided where the plan does not decide.
The memory note `kydux-sprint-55-state`, and the prompt for the
designer's review.

## 4. Gemini

Two pictures, the doorway empty and the door open (2.5), with up
to three tries each; the chapter's count stands at 44 of 120
before them. No text is asked of Gemini: the story's words are
its own, parted in two.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

This is sprint 55: what the owner asked after reading chapter 5's
walkthrough of sprint 54's review. Build it on the last commit of
main as you find it.

Read first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-55.md (this plan, whole), docs/dev/sprint-54.md
(its sections 2.1 and 2.6), and in docs/dev/architecture.md D103,
D104, D128, D148, D155, D156, D158, D241, D270, D273, D276, D279
and D281. Then your memory notes kydux-sprint-54-state,
kydux-checks-per-piece, kydux-report-images-current,
kydux-no-co-authored-by, kydux-docs-present-tense,
kydux-github-only-code-and-docs and kydux-mask-fit-not-figure.

What is asked, in short; the plan has each in full.

1. The staged trial (D285). The friend's hare with no colour, in
El círculo, is seen ten seconds of the page's clock from the
start card's close, whatever the speed, and then fades in one. A
trial called in a run keeps its four seconds, shorter with the
speed.

2. The wizard's facing (D286). A level's key facing (up, down,
left, right; down where there is none) is the way its wizard
faces at tick 0, in the world and on the page, kept when a run is
started again. The hall's six levels and the passage's two say
up.

3. The plates' light (D287). reach 1.2 on the moon and the sun,
the star's box [12.0, 9.0, 15.0, 10.74], and a feather of 0.1
cell on the three lit states: a new setting of a difference, for
a thing lying in the floor only, measured before the box cuts.
The hall exported again; each glow looked at four times its size
in both lights.

4. A story's cells (D288). A terrain with "walk": "story" is a
wall or a shelf for a level and floor for a story's staging and
for the sweep. The passage's map and scene.json as the plan
writes them; the two levels' maps stay letter for letter.

5. The side door and Rinlo (D289). Two pictures of Gemini on a
part of the passage's painting, laid by tools/art/lay.py within
their boxes only: the doorway empty (the base) and the door open,
its leaf flat against the wall under the scroll shelves. The
thing room_door rests closed; the story has it and opens it. Lo
que trajo el familiar's first step becomes two, as the plan
writes them: Rinlo stands, walks to the door, opens it, crosses
the landing and goes down the stairs out of sight; then he comes
into sight under the arch and the children turn. The texts are
parted in two, no word changed.

6. The walkthrough takes a picture every second and a half while
a story's step still plays, and its document lists them before
the step's own.

Build pieces 3.1 to 3.7 in order, one local commit each. Before
each commit, ci/check.sh and the browser specs the piece touches
green; the whole ci/check.sh --e2e once, before the last, in a
copy with Playwright's own server on 4173 and the app built anew
in that copy. Never a push, never a timer, never a deploy. Never
stop or build into the servers on ports 443 and 5173; a preview
left on 4173 is a browser run's leftover and may be stopped, and
yours is stopped when you are done. Nothing under .github/
changes. The image key stays in ~/.config/kydux/secrets.env and
enters no file, log or commit. Gemini: two pictures, with up to
three tries each; no text is asked of it.

No Co-Authored-By trailer in any Kydux commit, whatever your
harness suggests. Before you end, this must print 0:
  git log origin/main..HEAD --format=%B | grep -ci co-authored

What the owner will look for:
(1) El círculo: the friend's hare still in the circle after the
    card is closed, for ten seconds at any speed, then fading;
(2) the wizard facing the circle from the start to the win in
    the hall's six levels, and facing the passage's wall in the
    passage's two;
(3) the moon's and the sun's light whole and round, dying away
    on the floor with no line across it and no dots round it;
(4) the star's light whole above and at its sides, ending below
    where the wall stands;
(5) the forgotten room's side door shut in the two levels, and
    nothing else new in them;
(6) Lo que trajo el familiar: Rinlo gets up, opens the side
    door, crosses the landing and goes down the back stairs; on
    the next page he comes out under the arch and the children
    turn to him;
(7) the walkthrough's pictures of that step while it plays.

The plan gives the decisions' words, the numbers and the texts:
enter them as they are. Where it does not decide (how the page's
level carries the facing, how the feather's distance is computed
without a new dependency, how the staging check reads a story's
cell from the scene, the part and the boxes of the two pictures,
the door's diff settings, the test's handle on the page's clock),
take the smallest choice that keeps its intent and say it in the
commit. Do not build what section 2.8 leaves out. A cover that
hides too much is measured against the painting and fitted: no
figure is moved and the sweep is not loosened. If Gemini's three
tries give no clean picture of the door, stop at piece 3.4, say
so in the report with the tries, and build 3.6 and 3.7. Never
edit content while a browser run is going. Every document and
comment in the present. Before git add, read git diff of each
file and stage only your own hunks; nothing of drafts/ enters a
commit.

docs/dev/sprint-55.md is the designer's and is committed already;
leave it as it is.

Hand over, in drafts/ and never committed: chapter 5's
walkthrough made anew, and the report in Spanish as 3.7 asks,
with the seven steps of 2.7 and pictures of the current commit
only. Write your memory note kydux-sprint-55-state, and end with
the prompt for the designer's review in English, in a code block.
```
