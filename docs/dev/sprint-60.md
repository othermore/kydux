# Sprint 60 — Who leaves walks out, and a story that goes on in place

Asked by the owner on 2026-11-22, after trying sprint 59's last
piece: four comments on the stories of chapter 5. Two of them are
the designer's own commit, made before this plan (section 6).
This sprint builds the other two, and the camera's travel that
the first of them needs. Section 7 holds the owner's answers of
the same day to the plan's three questions: who comes in walks
in too (D322), which figures still fade, and the words that wait
for the camera. The owner's words head each decision of
section 1.

**Where it is today.**

- *Leaving.* A story's walk may end `"vanish": true`:
  `storyEvents` (`app/src/content/stories.ts`) queues a `vanish`
  after the walk's last move, and the scene
  (`app/src/engine/scene.ts`, `case 'vanish'`, the wizard's and
  the actors') takes the figure's alpha to nothing over 0.9 of a
  tick, where it stands. The world's check
  (`story_on_scene`, `world/kydux_world/level.py`) asks nothing
  of the cell the walk ends on. So Orla fades at the hall's door
  (*the-trail*, 6), the three fade at a dead end of the
  dormitory's corridor (*after-dark*, 9), Dask in the middle of a
  corridor (*caught*, 9), and Zarek and the three in the mouths
  of the entrance's archways (*the-tower*, 14 and 17). A
  speaker's bare `{"vanish": true}` is played as the next step
  begins, and never at a story's last step: Ilda's, in
  *the-entrance*, 8 of 8, is never seen.
- *The edges.* A painted scene's camera never shows anything
  past the painting (`least`, `app/src/engine/camera.ts`, D92):
  a figure past the picture's edge is cut by the frame. Only
  `the-field` and `the-library` have a painted `margin`.
- *The join.* *Lo que trajo el familiar*
  (`what-the-familiar-brought`) ends on the tower's hall at
  sunset, Orla saying *Hay algo que debes saber*; *El fin de
  curso* (`the-end-of-the-year`) opens on the same hall, with the
  same figures on the same cells under the same framing, Orla
  saying *Esa voz en las paredes tiene nombre*. Between the two
  the page takes its ordinary way from an item to the next
  (`route`, `showStory`, `app/src/main.ts`): the waiting view,
  the later story's still of the castle while its scene is
  built, the scene drawn anew.
- *Framings.* A step that frames another place than its part
  holds is a cut (`SceneCamera.place`, D199): six steps in four
  stories.

## 1. Decisions taken here

Each is in `docs/dev/architecture.md` in full.

- **D319 — Nobody fades out of a scene: who leaves walks out by
  a way out.** The owner: *los personajes que salen de la escena
  no pueden desvanecerse, deben abandonar la escena por un lugar
  adecuado. [...] Eso debe ser así SIEMPRE.* Two ways out: the
  picture's edge, walked past; or a cell behind a cover that
  hides a figure whole (`"out": true`). The figures that fade
  are the script's own: a ghost, a creature a spell calls (a
  familiar), a thing not well made that comes apart.
- **D320 — A story may go on from the one before with nothing
  between.** The owner: *la transición debe ser inmediata [...]
  No puede haber nada en medio, solo el cambio de música justo
  en ese momento (podemos dejar unos segundos sin diálogo para
  aumentar la tensión [...] uno o dos segundos (según el momento
  en el que deba entrar la canción nueva) y luego empieza el
  siguiente diálogo.* A story says `"continues"`.
- **D321 — Between two framings of a part the camera travels.**
  The designer's, from the owner's *parece un salto en la
  cámara* (D318): Orla's way down the stairs is outside the
  hall's framing, and the framing that shows it is reached by a
  travel, not a cut.
- **D322 — Nobody fades into a scene: who comes in walks in by
  a way in.** The owner: *También a los que entran, salvo las
  excepciones en las que por guión aparecen o desaparecen. Y
  salvo los personajes que ya están en la escena cuando empieza
  la escena, que son la mayoría de los casos*, and *los que
  aparecen con un hechizo como los familiares o desaparecen
  cuando se desvanecen porque no estaban bien creados, también
  son excepciones*. Section 7.
- **D317 and D318**, built by the designer (section 6): Next
  waits while a story goes on by itself, and a part comes out of
  the dark already framed.

## 2. What is asked

### 2.1 A walk that leaves (D319)

**The story's keys.**

- A walk may end `"leave": true`:
  `{"by": "orla", "walk": [[11, 9], [9, 9]], "leave": true}`.
  `leave` is said only with a `walk`, and only as `true`.
- `"vanish": true` with a `walk` is an error; its message names
  `leave` and D319.
- A bare `{"vanish": true}` is the step's speaker's alone, as
  today, and only where that speaker is an actor of kind `ghost`
  or `familiar` (the script's exceptions, D322). In a story's
  last step it is an error: it would never be played.

**The world's check** (`story_on_scene`). A walk that leaves ends
in one of two ways; any other is a `LevelError` that names the
story, the step, the figure and the cell.

1. *By the edge.* The walk's last cell is on the scene's border
   and its last move heads off the map on that side: left onto
   column 0, up onto row 0, right onto the last column, down
   onto the last row. A walk that reaches the border sideways
   does not leave by it.
2. *By a way-out cell.* The walk's last cell has a terrain that
   says `"out": true`. A scene's terrain may say it only with
   `"walk": "story"` (D288); `read_scene` holds it to that.

Once it has left, a figure does nothing more in its part, as a
vanished one today; the speaker's rules are D310's, and so are
the wizard's (a part's last step alone).

**The art's check** (the one that sweeps every scene,
`tools/art/sweep.py` and its test).

