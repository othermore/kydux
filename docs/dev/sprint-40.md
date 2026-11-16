# Sprint 40 — The shed as the owner read it, and what the review left

The owner read chapter 4's walkthrough up to *La revisión*
(`drafts/recorrido-capitulo-4-2026-11-10.es-comments.md`, 2026-11-11) and
asked for the shed's levels to be reshaped: the brooms that were "in a row
on the floor" hang on the rack's pegs, with a hanging broom's picture
that fits each peg exactly; `find_all` finds what lies near where the
wizard stands (by the wall, the hung brooms; in the straw, the fallen
ones), a rule taught before it is used; a short practice teaches
`untie` with `find_nearest` before the lists; the lists' lesson teaches
one element by its index and what happens when it does not exist; the
loop's lesson shows both ways, over the list and over `range` with the
index; the camera frames the whole shed as the three walk in; and the
story's and the levels' words are the owner's, given below. After that,
what the designer's review of sprint 39 left (`drafts/uat-capitulo-4.es.md`,
section 10). The owner is away this week and tests through documents
with captures; nothing is released until they are happy with chapter 4.

The rules of the earlier sprints hold: pieces in order, one local commit
each, `ci/check.sh` and the browser specs a piece touches green before
it, the whole `ci/check.sh --e2e` once before the last commit; never a
push, never a timer, never a deploy; the servers on 443 and 5173
untouched; documents and comments in the present; Gemini writes every
text the child reads from a brief, except the words the owner wrote
here, which are taken as they are (English by Gemini from them).

## 1. Decisions taken here

- **D195 — A broom hangs on a peg, and is untied from the cell under
  it.** Decided 2026-11-11 by the owner (*habrá que poner las escobas
  colgadas; hay que hacer la imagen de una escoba colgada y ver cómo se
  posicionan para que encajen en el gancho perfectamente*). The shed's
  rack holds eight pegs, one in the middle of each cell from column 6 to
  13, drawn by the tool from the painting's own peg (the painted twelve
  are painted over with the rack's planks). A hanging broom is a thing of
  kind `broom` with `"hung": true`, on the wall cell under its peg's
  centre, (x, 5); its picture is the sprite `broom-hung.webp`
  (`content/art/things/`, asked of Gemini: one broom hanging straight
  down from a peg, its handle's loop on the peg, seen as the scene is),
  anchored by its top at the peg's point and drawn at the wall's depth,
  behind a figure standing under it; `untie()` works from the cell under
  it, (x, 6), as a door opens from beside it (`too_far` otherwise). A
  broom on the floor is as before. Rules out brooms "in a row on the
  floor", and a hung broom drawn off its peg.
- **D196 — What `find_all` and `find_nearest` find depends on where the
  wizard stands.** Decided 2026-11-11 by the owner (*find_all depende de
  dónde estés: junto a la pared, solo encontrarás las escobas colgadas;
  cerca de la paja, las que están tiradas bajo la paja*). A level may name
  `zones`, each a list of cell boxes; a thing may name its `zone`. A
  thing with a zone is found by `find_all` and `find_nearest` only while
  the wizard stands in that zone; a thing without one is found from
  anywhere, as until now; `find_nearest` with nothing found gives `None`
  and `find_all` an empty list, as now. The plan window hatches a zone's
  cells lightly and names it. The rule is taught in the broom's lesson
  (D197) before any level uses it, and the shed's first level counts by
  standing in both zones. Rules out a `find_all` that sees through walls
  into every corner of a place.
- **D197 — The broom is taught before the lists, with a practice of
  one `untie`.** Decided 2026-11-11 by the owner (*una primera práctica
  sencilla: una escoba justo a tus pies, búscala con find_nearest y
  quítale el nudo con untie*). A lesson `the-broom` (*La escoba y su
  nudo*): the broom is an object, its attribute `knotted` says whether
  the black thread is tied in it, its method `untie()` takes the knot off
  when the wizard stands on it (or under it, hung); `find_nearest` recalled
  from chapter 2; and D196's rule, with the shed's two places as the
  example. A practice follows it, `the-broom-at-your-feet`, one
  `find_nearest` and one `untie`. Rules out `untie` used in a level before
  it is explained.
- **D198 — The lists' lesson teaches one element by its index; the loop's
  lesson shows both ways.** Decided 2026-11-11 by the owner. `lists`
  gains a page, *Uno de la lista*: `nombres[0]` is the first, counting
  from 0 as the cells do, `nombres[2]` the third; asking for one the list
  does not have, `nombres[3]` in a list of three, is an error the game
  tells in the child's words (*la lista no tiene tantos: tiene 3, y
  pediste el 4.º*), from Python's `IndexError`; a *Try it* that prints
  the first and the last. `for-each` is two pages: `for broom in brooms:`
  as now, and `for i in range(len(brooms)):` with `brooms[i]`, the index
  counting the turns, each with its *Try it*; the second says when each
  way is handy (the first to do a thing with each; the second when the
  number of the turn matters). Rules out a child who meets `[0]` for the
  first time in a challenge.