- A scene whose art has a `margin` on a side has no walk leaving
  by that side's edge: the figure would stand in sight on the
  margin.
- On every `out` cell, the tallest figure of the sheets,
  standing, shows no pixel under the scene's covers: the count
  D128 takes for a figure before it steps out. The cells a story
  alone walks on its way to an `out` cell are not held to show a
  figure.

**The page.**

- `storyEvents`: after the last move of a walk that leaves by
  the edge, the figure walks on two cells more the same way, off
  the map, one move each as the walk's own; then an event
  `leave`, at the tick after the last move. For a way-out cell,
  `leave` comes at the tick after the figure arrives.
- `scene.ts`: a move to a cell off the map places the figure
  there as on any cell (its place, its depth, its tint under the
  scene's `dark` columns; no terrain asked of a cell that is not
  there). `leave` hides the figure at once (`setVisible(false)`,
  its sway and its shadow with it) and publishes; no tween of
  alpha. The wizard's and the actors' alike. A seek back, a step
  played again and Back bring the figure to where the step finds
  it, in sight.
- `vanish` keeps its fade, for the ghost and the familiar.
- A `meanwhile` speaker that leaves keeps its words where it was
  last seen (D310).

**The restagings.** Each walk goes on from where it ends today
to its way out. The cells are the map's
(`content/scenes/<scene>/map.txt`); look at each with a picture
of the step's end before the report, and move a cell where the
painting asks for it.

| Story, step | Scene | Who | Leaves by |
|---|---|---|---|
| `the-trail`, 6 | `the-tower-hall` | Orla | `walk [[11, 9], [9, 9], [9, 14]]`: the door, the landing, the painted steps, the bottom edge |
| `the-first-night`, 5 | `the-dormitory` | Ilda | on from `[3, 15]` to `[0, 15]`, the left edge |
| `the-tower`, 6 | `the-dormitory` | friend, mate, wizard | `[0, 15]` as written, the left edge |
| `after-dark`, 9 | `the-dormitory` | friend, wizard, mate | from the door `[12, 15]` left to `[0, 15]`, the left edge, in the place of the dead end at `[19, 15]` |
| `caught`, 9 | `the-way-down` | friend, mate, wizard | each down its column, 9 or 10, to row 14, the bottom edge, one behind another |
| `caught`, 9 | `the-way-down` | Dask | on from `[10, 2]` to `[10, 0]`, the top edge |
| `the-voices`, 7 | `the-storeroom` | mate, friend, wizard | `[10, 14]` as written, the bottom edge |
| `the-tower`, 14 | `the-entrance` | Zarek | on from `[20, 5]` to `[20, 3]`, a way-out cell |
| `the-tower`, 17 | `the-entrance` | friend, wizard, mate | on from `[14, 6]` to `[14, 3]`, a way-out cell |
| `the-entrance`, 8 | `the-entrance` | Ilda | her `vanish` is taken out: she stays in the archway |
| `the-wand-bank`, 2 | `the-library` | Eldra | stays `vanish`: a ghost |

*The hall's stairs.* The terrain `s` of `the-tower-hall` is
`"walk": "story"`. Rows 12 to 14 are the tower's outer face: the
arch of the door, a landing under it, and steps that turn down
to the left and reach the bottom edge about columns 8 and 9.
The map's stairs are columns 9 and 10; where the walk reads
better over the painted steps, `[8, 13]` and `[8, 14]` become
`s` and Orla's last cells go over them. Orla is drawn in front
of the arch's cover from row 12 on.

*The entrance's archways.* The three tunnels go on behind the
wall's face. New cells, of two new terrains of
`the-entrance/scene.json`, both of kind `wall`, `"walk":
"story"`, `"sight": false`, the second with `"out": true`:

- the tunnel: `[19, 4]`, `[20, 4]`, `[13, 4]`, `[14, 4]`,
  `[13, 5]`, `[14, 5]`, `[25, 4]`, `[26, 4]`, `[25, 5]`,
  `[26, 5]`;
- the way out: `[19, 3]`, `[20, 3]`, `[13, 3]`, `[14, 3]`,
  `[25, 3]`, `[26, 3]`.

The wall's face is the cover `row-9-static` (and its hours); the
scene's `dark` columns tint a figure to 0.88 well before it goes
behind the face. On row 3 a figure's head reaches the wall's
coping, which the cover leaves bare along its top edge: the
cover's top is taken up to the wall's own top edge, cut from the
ground painting with the tools, in the art's sources and in every
hour, and the scene exported again. This is a mask refitted to
its painting; no figure is moved to fit and nothing is painted.
If a figure at 0.88 still reads against the tunnel's dark in the
last cell it is seen on, the columns' `most` goes up until it
does not.

### 2.2 The camera's travel (D321)

- `SceneCamera.place(framing, travel)`: with `travel` and a
  framing already placed, the scroll and the zoom go from where
  they are to the new framing's over 0.7 s, `Sine.easeInOut`.
  `data-camera-fit` says the new framing at once;
  `data-camera-travel="true"` while the camera travels. A new
  `place`, a resize, a seek or the screen's end takes the camera
  to the travel's end at once.
- `storyScreen.play()` asks for the travel when the step is
  reached by Next from the step before it, in the same part, and
  frames another place than the one held. Every other way of
  reaching a step frames at once.
- The step's events are played from the travel's start, and
  the voice's words show at once in their band. A figure's
  bubble waits for the camera: it comes up once the travel has
  ended (and once the figure's doings have, as ever), laid out
  for what the new framing shows (`shown`, `shownSides`), over a
  picture that does not move. The owner's *debería estar
  encuadrada ya de modo que luego entre el diálogo* (D318) holds
  here as it does after the dark.
- *the-trail*: step 6 says `"camera": {"fit": [[4, 4], [15,
  14]]}`, the hall from Orla's place to the stairs' foot; step 7
  says `"camera": {"fit": [[4, 2], [15, 11]]}` again, as the
  familiar goes to the friend's pocket. Step 8's bubble (D306)
  and step 9's tunnel are framed as today.
- The six cuts of today travel: *the-finish* 5,
  *the-voice-in-the-tunnel* 2, 8, 10 and 12,
  *what-the-familiar-brought* 2.

### 2.3 A story that goes on in place (D320)

**The story's key.** `the-end-of-the-year/story.json` says
`"continues": "what-the-familiar-brought"`. The story made whole
carries it; `Story` (`stories.ts`) has `continues?: string`.

**The world's check**, where every story is built and the
chapters' items are at hand (`tools/scene_maps.py`; the items are
`content/chapters/*/chapter.json`). For a story B that continues
A, each failing with an error that names both:

1. A is a story, and B is the item just after A in a chapter's
   `items`.
2. No step of A's last part does anything (`"do": null`), and
   none is told over a still.
3. B's staging is A's last part's: the scene, the light, the
   wizard's cell and facing, every actor (id, kind, cell, facing,
   and whatever else it says), the things, the camera, who
   flies.
4. The framing held at A's last step (`framingAt`) is the one
   B's first step gives.
5. B's first step is not told over a still, and B's first part
   is not `later`.

**The page.**

- `showStory(A)` (`main.ts`): once A shows, when the course's
  next item is a story, it is loaded in the background
  (`loadStory`). When that story continues A, its still's image
  is loaded too, and the screen is handed the join: a function
  that gives B's `StoryScreenParts`, or nothing while B has not
  loaded.
- At Next on A's last step, with the join at hand
  (`storyScreen`):
  1. main marks A read, makes B the current item, and makes the
     address B's without building a screen (`shownRoute` is B's
     key before the hash is; `route` then finds the screen it
     shows). The window's title is B's. The browser's way back
     opens A from its start; a reload opens B from its start.
  2. The screen takes B's parts in the place of A's: the story,
     the title and the kind above it, the count (`1 / 39`), the
     still's node (hidden), Skip's and the end's ways on, the
     reload for a language's change. `step` is 0 and the part
     shown is B's first, with the scene alive as it is: no
     `startPart`, no scene made, no waiting view.
  3. `hear()` asks B's music at once: `the-truth/name`.
  4. The held moment: the bubble goes, Next and Again wait
     (`wait(true)`, D317), Back and Skip stay. Its length is the
     time the music takes to turn, held between 1 s and 3 s; 1.5
     s where no music turns (the music off, the same theme and
     movement already sounding). The music engine
     (`app/src/engine/music.ts`) tells how long until the
     movement asked for comes in (the next bar line of *The
     truth*, 2.37 s a bar): a function of its own, with no
     Phaser and no DOM, tested in vitest.
  5. Then B's first step is played as `play()` plays any step,
     and Next wakes.