- **D199 — A story step may frame a place.** Decided 2026-11-11 by the
  owner (*al entrar al cobertizo la cámara se centrase en el cobertizo,
  para que se vea entero*). A step's `camera` may be `{"fit": [[x0, y0],
  [x1, y1]]}`: the page zooms out as far as it must to show that box of
  cells whole, centred, and keeps it until a later step gives a camera or
  the story ends; `{"wide": true}` fits the scene's playable width (the
  wide fields). The first story of chapter 4 fits the shed as the three
  walk in. Rules out a story where a place is seen in pieces.

## 2. The shed, as it is now

### 2.1 The stops

`04-the-broom` has eighteen items; the field's are unchanged:

1. `story:the-morning-after` (six steps, 2.3)
2. `lesson:the-broom` — *La escoba y su nudo* (two pages, no *Try it*)
3. `level:the-broom-at-your-feet` — Practice 1, *La escoba a tus pies*
4. `lesson:lists` — three pages
5. `level:the-shed` — Practice 2, *El cobertizo*
6. `lesson:for-each` — two pages
7. `level:the-brooms-on-the-wall` — Practice 3, *Las escobas de la pared*
   (replaces `the-brooms-in-a-row`, whose folder goes)
8. `level:the-brooms-in-the-straw` — Practice 4
9. `lesson:checking-each`
10. `level:the-check` — Fix 1
11. to 18. as before (`story:the-flying-lesson` … `story:the-finish`).

The kinds' numbers follow the order (Practice 1 to 6 across the chapter).

### 2.2 The scene

`the-broom-shed`: the rack's pegs made eight, one a cell, columns 6 to
13 (`tools/art/repaint.py` with a patch of the rack's planks over the
painted pegs' band and the painting's own peg copied to each cell's
centre at the same height; the ground exported again, the sweep green;
the pegs' cells and height in `cut.json` as `pegs`). Zones (in the
levels, 2.4): `wall` the row 6 cells from column 6 to 13; `straw` rows 7
and 8, columns 6 to 13. The hung broom's sprite (D195) and the lying
one as now; `things.json` gains `broom-hung` with its anchor `top`.

### 2.3 The story

`the-morning-after`, Spanish as the owner wrote, English by Gemini from
it; steps 1 to 3 unchanged:

4. The voice, as the three walk in; the camera fits the shed, columns 3
   to 16, rows 3 to 10 (D199): *Los tres bajáis por el camino de grava
   detrás del castillo hasta el cobertizo de las escobas. La puerta está
   abierta de par en par y todo está desordenado. Muchas de las escobas
   están tiradas por el suelo en lugar de colgadas en su sitio.* The
   shed shows, in this story's staging, four brooms hung on the pegs at
   columns 6 to 9 and four lying in the straw, among them one at (9, 8),
   by the door, where the wizard stops.
5. The friend, bending over the broom at (9, 8) (the standing look, as
   now): *¡Mirad lo que he encontrado en el suelo! Es un hilo negro con
   un nudo, un nudo encantado. Si han puesto uno de estos en una escoba,
   se encabritaría en el aire y tiraría a quien la monte. ¡Tenemos que
   quitarlos! Según la conversación, iban a trucar todas las escobas.*
6. The friend: *Esta de aquí, a tus pies, tiene uno. Quítaselo tú: te
   enseño cómo se hace.* (to the broom's lesson).

The owner's third text (*Pero ¿cuántas son? Y ¿cómo las encontramos?
Hay una manera de encontrar todas las cosas del mismo tipo. Os la
enseñaré.*) opens the lists' lesson's first page, said by the friend,
and the shed's level's intro.

### 2.4 The levels

Every level of the shed names `zones` as 2.2; the friend and the mate on
the two free cells nearest the start that no route crosses, and never on
a broom's cell. `tick_limit` 100.

**P1 `the-broom-at-your-feet`, *La escoba a tus pies*.** Start (9, 8),
end the same, no mark. Things: `broom_0`, lying at (9, 8), knotted, zone
`straw`, not hidden; the four hung brooms of the story at columns 6 to
9, zone `wall`, knotted, for the eye only (no goal on them). Goals:
`untied` on `broom_0` only (`{"kind": "untied", "ids": ["broom_0"]}`: the
goal takes `ids` to name the brooms it counts; without `ids`, every
broom, as now); bonus `uses` `find_nearest`. `api`: `wizard.find_nearest`,
`broom.untie`. Starting code: two comments (find the broom under your
feet with `find_nearest`; take its knot off with `untie`). Solution:
`broom = wizard.find_nearest("broom")`, `broom.untie()`. Wrong:
`untie` on a broom found from the wall (`wizard.move_up(2)` first: the
hung one found, `too_far`), `find_nearest("key")` (None), the untie alone
(`broom` not defined).

**P2 `the-shed`, *El cobertizo*.** Start (9, 8), end the same, no mark,
the wizard back where it began is not asked. Things by way: hung,
knotted, zone `wall`, hidden never: `six` columns 6, 7; `seven` 6 to 8;
`eight` 6 to 9; lying in the straw, hidden until found, zone `straw`:
`broom_0` at (9, 8) untied (the one of P1), and the straw way's three
(2.4 P4's cells); so the counts are 2 + 4 = 6, 3 + 4 = 7, 4 + 4 = 8.
Goals: `say` with `count_of: broom`; bonus `uses` `print`. `api`:
`wizard.find_all`, `wizard.say`, the moves, `print`, `len`. Starting code:
comments: find the brooms down here with `find_all`; walk up to the wall
with `move_up`; find the hung ones with `find_all`; say how many there
are in all with `say` and `len`. Solution: `fallen = wizard.find_all(
"broom")`, `wizard.move_up(2)`, `hung = wizard.find_all("broom")`,
`wizard.say(len(fallen) + len(hung))`. Wrong: one `find_all` from the
door and its `len` said (the straw's only: fails every way), one from the
wall only, `say("8")` typed (wins one way). Intro: the owner's words
(*Pero ¿cuántas son? Y ¿cómo las encontramos?*) and the friend's reminder
that from here one finds the straw's and by the wall the hung ones.

**P3 `the-brooms-on-the-wall`, *Las escobas de la pared*.** Start (9, 8);
end hidden, `on_the_way`, at (8, 6) (every way passes it). Things: hung,
knotted, zone `wall`: `two` columns 6, 7; `three` 6 to 8; `four` 6 to 9;
no broom in the straw (the friend has set them aside for later: the
intro says so in a word). Goals: `untied`; `reach` hidden; bonus `uses`
`for`. `api`: the moves, `wizard.find_all`, `broom.untie`. Starting code:
walk up to the wall with `move_up`; left to under the first peg with
`move_left`; find the hung brooms with `find_all`; for each broom: untie
it with `untie`; a step right with `move_right`. Solution:
`wizard.move_up(2)`, `wizard.move_left(3)`, `brooms = wizard.find_all(
"broom")`, `for broom in brooms:` / `broom.untie()` /
`wizard.move_right()`. Wrong: two unties and moves written out (wins
`two`, fails the others), the loop with the move before the untie, the
`find_all` made from the door (empty list: nothing untied).
A unit test holds that from (6, 6) `find_all` gives the hung brooms left
to right in every way.

**P4 `the-brooms-in-the-straw`, *Las escobas de la paja*.** Start (12, 7),
the top right of the straw (the friend says we came down from the wall);
end (6, 8) hidden, the same in every way. Things: lying, knotted, zone
`straw`, hidden until found: `three` (10, 7), (8, 8), (6, 8); `three_low`
(11, 8), (9, 8), (6, 8); `three_mid` (10, 7), (9, 8), (7, 8); the hung ones
of P3 stay on their pegs, untied, zone `wall`, for the eye (they are not
found from the straw: D196). A unit test holds the order from (12, 7)
(nearest first, each left of and not above the one before). Goals,
`api`, solution as before (left and down from `position`). Intro, the
owner's words: *Ya hemos terminado con las escobas que estaban colgadas.
¡Las demás están tiradas por la paja! Desde donde estás, si usas
find_all las encontrarás ordenadas empezando por la más cercana, y te
puedes ir moviendo abajo y a la izquierda para ir desatando todas.
Puedes calcular cuántos pasos tienes que andar desde donde estás en
cada momento hasta la siguiente escoba, y así pasar por todas.* (with
`find_all` as code).

**F1 `the-check`, *La revisión*.** Start (6, 8) (where P4 ended); end
hidden, `on_the_way`, at (11, 6). Things: every broom hung, zone `wall`,
one a peg from column 6: `six` columns 6 to 11, knotted 8 and 11;
`seven` 6 to 12, knotted 7, 10 and 12; `eight` 6 to 13, knotted 9 and 13;
no broom in the straw. Goals: `untied`; `reach` hidden; `no_error`;
bonus `uses` `knotted`. `api`: P3's and `broom.knotted`. Starting code,
the friend's program, which is P3's whole: `wizard.move_up(2)`,
`brooms = wizard.find_all("broom")`, `for broom in brooms:` /
`broom.untie()` / `wizard.move_right()`; it stops at the first broom
(column 6, never knotted) with `no_knot`. Solution: `if broom.knotted:` /
`broom.untie()` in the loop, the move outside the `if`. Wrong: the given
program; the move inside the `if`; `if not broom.knotted`. Intro, the
owner's words: *Nuri ha dejado todas las escobas ordenadas, colgadas en
sus ganchos en la pared. Se ha dado cuenta de que algunas todavía
tienen un nudo encantado. ¡Algunas se nos escaparon, así que hay que
repasarlas! He puesto el programa que usamos para recorrer las escobas
en la pared, para ir una por una desatando el nudo. ¡Pero se para en la
primera escoba, porque esa no tiene nudo, y desatar una escoba sin nudo
es un error! ¿Puedes arreglar el programa con un if? Para ver si una
escoba tiene nudo, se puede usar su atributo knotted.* (`{mate}` for
Nuri; `if` and `knotted` as code).

### 2.5 The lessons

- `the-broom` (new, the friend): page 1, *La escoba y su nudo*: the
  broom is an object the code knows as `broom`; `broom.knotted` is `True`
  while the black thread is tied in it and `False` once it is off;
  `broom.untie()` takes the knot off, and only when you stand on the
  broom, or under it if it hangs; `find_nearest("broom")` gives the
  nearest, as it gave a key in the library. Page 2, *Lo que encuentras
  depende de dónde estés* (D196): with the shed's two places as the
  example; no *Try it* (D174).
- `lists`: page 1 opens with the owner's question; page 2 as now; page
  3 *Uno de la lista* (D198).
- `for-each`: two pages (D198).
- `checking-each`: unchanged.

## 3. The pieces

### 3.1 The world

- Zones (D196): `Level.zones`, a thing's `zone`, `_nearby` filtered by
  the wizard's zone; the content test that a thing's zone exists and its
  cell lies in it; the map handed to the page carries the zones.
- Hung brooms (D195): `Broom.hung`; `untie` from the cell under a hung
  broom (and `too_far` elsewhere); a hung broom's cell is a wall cell the
  content test allows for a hung broom only.
- The `untied` goal's `ids`.
- The index error in the child's words: the sandbox's explanation of
  `IndexError` (`explain.py`): *la lista no tiene tantos: tiene {n}, y
  pediste el {i}.º*, both languages, Claude's.
- Tests: the orders of P3 and P4 and the counts of P2 by way; a hung
  broom untied from under it and refused from beside; `find_all` from the
  door gives the straw's only.
- Check: `world/tests`.

### 3.2 The page

- The hung broom's sprite anchored at its top (`things.json` `anchor`),
  drawn at the wall's depth behind a figure under it.
- A story step's `camera` `fit` and `wide` (D199).
- The plan window's zones.
- The index error shown as the other refusals are.
- Check: Vitest.

### 3.3 The scene

2.2: the pegs by the tool, the scene exported again, the sweep and the
sheets looked at; the hung broom asked of Gemini (`sprite-broom-hung.md`,
1 image, +1 retry) and cut (`sprites.py`); `figures-check.png` gains it.

### 3.4 The levels, the stories and the texts

2.3 to 2.5: `level.json`, solutions and wrongs; the story's staging (the
four hung and four lying brooms, the camera fit); `chapter.json`'s
eighteen items; the old `the-brooms-in-a-row` folder, tests and words
removed. Briefs: `chapter-4-shed-texts.md` for the new and changed level
texts and the lesson pages (the owner's Spanish given word for word as
what the texts must say; English from it), `chapter-4-shed-story.md`
for the story's steps 4 to 6; every draft read and corrected. The
course book regenerated and the shed read whole in Spanish.
`docs/dev/course.md` chapter 4's table and `story.md`'s places row for
the shed say the new stops and the pegs. Check: `ci/check.sh`.

### 3.5 What the review of sprint 39 left

- The wizard's flying bases cleaned of their magenta rim
  (`off_magenta_rim` depth 2) and the sixteen sheets made again; the
  fringe under 0.25 % of a flying frame's pixels on `figures-check.png`.
- Zarek's flying row facing down shows the broom (its handle ahead, the
  twigs behind, the arm on the handle): one Gemini edit of that view, 1
  image, +1 retry.
- The sand look's portrait band: `portrait_parts` takes the band by its
  rows within the hat; the eight look portraits made again.
- `the-ring-field` and `the-race-course`: the trees' crowns, the posts
  and the stand marked and cut as static things, exported again, the
  sweep green; `the-finish`'s first step takes `camera` `wide` (D199).
- The notebook's words for `def` and `len`.
- The rim's joint beside an arch: an hour's try as sprint 40's first
  plan said; stop and say so if no rule tells it apart.
- Check: `ci/check.sh`; `wizard.spec.ts`, the chapter-4 spec.

### 3.6 The map folded by chapter

Kept from the first plan of this sprint as its last piece, so that the
owner may still say no before it is built: the map shows each chapter as
its card; the current chapter open; a finished one folded under its card
with its stars' total and *Abrir*; a locked one folded and greyed. If the
owner has said no by then, the piece is skipped and the report says so.

### 3.7 The tests, the walkthrough and the report

- `chapter-4.spec.ts`: P1 won by its two lines; P2 won by the two counts
  and lost by one `find_all`; P3 won in every way and the written-out
  unties lose the longer ones; P4 won in every way; F1 stops at the first
  broom and the `if` wins; the story's camera fits the shed at step 4
  (`data-camera-fit`); the hung brooms drawn on their pegs
  (`data-sprite-things`); `?debug` names the zones.
- The walkthrough of chapter 4 made again (`drafts/recorrido-capitulo-4-
  <date>.es.md`), the shed first, so that the owner reads it where they
  left off.
- The report in Spanish with the pictures of the final commit (the rack
  with its eight pegs and the brooms hung, each shed level's start and
  win, the story's step 4 framed, the lessons' new pages, the figures'
  sheet's tail, the two fields' sweeps), the commits, the images spent,
  what differs and why, and the prompt for the designer's review.

## 4. Gemini images

Three at most (the hung broom, Zarek's flying view, one retry), within
the chapter's budget (26 of 50 spent).

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux. Read
first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-40.md (this plan, whole), docs/dev/sprint-39.md (what
you built last), the owner's comments in
drafts/recorrido-capitulo-4-2026-11-10.es-comments.md (every
"Comentarios:" line with words), drafts/uat-capitulo-4.es.md (the
designer's review, section 10), drafts/chapter-4/capitulo-4.md (the
design; its section 7 says what this sprint changes in the shed), and
the memory notes kydux-two-agents, kydux-sprint-39-state,
kydux-designer-review-39 and kydux-checks-per-piece. Build sprint 40
whole: pieces 3.1 to 3.7 in order, one local commit each; before each
commit ci/check.sh and the browser specs the piece touches green, and
the whole ci/check.sh --e2e once before the last commit; never a push,
never a timer, never a deploy: the owner is away and nothing is
released until they are happy with chapter 4. Never stop or build into
the servers on ports 443 and 5173, and stop your own preview when you
are done. Gemini paints at most 3 images, named in their commits. The
owner's Spanish words in the plan are kept as they are; Gemini writes
the English and the rest from the briefs, and you read and correct
every draft. The plan decides everything; where it does not, take the
smallest choice that keeps its intent and say it in the commit. Every
document and comment in the present. Before git add, read git diff of
each file and stage only your own hunks; commit promptly. Hand over a
report in Spanish as 3.7 asks, and end with the prompt for the
designer's review in English, in a code block.
```