- Back, pressed in the held moment or on B's first step, does
  what it does on B's first step opened by itself. Skip too.
- Where the join is not at hand at that press (B still loading,
  a load that failed), Next goes the ordinary way.
- B opened any other way opens as any story.

### 2.4 The tests

- **pytest** (`world/tests`): a walk that leaves by each edge;
  one that reaches the border sideways, one that ends inside the
  map on a plain cell, `leave` with no walk, a walk with
  `vanish`, a bare `vanish` by a teacher and one in a
  last step: each its error. A terrain `out` with no `"walk":
  "story"`. `continues`: each of the five rules broken on a copy
  of the two stories. The content as it is passes.
- **The art's check**: an edge with a margin; an `out` cell
  where a figure shows.
- **vitest**: `storyEvents` for a walk that leaves by an edge
  (the two moves off the map, `leave` at the next tick) and by
  an `out` cell; the ghost's `vanish`; the held moment's length
  from the music's answer (under 1 s, between, over 3 s, none).
- **Browser** (`app/e2e/story.spec.ts` or
  `chapter-5.spec.ts`, by the piece):
  - *the-trail*, 6: `data-camera-fit` is `4,4,15,14` and
    `data-camera-travel` goes `true` and ends; Orla is seen on
    the landing and on the steps; from the step's start to its
    end her alpha is 1 whenever any of her is inside what the
    camera shows; at the end she is not drawn. At step 7 the
    framing is `4,2,15,11`. The step played again finds her at
    `[11, 4]`.
  - *the-tower*, 14: Zarek is not drawn at the step's end, and
    was never translucent.
  - A wide and a narrow window on *the-tower*, 6: none of the
    three is in what the camera shows once past the edge.
  - The join: from A's last step, Next. The scene's canvas is
    the same node before and after; the waiting view and
    `#story-still` never show (a `MutationObserver` from before
    the press); the address is `#story/the-end-of-the-year`; the
    title and the count are B's; `#story-next` is disabled and
    no bubble shows for at least 1 s; `data-music-movement` is
    `name`; `data-camera-fit` is unchanged; Orla's first words
    show within 4 s and Next is enabled and focused. Then B to
    its step 32: the still shows. B opened by its address: as
    today.
  - *the-voice-in-the-tunnel*, 2: the travel begins and ends,
    no bubble shows while `data-camera-travel` is `true` and the
    step's bubble shows after it; Back from step 2 frames at
    once.

### 2.5 What the owner will try

1. Chapter 5, *El rastro*, 6 of 22: the camera goes down with
   Orla; she goes through the door, over the landing, down the
   steps and out by the picture's foot, solid to the last. At 7
   the camera comes back up.
2. Chapter 5, *La torre*, 6, 14 and 17: the three leave the
   dormitory by the corridor's left end; Zarek and then the
   three walk into an archway, darken and are gone behind the
   wall.
3. Chapters 1 to 3: *La primera noche* 5, *Después del
   anochecer* 9, *Atrapados* 9, *Voces en el muro* 7.
4. Chapter 5, *Lo que trajo el familiar* to its end, then Next
   on *Hay algo que debes saber*: nothing moves, the music
   turns, a breath with no words, and Orla says *Esa voz en las
   paredes tiene nombre*. No waiting screen, no castle.
5. *La voz en el túnel*: the camera travels between the
   passage's two halves, and each bubble comes up once the
   camera has arrived.
6. Who comes in: the list of section 7.6.

### 2.6 What is left out, and why

- **A way in or out across a painted margin.** `the-field` and
  `the-library` have a margin on every side (D83): a figure past
  the map's edge there stands in sight on the margin. No figure
  leaves or comes in by their edges; a way across a margin, for
  a path the painting carries to its own edge, is a later
  plan's.
- **A trial dissolved** (D262) and a thing picked up or given:
  a spell's doing and a hand's, not a leaving.
- **A door between the two stories' items on the map.** The map
  and the course keep the two stories as two items.

## 3. The pieces

Each piece ends with `ci/check.sh` and the browser specs it
touches, and its own commit. The whole `ci/check.sh --e2e` runs
once, at the end.

### 3.1 The camera's travel (D321; 2.2)

`camera.ts`, `story.ts`, the scene's handle; *the-trail*'s two
framings wait for 3.3. Test with *the-voice-in-the-tunnel*.

### 3.2 `leave` in the world and on the page (D319; 2.1)

The keys, the world's check, `storyEvents`, the scene's `leave`
and moves off the map, the terrain's `out`. Every walk that ends
at a way out already says `leave` here. Where the check cannot
be green before 3.3, the two pieces are one commit.

### 3.3 The restagings (2.1's table)

The nine steps, the hall's `s`, *the-trail*'s framings, the
entrance's tunnel cells and its cover's top edge, the art's
check. A picture of each step's end for the report, of the
commit as it is.

Between 3.3 and 3.4 comes section 7's piece, *who comes in*
(D322), with its own commit: it stages a figure on the hall's
stairs, which 3.3 makes floor a story walks.

### 3.4 The story that goes on in place (D320; 2.3)

The key, the world's check, the background load, the join, the
music's answer, the held moment.

### 3.5 The documents, the whole check and the report

`docs/dev/architecture.md`: the events' table (`vanish`,
`appear`, a row for `leave` and one for `enter`, the move off
the map), the story format where it tells `vanish` and `appear`
(D74's and D103's lines, D128, D310), the terrain's `out` beside
D288, the modules' list (camera, stories, story,
music). `docs/dev/plan.md` if a piece's shape differs from this
plan. Present tense throughout. Then `ci/check.sh --e2e` whole,
the report in Spanish and the prompt for the reviewer.

## 4. Gemini

Nothing: no text the child reads and no painting. The entrance's
cover is refitted with the tools from the painting there is.

## 5. The prompt for CLAUDE-programmer

The owner clears the programmer's context (`/clear`) before
giving it.

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

This is sprint 60, from the owner's four comments of 2026-11-22
on chapter 5's stories and the owner's answers of the same day.
The designer has built two of the comments already (Next waits
while time passes, D317; a part comes out of the dark framed,
D318). You build the rest: the camera's travel, who leaves, who
comes in, and a story that goes on in place. Build on the last
commit of main as you find it.

Read first: CLAUDE.md, .claude/working-model.md,
docs/dev/README.md, docs/dev/sprint-60.md (this plan, whole;
section 7 is part of it), and in docs/dev/architecture.md D74,
D83, D92, D128, D199, D262, D280, D288, D306, D309, D310, D314,
D316 and D317 to D322. Then your memory notes
kydux-sprint-59-state, kydux-mask-fit-not-figure,
kydux-checks-per-piece, kydux-report-images-current,
kydux-no-co-authored-by, kydux-docs-present-tense,
kydux-commit-by-path-shared-tree and
kydux-github-only-code-and-docs. Then the code:
world/kydux_world/level.py (_story_actions, story_on_scene,
story_on_scenes, read_scene), tools/scene_maps.py,
tools/art/sweep.py and export_scene.py;
app/src/content/stories.ts (storyEvents, framingAt's use),
app/src/ui/story.ts (whole), app/src/main.ts (route, showStory),
app/src/engine/scene.ts (vanish, appear, move, the dark
columns), camera.ts (place, showPlaced, least), music.ts; the
stories and scenes of the plan's two tables (2.1 and 7.4), with
their map.txt, scene.json and art.json.

What is asked, in short; the plan has each in full, with the
cells and the numbers.

1. The camera's travel (D321). A step reached by Next that
frames another place than its part holds is reached by a travel
of 0.7 s, eased, not a cut; every other way of reaching a step
frames at once. data-camera-travel. The step's doings play from
the travel's start and the voice's words show at once; a
figure's bubble comes up once the camera has arrived.

2. A walk that leaves (D319). "leave": true at a walk's end, in
the place of "vanish" there. The world holds every leaving walk
to a way out: the scene's edge, the last move heading off the
map, or a cell whose terrain says "out": true (only with
"walk": "story"). The page walks the figure two cells past the
edge, or to the way-out cell, and hides it at once: no fade. The
art's check: no leaving by an edge with a margin; a figure on an
"out" cell shows no pixel.

3. The restagings of the table in 2.1: nine steps in seven
stories. The hall's stairs are walked by a story; the-trail's
step 6 frames the stairs and step 7 the hall again; the
entrance's three archways go on behind the wall's face to
way-out cells on row 3, the wall's cover taken up to the wall's
top edge with the tools. Ilda's vanish at the-entrance's end is
taken out; Eldra's stays.

4. Who comes in (D322, section 7). {"enter": [x, y]} in the
place of "appear": the figure starts two cells past the scene's
edge, out of sight, and comes in at its own pace onto a cell of
the border (flying with "flying": true), or is set on a way-out
cell behind its cover. Several by one cell come in single file.
No fade. A bare "appear" and a bare "vanish" are held to actors
of kind ghost or familiar; "appear" with "from" (D128) stays.
The restagings of the table in 7.4: five figures enter by an
edge in three steps (caught 2, the-flying-lesson 2 and 4), five
are staged in the scene from its start (at-the-gate,
after-dark, the-morning-after, the-finish, the-tower 18).

5. A story that goes on in place (D320). "continues" in
the-end-of-the-year; the world's five rules for the pair; the
page loads the later story while the earlier one's last part
shows, and at the last Next stays on its screen and its live
scene: the earlier story read, the later one current, the
address, the title and the count the later's, its music asked
at that press, a held moment with no words and Next waiting for
as long as the music takes to turn (1 s to 3 s; 1.5 s with no
music), then the later story's first step. No waiting view, no
still, no scene made.

6. The documents in the present tense, the whole check, the
report.

The pieces and their order are section 3's, with section 7's
piece between 3.3 and 3.4.

Rules that hold: per piece, ci/check.sh and only the browser
specs the piece touches; the whole ci/check.sh --e2e once, at
the end. Never run a build or pack-world in the main tree's app/
while the owner's dev server runs on 5173: use a worktree or a
copy for whole checks, and never stop a server you did not
start. Commit by path, one commit a piece, as the repository's
own author, with no Co-Authored-By line; never push. A mask that
hides too much or too little is measured against its painting
and refitted; a figure is never moved to fit a mask. No text the
child reads is asked for here; if one turns out to be needed,
stop and say so. The report's pictures are of the commit as it
is.

Where the plan and the code disagree, or a cell of a table does
not read well on its painting, choose what serves the decision's
words, and say so in the report.

End with the report in Spanish for the owner (what is built,
what the owner will try, in the order of sections 2.5 and 7.6,
what you changed from the plan and why, the whole check's
result) and the prompt in English for the reviewer.
```

## 6. The designer's own: Next waits, and a part comes back framed (D317, D318)

The owner, of the time that passes in *Lo que trajo el
familiar*: *como pasa solo
tras un tiempo, el botón "Siguiente" debe estar desactivado*,
and *la escena tiene un encuadre y al salir el primer diálogo de
Orla se re-encuadra y queda raro porque parece un salto en la
cámara... debería estar encuadrada ya de modo que luego entre el
diálogo*.

- **D317.** While time passes (D280), Next and Again are
  disabled and their keys do nothing; Back and Skip stay. Next takes the keyboard back as it wakes
  (`wait`, `app/src/ui/story.ts`).
- **D318.** The part's staging is placed under its first step's
  framing while the scene is dark (`passTime`), so the hall
  comes back as Orla's words find it.

The test is `app/e2e/story.spec.ts`, *the hall goes dark while
the children tell Orla, and comes back in the evening (D280)*.

## 7. The owner's answers: who comes in, who still fades, and the words that wait (D322)

The plan asked the owner three things. The answers, of
2026-11-22:

1. *Eldra alone fades?* **Yes**, and with her the script's own:
   *los que aparecen con un hechizo como los familiares o
   desaparecen cuando se desvanecen porque no estaban bien
   creados, también son excepciones*. A ghost, a familiar a
   spell calls or sends away, a trial that comes apart (D262).
2. *Does the rule hold for who comes in?* **Yes**: *También a
   los que entran, salvo las excepciones en las que por guión
   aparecen o desaparecen. Y salvo los personajes que ya están
   en la escena cuando empieza la escena, que son la mayoría de
   los casos.* This section plans it.
3. *May every change of framing inside a part be a travel?* The
   owner: *A veces hay que cambiar por un diálogo creo, no?* Yes,
   a step frames another place for its dialogue's sake (the
   passage's two halves in *La voz en el túnel*), and that
   change travels as any other; what waits is the figure's
   bubble, which comes up once the camera has arrived (2.2).

**Where it is today.** `appear` sets a figure on a cell and takes
its alpha from nothing to 1 over 0.9 of a tick
(`app/src/engine/scene.ts`, `case 'appear'`); with `from` the
figure walks out from behind a thing on the cell beside (D128).
Ten figures fade in so, in seven stories; the friend behind the
library's shelf (*the-wand-bank*, 5) is the one use of `from`.
The world's check (`_story_actions`, `story_on_scene`) asks of
the cell only that it be free and that the figure be out of
sight.

### 7.1 The story's keys

- `{"enter": [x, y]}`, by an actor that is not in the scene: an
  actor with no `at` that has not come in, as `appear` asks
  today. With `"flying": true` the figure comes in through the
  air, as `appear` takes it today. The wizard never enters: it
  is staged.
- The cell is a way in, of one of two kinds.
  1. *The edge.* A cell on the scene's border, no corner, that
     the figure may stand on, or fly over when it comes flying.
     The figure comes in from past that side: left of column 0,
     above row 0, right of the last column, under the last row.
  2. *A way-out cell.* A cell whose terrain says `"out": true`
     (2.1). The figure is set there, behind the cover, and its
     walk brings it out.
- Figures that enter by one cell of the edge in one step come in
  single file, in the order the step names them.
- A bare `appear` (no `from`) and a bare `vanish` are an actor's
  of kind `ghost` or `familiar` alone. By any other figure each
  is an error; its message names `enter`, or `leave`, and D322.
- `appear` with `from` (D128) stays as it is, for any actor.
- A figure in the scene when the story, or a part, starts says
  `at` in the staging, as today. That is no entrance, whether
  the first framing shows the figure or not.

### 7.2 The world's check

`_story_actions` takes `enter`, alone or with `flying`.
`story_on_scene` holds it so; each failure is a `LevelError`
that names the story, the step, the figure and the cell.

- The figure is out of the scene (the error `appear` gives
  today for one already in sight).
- The cell is a way in of 7.1: on the border and no corner, or
  an `out` cell. A cell inside the map, and a corner, each have
  their own message.
- A border cell is one the figure walks on (`walked`, the
  story's floor of D288 with it), or flies over with `flying`.
- By the edge the figure takes two ticks to reach its cell: it
  is set two cells past the edge at the action's tick, and moves
  one cell a tick. The k-th figure before it by the same cell in
  the same step sets it k cells further out, and k ticks later
  on its cell. The cell is free when the figure reaches it, by
  the rule that holds a walk's cells free; a figure that stays
  on the cell while one comes behind it fails by that rule.
- By a way-out cell the figure is on its cell at the action's
  tick.
- A bare `appear` or `vanish` by an actor of another kind than
  `ghost` and `familiar`.

The cells past the edge are no cells of the map: nothing is
asked of them.

**The art's check** (`tools/art/sweep.py` and its test): a scene
whose art has a `margin` on a side has no `enter` by that side's
edge, as it has no walk that leaves by it (2.1).

### 7.3 The page

- `storyEvents` counts as the world does. By the edge: an event
  `enter` at the action's tick, with the place past the edge (a
  cell off the map, two out, or more in a file) and the way the
  figure faces, in; then one `move` a tick, as a walk's (a
  flight's, flying), up to the way-in cell. By a way-out cell:
  `enter` with that cell. The figure's next action follows at
  the next tick.
- `scene.ts`, `case 'enter'`: the figure is placed on the cell
  it is given, off the map as on it (2.1's move off the map),
  shown at once with alpha 1, on its feet (D279) or in the air
  with its shadow, its sway started. No tween of alpha. Played
  at once (a seek, Back, a step played again), the figure is
  where the step finds it.
- `appear` keeps its fade for the ghost and the familiar, and
  its step from behind a thing (D128).
- The camera never shows past the painting (`least`), so a
  figure past the edge is out of sight in any window. A story's
  camera that keeps the step's figure (D74) keeps the cells of
  the scene: it is not asked to look past the edge.
- The scene's handle tells of a figure what it tells today (its
  cell, whether it is drawn, its alpha), a figure past the edge
  with the cell it is on.

### 7.4 The restagings

Five figures come in by an edge, in three steps; five are in
the scene when it starts, because the moment finds them there
or because the picture gives no edge to come in by. Look at
each with a picture of the step's start and of its end, and
move a cell where the painting asks for it.

| Story, step | Scene | Who | Comes in |
|---|---|---|---|
| `caught`, 2 | `the-way-down` | Dask | `enter [10, 14]`, then `walk [10, 13]`: out of the dark at the picture's foot, onto the children |
| `the-flying-lesson`, 2 | `the-broom-shed` | Ilda, the girl, the boy | by the path at the picture's foot. Ilda `enter [9, 14]`, `walk [9, 7]`, `face up`; `classmate_girl` `enter [9, 14]` behind her, `walk [9, 12]`; `classmate_boy` `enter [10, 14]`, `walk [10, 12]` |
| `the-flying-lesson`, 4 | `the-lake-edge` | Zarek | `enter [8, 0]` flying, over the lake's water at the top edge; `fly [[8, 3], [4, 3], [4, 4], [3, 4], [3, 5]]`, `land`, `face left` |
| `at-the-gate`, 3 | `the-field` | friend | staged from the story's start `at [8, 29]`, the path's foot, facing up, under the first framing's foot; step 3's walk is `[8, 22]`, up the path into the framing. The field has a margin under its last row: no way in by that edge (2.6) |
| `after-dark`, 4; `the-morning-after`, 2 | `the-dormitory` | friend | staged from the story's start `at [12, 15]`, facing up, in the corridor outside the common room's door: who knocks stands there. The step keeps `walk [12, 12]` and `face down`, through the door the wizard has opened |
| `the-finish`, 1 | `the-race-course` | Zarek | staged from the story's start in the air, `at [26, 12]`, the story's `"flying"` naming him with the wizard: the racer just behind. The step keeps `fly [32, 12]` and `land` |
| `the-tower`, 18 | `the-tower-hall` | mate | staged in the part `at [9, 12]`, facing up, on the landing under the arch, behind the friend (floor a story walks, 2.1). The walk is as written |
| `the-wand-bank`, 5 | `the-library` | friend | stays: out from behind the shelf (D128) |

*The lake.* Zarek's line says he crossed the lake on his first
day; he comes over it. If his figure reads badly against the
trees' crowns at the top edge, he comes by the left edge
instead: `enter [0, 2]` flying, `fly [[3, 2], [3, 3], [4, 3],
[4, 4], [3, 4], [3, 5]]`.

*The dormitory's corridor.* The friend stands at `[12, 15]`
through steps 1 to 3 of *after-dark* and step 1 of
*the-morning-after*, in front of the wall's face, where a window
that shows the corridor shows them. That is the knock's own
picture.

### 7.5 The tests

- **pytest**: `enter` by each edge and flying over water at the
  edge; on a corner, on a cell inside the map, on a border cell
  that is a wall, by a figure already in the scene, with a key
  that is not its own: each its error. Two by one cell: the
  second is on the cell a tick after the first; a first that
  stays on the cell fails. `enter` on an `out` cell. A bare
  `appear` and a bare `vanish` by a `friend`: each its error;
  by a `familiar` and by a `ghost`: accepted. The content as it
  is passes.
- **The art's check**: an `enter` by an edge with a margin.
- **vitest**: `storyEvents` for an entrance by each edge (the
  `enter` two cells out, the two moves, the next action's tick),
  for a file of two, for one flying, for an `out` cell; a seek
  to a tick inside the entrance.
- **Browser** (`app/e2e/story.spec.ts` and the chapters' specs
  that play these stories):
  - *caught*, 2: at the step's start Dask is drawn and nothing
    of him is inside what the camera shows; his alpha is 1 from
    the step's start to its end; he ends on `[10, 13]`. Again
    plays the entrance anew; Back from step 3 finds him on
    `[10, 13]`.
  - *the-flying-lesson*, 2: the three end on `[9, 7]`,
    `[9, 12]` and `[10, 12]`, none ever translucent, the girl
    never on Ilda's cell. Step 4: Zarek is in the air from the
    step's start and lands on `[3, 5]`.
  - *at-the-gate*: the friend is on `[8, 29]` at step 1 and on
    `[8, 22]` at step 3's end, alpha 1 throughout.
  - *after-dark*, 1: the friend is on `[12, 15]`.
  - The specs that wait for an `appear` in these steps wait for
    what the step does here.

### 7.6 What the owner will try

1. Chapter 3, *Atrapados*, 2: Dask walks in from the dark at
   the picture's foot and stops in front of the three.
2. Chapter 4, *La clase de vuelo*, 2: Ilda and two classmates
   come up the path into the shed, one behind another. At 4,
   Zarek comes flying over the lake and lands by the class.
3. Chapter 1, *Ante la puerta*, 3: the friend comes up the path
   from below the frame.
4. Chapter 3, *Después del anochecer*, 4, and chapter 4, *La
   mañana siguiente*, 2: the friend is outside the door from the
   start, and comes in when the door is open.
5. Chapter 4, *La meta*, 1: Zarek is in the air behind the
   wizard, flies in and lands.
6. Chapter 5, *La torre*, 18: the mate comes up from the landing
   behind the other two.

### 7.7 The piece

One piece, *who comes in*, after 3.3 and before 3.4, with its
own commit: the key, the world's check, the art's check,
`storyEvents`, the scene's `enter`, the eight restagings, the
tests. `ci/check.sh` and the browser specs it touches. For the
report, a picture of each step's start and end, of the commit as
it is.
