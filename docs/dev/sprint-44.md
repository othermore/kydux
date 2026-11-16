# Sprint 44 — Rings flown one way and in pairs of a colour, the race in two lanes, *La revancha* as a fix, a tip with its picture at every new scene, cards that open at their top, the code's letter, and the words about knots

The owner read the rest of chapter 4's walkthrough on 2026-11-14, from
lesson 7, `an-action-of-your-own`, to the story *La meta*. Their ten
comments are in `drafts/recorrido-capitulo-4-2026-11-13.es-comments.md`,
and their message of that day adds six things of its own and what they
had asked to be noted on 2026-11-14 while they read (a picture for each
tip, a tip at every wait, why loading waits on the network). This sprint
is all of it.

What the owner asks, in short:

1. A pair of rings is always flown the same way: the first from below
   upward, the second from above downward. It is a rule of broom races,
   the world holds it, and every program of the chapter flies so.
2. The rings are seen in pairs: the two of a pair close together, a
   longer stretch to the next pair, and each pair painted a colour.
3. In the race each racer has a row of rings of their own, the two rows
   alike, so that each starts in their row and they never cross. The
   race's card is said in the owner's words: a line is a turn waited
   before leaving, a ring missed is five turns before the finish, a tie
   is flown again, and Zarek's program has 18 lines.
4. *La revancha* is a fix, not an improve: the program that won the
   race is given, 11 lines, and the child repairs its numbers for the
   rings' new places.
5. Lesson 7 explains `def` with a function the child can follow,
   `quick_fly()`, which takes off, flies round and lands; `two_rings`
   waits for the level that has rings.
6. The story *La meta* says who claps where they are seen, Ilda gives
   the broom for a reason (the school's broom racing team), and Teku's
   line is the owner's.
7. What is untied is a knot, never a broom, and *paja* is only what the
   brooms lie hidden in: the straw's won card, the second story's first
   step and every other text are brought to it.
8. The starting code's comments are not broken by hand: each fits a
   line where it can, and where it cannot the editor carries it to the
   next. The code's letter is one of three the owner tries in the real
   page under `?debug`: Inconsolata at 16, and Noto Sans Mono a little
   narrow and narrow at 14.
9. The waiting view has no button: when loading ends and the tip has
   been read, the tip goes and the screen shows by itself. A tip is
   shown at least at the first load and whenever the place's picture
   changes. Every tip has a picture of what it tells.
10. The card with a level's goals closes at a click on any button of
    the page, *Ejecutar* among them, and a card that does not fit opens
    at its top.
11. Why a slow connection is felt when everything runs on the child's
    computer: measured, and answered in plain words.

The rules of the earlier sprints hold: pieces in order, one local commit
each, `ci/check.sh` and the browser specs a piece touches green before
it, the whole `ci/check.sh --e2e` once before the last commit; never a
push, never a timer, never a deploy; the servers on 443 and 5173
untouched; documents and comments in the present; Gemini writes every
text the child reads from a brief, and the owner's own Spanish words are
kept as they are, with their slips of the keyboard put right.

## 1. Decisions taken here

They are entered in `docs/dev/architecture.md` with this plan. D187,
D189, D190, D214 and D218 are brought to them in place, and the table
of events with them.

- **D219 — A ring is flown one way, and rings come in pairs of a
  colour.** Decided 2026-11-14 by the owner (*los pares de aros siempre
  se pasan el primero desde abajo hacia arriba y el segundo desde arriba
  hacia abajo*; *así se ve siempre que los aros van de dos en dos*;
  *cada pareja fuese de un color*). A ring carries its `way`, `up` or
  `down`, and its `colour`. Flown through its cell in a vertical move
  along its way, it lights and counts (`through`); flown through
  against its way it does not: the ring shakes, the wizard says which
  way it is flown, the event is `wrong_way` and the ring counts as
  missed. A horizontal move into it bumps, as before. The rings a goal
  or a race names go in pairs: the first of a pair `up`, the second
  `down`, the two on one row and of one colour, the next pair of
  another colour; a level that does not hold this does not load. The
  wizard starts on the row under the rings. Ilda tells the rule as the
  rule of broom races where rings are first met, in *Los aros*, and the
  goal's line repeats it in every level with rings. Rules out a pair
  flown down and then up, a ring that counts whichever way it is
  crossed, a ring alone, and two pairs side by side of one colour.
- **D220 — The race is flown in two lanes, each racer through rings of
  their own, and a tie is flown again.** Decided 2026-11-14 by the
  owner (*necesitamos que haya dos filas de aros iguales, para que cada
  uno empiece en su fila y no se choquen*; *en caso de empate, se
  repite la carrera*). The race course has two lanes of three rows, a
  free row between them. The racer's lane holds his own rings, at the
  wizard's columns and in the wizard's colours, and the level's `race`
  names them in order; he starts on the row under them, at the
  wizard's column, flies every one of them by D219 and crosses the
  finish line at the last cell of his path, in his lane. A level whose
  racer misses a ring of his own, or leaves his lane, does not load.
  Ilda's count stays as D189 gives it; equal ticks are a tie, the goal
  `before` is not met and the outcome says that the race is flown
  again. Rules out a racer who flies where there are no rings, two
  racers through the same ring, a racer's flourish to spend ticks, and
  a tie that is anybody's win.
- **D221 — A tip with its picture at the first load and at every new
  scene, and the screen opens by itself.** Decided 2026-11-14 by the
  owner (*no debes poner el botón de seguir, sino que automáticamente
  se debe eliminar el tip y mostrar la siguiente pantalla*; *al menos
  se muestra uno en la primera carga y en la carga de cada escenario*;
  *cada tip debería tener una imagen o captura de pantalla*). The
  waiting view has no button. For a child who has begun, a tip is up
  from the wait's first moment at the first wait of a visit and at
  every screen whose scene is not the scene last shown; any other wait
  keeps D214's grace. When the screen is ready the tip stays until it
  has had its reading time by D175, counted from the moment it was put
  up and never more than ten seconds, and the screen then shows by
  itself. Every tip has a picture, made from the game's own page in
  each language, over its words. Rules out a button to go on, a tip
  that flashes by, a new place opened with no tip, and a tip told in
  words alone.
- **D222 — A card opens at its top, and the start card closes at any
  button of the page.** Decided 2026-11-14 by the owner (*el scroll de
  ese cuadro debería estar arriba y que haya que bajar para leerlo y
  cerrarlo*; *si se hace clic en cualquier botón de la página, incluido
  ejecutar y similar, el cuadro de objetivos se debería ocultar*). A
  card taller than its room scrolls, and shows its first line when it
  opens: its button takes the keyboard without bringing itself into
  view. A click on any button of the page outside the start card
  closes the card, and the button does what it does. Rules out a card
  opened at its end, and a start card left over the scene while the
  program runs.
- **D223 — The code's letter is one of three, tried in the page under
  `?debug`, and a comment is never broken by hand.** Decided 2026-11-14
  by the owner (*la fuente del código podría ser un pelín más pequeña;
  algún tipo de letra que sea un poco más estrecha, pero que mantenga el
  monotipo y se vea bien para programar*; *me gusta la inconsolata a 16,
  pero creo que también podríamos poner la semicondensada a 14 o la
  condensada a 14. Quiero ver cómo quedan con esas tres, idealmente como
  pruebas reales en debug mode sobre la UI*; *evitar que sean de varias
  líneas y dejar que el propio visualizador lo lleve a la siguiente
  línea*). The editor and every piece of code the page shows are set in
  one of three candidates, each a face, a width and the editor's size a
  new child gets: Inconsolata at 16, Noto Sans Mono at seven eighths of
  its width at 14, and Noto Sans Mono at three quarters of its width at
  14. Both faces come under the SIL Open Font License 1.1 and are
  bundled with the game. Inconsolata at 16 is the one in use where
  nothing is chosen. Under `?debug` the settings offer the three; the
  one picked shows at once, sets the editor's size to its own and is
  kept with the settings, so that the whole game is read in it. The
  editor's sizes are 14, 16, 20 and 24. The candidate the owner picks
  becomes the code's only letter by a decision of its own. A comment of
  a starting code is one `#` line for each sentence, written to fit a
  line where it can; the editor wraps a line that does not fit, and the
  wrapped part hangs under the line's own indentation. Rules out a font
  fetched from elsewhere, a letter chosen from a sheet and not from the
  page, a comment cut into several `#` lines to fit a width, and a
  wrapped line that starts at the editor's edge.
- **D224 — What is untied is the knot.** Decided 2026-11-14 by the
  owner (*lo que se desata es el nudo, no la escoba*; *hay que tener
  cuidado con la paja*). The texts untie or take off a broom's knot, or
  its thread, and never untie a broom; `untie` stays the method's name.
  *Paja* names only the straw the brooms lie in, on or under (*las
  escobas de la paja*, *escondidas en la paja*): no sentence ends,
  does, finishes or makes *la paja*. `tools/write/rules.md` carries
  both rules. Rules out *desatar una escoba*, *escobas desatadas* and
  *terminamos con la paja*.

## 2. What is asked

Cells are `(column, row)`, as everywhere.

### 2.1 The words about knots and straw (D224)

The owner's sentences, letter for letter:

- *Las escobas de la paja*, won: *Ya hemos terminado, ¡todas las
  escobas están a salvo!*
- The story *La clase de vuelo*, step 1, opens *Habéis quitado los
  nudos encantados de las escobas cuando se oyen voces en el campo:*
  and goes on as it is.

Every other text that unties a broom says it of the knot. Those found
on 2026-11-14, in Spanish (their English twins with them):

| Where | Today |
|---|---|
| `lessons/checking-each`, page 1 | *Desatar una escoba sin nudo es un error…*, *antes de desatar* |
| `the-brooms-on-the-wall`, intro and learned | *desatar cada una*; *te deja desatar cada escoba* |
| `the-check`, hints 1 to 3, intro, outro | *desatar todas las escobas*, *desatar una escoba sin nudo*, *al intentar desatarlas*, *¡Todas las escobas de la pared están desatadas!* |
| `the-nearest-broom`, goal 1, intro, last comment | *Desata la escoba más cercana.*; *y luego desatarla*; *podemos desatarla con broom.untie* |
| `the-brooms-in-the-straw`, last comment | *podemos desatarla con broom.untie* |
| `i18n`, `blocked.too_far` and the two `no_knot` | *Para desatar {thing}…*; *Antes de desatar una escoba, mira si tiene nudo.* |

*Desatar el nudo*, *quitar el nudo* and *desatarle el nudo* are all
right, and a sentence that already says so stays (*`broom.untie()`
desata su nudo*). The first goal of *La escoba más cercana* reads
*Quita el nudo de la escoba más cercana.* The intro of `the-check` is
the owner's of sprint 43: only its words about untying change, the
least that makes them true to D224 (*se nos escaparon al intentar
quitárselos*, *para ir una por una desatando el nudo* stays).

*Paja*: the other texts that name it (the lessons `lists` and
`the-broom`, the intros of `the-nearest-broom`, `the-shed` and
`the-brooms-on-the-wall`, the outro of `the-check`, the story *La
meta*) say where brooms lie, and stay. The programmer rereads every
Spanish text of the game with D224 in hand, and the English twins for
a second sense of their own, and says in the commit what else was
found.

### 2.2 The code's letter and the comments (D223)

**The three candidates.** Each is a face, a width and the size a new
child gets in the editor:

| Candidate | Face | Width | Size |
|---|---|---|---|
| `inconsolata-16` | Inconsolata | its own | 16 |
| `noto-semi-14` | Noto Sans Mono | seven eighths (`87.5%`) | 14 |
| `noto-condensed-14` | Noto Sans Mono | three quarters (`75%`) | 14 |

Both faces are bundled with the game, each file with its origin,
author and licence next to it: Inconsolata, the variable file of the
Latin range (`inconsolata-latin-wght-normal.woff2` of the package
`@fontsource-variable/inconsolata` 5.3.0, 34 KB; *Copyright 2006 The
Inconsolata Project Authors*, SIL Open Font License 1.1), and Noto
Sans Mono, the variable file of the Latin range
(`noto-sans-mono-latin-wdth-normal.woff2` of the package
`@fontsource-variable/noto-sans-mono`, 56 KB, its width from 62.5 % to
100 %; *Copyright 2022 The Noto Project Authors*, SIL Open Font
License 1.1). One `@font-face` names each. `--mono` starts with the
candidate's face and keeps today's families after it, and
`--mono-stretch` is its width, used as `font-stretch` wherever `--mono`
is. A setting `codeFont` holds the candidate's name; it is kept with
the settings, `inconsolata-16` is its value where nothing is chosen,
and a saved value that is none of the three reads as that one. The
three are one table in one place of the page's code, so that the
owner's pick is one line.

**The trial, in the real page.** Under `?debug` the settings carry one
more choice, `settings-code-font`, its words through the i18n layer
under `debug.font.*` (*Letra del código*: *Inconsolata, 16*; *Noto Sans
Mono semicondensada, 14*; *Noto Sans Mono condensada, 14*). Picking a
candidate sets `codeFont` and the editor's size to the candidate's, and
the page shows it at once, with no reload; the size stays the child's
to change after. Without `?debug` the choice is not offered, and the
candidate kept still dresses the code. So the owner opens any level
with `?debug`, picks one, and plays the game in it: the editor, the
lessons' code, the notebook, the cards. The designer's sheet
`drafts/sprint-44-fuentes.png` compares ten faces in a 440 px column;
it is where the three come from, and the page is where they are
judged. When the owner has picked, the pick is entered as a decision
of its own, and the other candidates, the face not used and the choice
under `?debug` leave the game.

**The size.** `FONT_SIZES` is `[14, 16, 20, 24]`, and
`DEFAULT_SETTINGS.fontSize` is 16, the size of the candidate in use
where nothing is chosen. A saved size that is not one of the sizes
reads as 16.

**Wrapped lines.** The editor wraps (it does today). A line's wrapped
part starts under the line's first character that is not a space, so
that a comment of an `if`'s body stays inside the body: a line
decoration of CodeMirror that sets the line's hanging indent from its
own leading spaces, for every line, code and comment alike.

**The comments.** No comment of a starting code is cut into several
`#` lines to fit a width: a sentence is one line. The two levels of
the straw open with the owner's words in two lines:

```
# Para que sea un poco más fácil, he escrito comentarios y te he dejado huecos para que, debajo de cada comentario, escribas el código que hace lo que dice el comentario.
# ¡Incluso te he dejado los espacios para que sepas lo que va dentro de los if!
```

(*de los for y los if!* in *Las escobas de la paja*.) The comments
that give the instructions are shorter, so that most of them fit a
line:

| Today | Asked |
|---|---|
| `# Busca la escoba más cercana con find_nearest` | as it is |
| `# Primero nos movemos a la izquierda o a la derecha.` | as it is |
| `# Si la posición x de la escoba es menor que la tuya, la escoba está a tu izquierda:` | `# Si la x de la escoba es menor que la tuya, está a tu izquierda:` |
| `# Deberás usar move_left` | as it is |
| `# Si no, la escoba está a tu derecha:` | `# Si no, está a tu derecha:` |
| `# Deberás usar move_right` | as it is |
| `# Luego nos movemos hacia arriba o hacia abajo.` | as it is |
| `# Si la posición y de la escoba es menor que la tuya, la escoba está arriba:` | `# Si la y de la escoba es menor que la tuya, está arriba:` |
| `# Deberás usar move_up` | as it is |
| `# Si no, la escoba está debajo de ti:` | `# Si no, está debajo de ti:` |
| `# Deberás usar move_down` | as it is |
| `# Una vez que hemos llegado a la escoba, podemos desatarla con broom.untie` | `# Ya estás sobre la escoba: quítale el nudo con broom.untie` |
| `# Busca todas las escobas con find_all` | as it is |
| `# Ahora haz un bucle para pasar por todas las escobas` | as it is |

The empty line under each comment keeps the indentation of the line
the child writes (D218). The English comments follow the same cut, by
Gemini. Every other starting code of the game is read for a comment
cut by hand, and joined.

### 2.3 Cards (D222)

- Every card of a level (the start card and the win card) shows its
  first line when it opens, whatever its height: the button that takes
  the keyboard takes it without scrolling (`focus({ preventScroll:
  true })`), and the card's scroll is at 0.
- The start card is what the owner calls *el cuadro de objetivos*: it
  holds the task and the goals, and it opens at the level's start and
  at the `?` button. While it is open, a click on any button of the
  page outside it closes it, and the click does its work: *Ejecutar*
  runs, *Pista* gives its hint, the notebook opens, the speed changes.
  The `?` button closes the card it opened. A click on the scene, on
  the editor or on the card itself closes nothing.

### 2.4 A ring's way and colour (D219)

**The level.** A ring is `{"kind": "ring", "id": …, "at": […],
"way": "up" | "down", "colour": …}`. *Up* is a move from the row under
the ring to the row over it. The colours are `red`, `blue`, `yellow`
and `purple`, and a pair's two rings carry the same.

**Loading.** The rings a `through_in_order` goal names, and those a
`race` names for its racer (2.6), are an even number; taken two by
two in their order, the first is `up` and the second `down`, both on
one row, the second to the right of the first, both of one colour, and
two pairs that follow each other differ in colour. The level's start
is on the row under its first ring. Anything else is an error of the
level, said with the ring's id.

**The world.** In a flying wizard's vertical move through a ring's
cell:

- along the ring's way, `through` as today;
- against it, the move is made, no `through` is noted, and the event
  is `wrong_way`, the ring's, with its `id`, `at`, `way` and the cell
  flown from. The ring is then one of the goal's `missed`, and in a
  race it costs its five ticks at the finish, as a ring passed over
  does.

A ring flown again along its way after a `wrong_way` counts if its
turn has not passed, as any ring does. A horizontal move into a ring's
cell, and a walk into it, bump as today.

**The page.** At `wrong_way` the ring shakes and the wizard thinks the
way it is flown (`blocked.ring_way.up`, `blocked.ring_way.down`), with
the bump's sound, and the program goes on. The outcome's list of
missed rings is today's. Under `?debug` a ring's number carries an
arrow for its way.

**The pictures.** `ring.webp` is a hoop of wood bound with rope on a
short post. A tool of `tools/art/` paints the hoop's wood in each
colour and leaves the rope and the post as they are:
`ring-red.webp`, `ring-blue.webp`, `ring-yellow.webp`,
`ring-purple.webp`, entered in `things.json` as `broom-hung` is, and
the page draws a ring by its colour. The colours are those of paint on
wood, clear against the grass and against each other for a child who
does not tell red from green. Where the tool's result reads as a tint
and not as paint, Gemini paints the four from `ring.webp` by the house
method (section 4).

**The words.** `blocked.ring` and the two `blocked.ring_way` are
Gemini's, from the brief. A goal's line says the rule with the count:
*Pasa por los seis aros en orden: en cada pareja, el primero hacia
arriba y el segundo hacia abajo.* is the sense, Gemini the words.

### 2.5 Lesson 7 and *Los aros* (D219, D190)

**Lesson 7, `an-action-of-your-own`.** Page 1 explains `def` with the
owner's example, shown as code and not run:

```python
def quick_fly():
    wizard.cast("drevo")
    wizard.move_right(2)
    wizard.move_up(2)
    wizard.move_left(2)
    wizard.move_down(2)
    wizard.cast("drevo")

quick_fly()
```

It takes off, flies round a square and lands where it took off (D215).
Page 2 says what a name does for the reader with the same example (a
line that says *vuelo rápido* where six moves stood); its `saludar`
to try stays. Neither page names a ring. The notebook's `def` gives
`quick_fly()` as its example, and `def_arguments` gives
`two_rings(2, 4)`. Gemini rewrites the two pages from the brief.

**The level `the-rings`.** The ring field and its six rings stay:
row 8, columns 5 and 7, 18 and 20, 33 and 35; the pairs red, blue and
yellow; each pair `up` then `down`.

| | Today | Asked |
|---|---|---|
| start | (4,7) | (4,9) |
| Ilda, the friend, the classmate | (3,7), (3,6), (3,8) | (3,9), (3,8), (3,10) |
| the lines goal | fewer than 18 | fewer than 16 |

The given program, 19 lines, 58 ticks, ends on the white stone (37,9):

```python
wizard.cast("drevo")
wizard.move_right(1)
wizard.move_up(2)
wizard.move_right(2)
wizard.move_down(2)
wizard.move_right(2)
wizard.move_up(6)
wizard.move_right(8)
wizard.move_down(6)
wizard.move_right(1)
wizard.move_up(2)
wizard.move_right(2)
wizard.move_down(2)
wizard.move_right(2)
wizard.move_right(11)
wizard.move_up(2)
wizard.move_right(2)
wizard.move_down(2)
wizard.move_right(2)
```

It goes round the trees by row 3 and straight over the pond. With
`def two_rings():` holding the four lines of a pair and called in the
three places, it is 15 lines: called in one place 21, in two 18. A
`for` round the pair flies into the trees after the first pair. The
solution is the 15 lines; the wrong programs are the given one (19
lines, the goal not met), `a_loop_round_the_pair.py`,
`defined_and_never_called.py`, and a new `the_pair_upside_down.py`,
which flies each pair down and then up from the row over the rings
and misses all six.

Its texts, by Gemini: the card (Ilda) tells the rule as the rule of
broom races, before anything else (the first ring of a pair from below
upward, the second from above downward; a ring flown the other way
does not count), then the field (three pairs; the trees are gone round
by above, the pond is flown over), the 19 lines and the function for
the pair; the hints name the four lines as *arriba, derecha, abajo y
derecha*; the goal's line by 2.4.

### 2.6 The race in two lanes (D220)

**The course.** The start line is on column 6 and the finish line on
column 31, where it is. The wizard's lane is rows 10 to 12, with its
rings on row 11; the racer's lane is rows 6 to 8, with his rings on
row 7; row 9 is free between them. The flags' poles on (31,4), (31,5),
(31,13) and (31,14) leave exactly rows 6 to 12 open at the finish.

**The painting.** `the-race-course/ground.webp` has its start line at
about column 9.8 today. The line is painted at column 6.0, the top and
bottom lines reach it, and the grass where the old line was has no
line. By the house method (D148) Gemini repaints the picture with that
one change, and only the box of the change (about columns 5 to 11,
rows 5 to 15) is brought into the picture, so that every other pixel
and every mask stays as it is. Where four attempts give no clean
line, the box is made by hand from the picture itself: strips of
grass copied along the mowing over the old line, and the line's own
pixels copied to column 6. No line is painted between the lanes. The
report shows the picture and says which of the two made it.

**The level's `race`.** `{"against": "zarek", "lines": 18, "path":
[…], "rings": […]}`, with the wizard's `finish` as today. `path` is
the racer's turning points from his start; `rings` his eight rings in
order. He crosses at the last cell of his path, which is on the
finish line's column, and his tick is his lines + 1 + the cells of his
path. Loading holds that his path flies each of his rings in order
and by its way, stays inside the rows from the one under his rings to
the one over them, names no point twice running, and ends on the
finish's column. He notes `through`
for his rings, with `by`, and they light as he passes.

**The tie.** Equal ticks: the goal `before` is not met, its
parameters say `tie`, and the outcome says under Ilda's count that it
is a tie and the race is flown again (`race.tie`, Gemini).

**The function** of both races:

```python
def two_rings(to_second, to_next):
    wizard.move_up(2)
    wizard.move_right(to_second)
    wizard.move_down(2)
    wizard.move_right(to_next)
```

The distances are the numbers of the moves: from a pair's first ring
to its second 2 or 3, from its second to the next pair's first 4
or 5.

**`the-race`** (Practice 7):

| | Asked |
|---|---|
| start, finish and end | (6,12), (31,12) |
| the wizard's rings, row 11 | columns 7 and 9 (red), 13 and 16 (blue), 21 and 23 (yellow), 27 and 30 (purple) |
| Zarek | starts (6,8); his rings on row 7, same columns and colours |
| Zarek's path | (7,8) (7,6) (9,6) (9,8) (13,8) (13,6) (16,6) (16,8) (21,8) (21,6) (23,6) (23,8) (27,8) (27,6) (30,6) (30,8) (31,8): 41 cells, tick 18 + 1 + 41 = 60 |
| Ilda, the friend, the classmate | (5,9), (5,12), (5,13) |
| goals | the eight rings in order, before Zarek; bonus: fewer than 12 lines |

The solution, 11 lines, 42 ticks of flight, crosses at tick 53:

```python
def two_rings(to_second, to_next):
    wizard.move_up(2)
    wizard.move_right(to_second)
    wizard.move_down(2)
    wizard.move_right(to_next)

wizard.cast("drevo")
wizard.move_right(1)
two_rings(2, 4)
two_rings(3, 5)
two_rings(2, 4)
two_rings(3, 1)
```

The count reads *tus líneas (11) + tu vuelo (42) + la penalización
(0) = tick 53. Zarek: 18 + 42 = tick 60*. The same flight written
without a function is 18 lines and crosses at 60: a tie. The wrong
programs: `eighteen_lines.py` (the tie), `a_pair_skipped.py`,
`the_arguments_turned_round.py`, and a new `the_pair_upside_down.py`
(eight rings against their way).

Its card is the owner's, letter for letter:

> ¡Hagamos una carrera! ¡Pero no basta con llegar el primero! Hay
> penalizaciones si haces un programa muy largo o si te saltas los
> aros. Por cada línea que tengas en tu programa, te haré esperar un
> turno antes de salir, y por cada aro que te saltes, haré que esperes
> cinco turnos antes de cruzar la meta. En caso de empate, se repite
> la carrera. El programa de Zarek tiene 18 líneas, si consigues
> hacerlo más corto, será más fácil ganar a Zarek. Intenta hacerlo con
> una función con argumentos: la función puede pasar dos aros, y con
> los argumentos le dices cómo de lejos está el siguiente aro.

Won, the owner's with the word their sentence lacks: *¡Has ganado! A
veces, es mejor tener un programa corto, y en la pista de carreras
cada tick cuenta.* The hints, the starting code's comments (one for
each instruction, D218) and the learned line are Gemini's, for this
function and these rings. The lesson `arguments-of-your-own` stays;
its sentence about two rings at different distances is true.

**`the-rematch`** (Fix 2: its kind is `fix`):

| | Asked |
|---|---|
| start, finish and end; the figures | as `the-race` |
| the wizard's rings, row 11 | columns 8 and 11 (red), 15 and 17 (blue), 22 and 24 (yellow), 28 and 30 (purple) |
| Zarek | 18 lines; his rings on row 7, same columns and colours |
| Zarek's path | (8,8) (8,6) (11,6) (11,8) (15,8) (15,6) (17,6) (17,8) (22,8) (22,6) (24,6) (24,8) (28,8) (28,6) (30,6) (30,8) (31,8): 41 cells, tick 60 |
| goals | the eight rings in order, before Zarek |

The given program is the race's solution, letter for letter under a
comment of Gemini's. On these rings it flies through the last ring
only: seven missed, tick 88 against 60. The repair changes numbers
alone, `move_right(2)` and the calls `two_rings(3, 4)`,
`two_rings(2, 5)`, `two_rings(2, 4)`, `two_rings(2, 1)`: tick 53
against 60. The wrong programs: `the_race_s_program.py` (the given
one), `a_pair_missed.py`, and `only_the_first_move.py` (the first
move repaired and no call).

Its card is the owner's, letter for letter:

> ¡Zarek pide la revancha, y ha cambiado los aros de sitio! Esta vez,
> te daré un programa que funcionaba para la carrera anterior y lo
> hacía solo en 11 líneas, pero tienes que arreglarlo para que
> funcione con las nuevas posiciones de los aros. A ver si consigues
> ganarle.

Hint 1 stays. Hints 2 and 3 and the won card are Gemini's: no hint
says that a line more loses, and the won card does not say *por un
solo tick*.

### 2.7 The story *La meta*

The scene is the race course with its two lanes; no ring is shown.

| Step | Words | Staging |
|---|---|---|
| start | | The wizard flying on (31,12); the camera about (32,10); Ilda (33,11), the friend (33,13) and the classmate (34,12) stand beyond the finish, facing left; Rinlo on (37,9), facing left |
| 1 | *Cruzas la meta y te posas, y un momento después aterriza Zarek, por segunda vez. Tus compañeros aplauden, e Ilda sonríe.* | The wizard lands; Zarek appears flying on (28,8), flies to (31,8) and lands |
| 2 | Zarek's, as it is | Zarek faces down |
| 3 | Ilda: the two sentences of the black thread as they are, then *{wizard}, hace muchos años que no veía a un alumno de primer curso completar estas carreras en su primer día, ¡y menos aún ganarlas! Puedes quedarte la escoba, la necesitarás para entrenar como nuevo miembro del equipo de carreras de escoba de Arvelia.* | Ilda walks to (32,12), beside the wizard |
| 4 | as it is | The wizard walks (31,10), (35,10), (35,9) and faces right; the friend to (34,9); the classmate to (36,10) |
| 5 | The friend: *Es él, el que oímos por la grieta. No sé cómo se llama. Pero ahora estoy más seguro que nunca: la otra voz no era de ningún alumno.* | |
| 6 | as it is | |

Steps 1, 3 and 5 are the owner's words; *seguro* agrees with the
friend as the texts do for them. The story bible gains the school's
broom racing team and the wizard's place in it. Where a cell does not
give what its sentence asks (everyone who claps is in the picture at
step 1; nobody walks through a pole), the sentence rules.

### 2.8 Tips (D221)

- **No button.** `waiting.go`, `#waiting-go` and the wait's `go()` and
  `onOffer` are not there.
- **When a tip is due at once.** The page keeps the scene last shown,
  for the visit. The course file names the scene of every level and
  every story, written by the build, so that the route knows a
  screen's scene before it fetches anything of it. A wait shows a tip
  with no grace when it is the first wait of the visit, or when its
  screen has a scene and it is not the scene last shown. A lesson, the
  map, the start, the notebook's pages and the settings have no scene:
  they change nothing and are waited for as today (two seconds of
  grace, then a tip). Tips are for a child who has begun: a newcomer
  gets the opening, as today.
- **When the screen opens.** A tip stays up for its reading time,
  `readingMs` of its words (D175: 0.8 s and 50 ms a character, 5 to 10
  seconds for today's tips), never more than `TIP_TIME`. A screen that
  is ready opens when the tip up has had that time; one that is not
  gets the next tip after `TIP_TIME`, as today.
- **A picture for each tip.** Each of the ten tips has a picture of
  the thing it tells (the notebook open at its tab, the hints' button
  and a hint, the timeline, the map…), in each language, since the
  page's words are in it: small (about 640 px wide, webp, under
  40 KB), made by a spec that is run on demand from the game's own
  page and kept with the content. The waiting view shows the picture
  over the tip's words and keeps its room while it comes, so that the
  words do not jump; the warm-up fetches the next tip's picture in
  idle time. A test holds that every tip has its picture in every
  language, and `docs/dev/` says how they are remade when the page
  changes. Where a tip's words name something its picture cannot show,
  the picture shows the nearest true thing; no tip's words change.
- `kydux.tips-off` stays, for the tests.

### 2.9 The load, measured

The owner's question: *si todo corre en local, ¿por qué tarda más si
la conexión es mala?* What is known: nothing runs on the server, but
every file is fetched from it. `deploy/nginx-kydux.conf` lets the
browser keep `/assets/` for good and makes it ask again for everything
else on every load (`expires epoch`): Python's own files (13 MB), the
world, the content's texts and pictures (13 MB). The answer to each
question is short when nothing changed, but it is one trip to the
server for each file, and on a slow connection the trips are the wait.
The music's themes are notes in small files (7 to 13 KB), played by
the page.

What is not known is how many trips a screen costs, which wait for
which, and whether the music's playing costs time of its own. A spec
run on demand measures it against the built game, served by a small
server of the test's own that sends what the nginx file sends:

- for the start, a story, a lesson and a level of each chapter: the
  requests, their bytes, which wait for which, the time to the screen
  shown and the time to Python ready;
- with an empty cache and with a full one; on a fast network and on a
  slow one (throttled: 400 ms a trip, 1 Mbit/s);
- at the commit before the music (`c66cdee^`) and now, with the
  processor's time while a theme plays.

The report gives the table and the answer in plain Spanish. A cause
inside the page that is small (a file asked for twice, a fetch that
waits for another without need) is put right in this piece and said.
Anything that changes what the server sends (the content kept by the
browser under the build's stamp, as the world is) is proposed in the
report with its numbers and not built: the server's file is the
owner's to install.

### 2.10 The texts (Gemini)

One brief, `tools/write/briefs/sprint-44-chapter-4.md`: the bible, the
course, chapter 4's texts as they are, the owner's comments whole,
this plan's sections 2.1 and 2.4 to 2.7, and the rules: no *manera* or
*way* of a level (D204), nothing told that the child does not need
yet, a metaphor only where an idea is first explained, `<` and `>`
alone (D212), D224's two rules, and *turno* nowhere but in the owner's
card. It asks for: the sentences of 2.1; lesson 7's two pages; the
texts of *Los aros*; the hints, comments and learned line of *La
carrera*; the comment, hints 2 and 3 and the won card of *La
revancha*; `blocked.ring`, `blocked.ring_way.*`, `race.tie`, the
goals' lines; the notebook's two examples; the English of everything,
the owner's sentences among them.

The programmer reads the drafts, corrects them and says in the commit
what was corrected. The words this plan gives letter for letter are
not sent to Gemini to be written again.

### 2.11 The walkthrough

`npm run walkthrough -- 04-the-broom`, each level in one arrangement
(D216), kept in `drafts/` under the report's date.

### 2.12 The changed texts, for the owner

A page in `drafts/`, made from `git diff` of the Spanish texts between
`e2414b0` and this sprint's last commit: for each text *Antes:* and
*Ahora:*, with the picture of where it is read; *Antes: no existía.*
for a new one and *Ahora: ya no se muestra.* for one that is gone. The
comments of 2.2 are in it line by line.

## 3. The pieces

### 3.1 The words about knots and straw (D224, 2.1)

- **Content.** The chapter's brief (2.10) is written and run here for
  everything it lists, and its drafts are kept for 3.4 to 3.6. This
  piece enters the sentences of 2.1 in both languages, and what the
  rereading finds.
- **Tools.** `tools/write/rules.md` carries D224's two rules.
- **Tests.** A content test holds that no Spanish text of the game
  says *desat-* of a broom or ends *la paja* with a verb of finishing
  or doing (the two patterns of D224, as a list in the test).
- **Check.** `ci/check.sh`; `chapter-4.spec.ts`.

### 3.2 The code's letter and the comments (D223, 2.2)

- **Page.** The two faces' files, each with its origin, author and
  licence; the `@font-face`s, the table of the three candidates,
  `--mono` and `--mono-stretch`; the setting `codeFont` and its
  reading; the choice `settings-code-font` under `?debug` and its
  words in both languages; `FONT_SIZES`, `DEFAULT_SETTINGS.fontSize`
  and the reading of a saved size; the hanging indent of wrapped lines
  in the editor.
- **Content.** The starting codes of `the-nearest-broom` and
  `the-brooms-in-the-straw` as 2.2 gives them, in both languages; any
  other comment cut by hand, joined.
- **Documents.** `docs/dev/architecture.md` where it tells of the
  page's look and of what `?debug` offers; a `SOURCE.md` next to each
  face, as the art has, with the licence's text.
- **Tests.** The test of D218 on one `#` line a sentence; a browser
  test that the editor's font is the bundled Inconsolata at 16 where
  nothing is chosen and no request leaves the page's origin; that
  under `?debug` the settings offer the three candidates, each sets
  the editor's face, width and size at once and stays after a reload,
  and that without `?debug` the choice is not offered; that a wrapped
  comment of an `if`'s body starts under its `#`; the settings' sizes;
  the store's test of `codeFont` and of a saved size.
- **Check.** `ci/check.sh`; `level.spec.ts`, `settings.spec.ts`,
  `chapter-4.spec.ts`. A sheet of the straw's starting code in
  the real page at 1280 and at 1024 wide, in each of the three
  candidates, with the characters a line of the editor holds in each,
  goes in the report.

### 3.3 Cards (D222, 2.3)

- **Page.** `ui/cards.ts` (the focus without scrolling, the scroll at
  0) and `ui/level.ts` (the start card closed at a button's click).
- **Tests.** A browser test in a window 600 px high: the start card
  and the win card show their title when they open; *Ejecutar*
  clicked with the start card open runs the program and the card is
  gone; so with *Pista* and the notebook; `?` opens and closes.
- **Check.** `ci/check.sh`; `level.spec.ts`, `cards.spec.ts`.

### 3.4 A ring's way and colour, lesson 7 and *Los aros* (D219, 2.4, 2.5)

- **World.** `way` and `colour` on a ring; the checks at loading; the
  move against the way and `wrong_way`; `missed`; their tests.
- **Page.** `wrong_way` (the shake, the thought, the sound); the ring
  drawn by its colour; the arrow under `?debug`; `blocked.ring`,
  `blocked.ring_way.*`.
- **Tools.** The tool that paints the hoop, and the four pictures.
- **Content.** Lesson 7's two pages and the notebook's two examples;
  `the-rings` whole (level, solution, wrong programs, texts). The
  rings of `the-race` and `the-rematch` get their `way` and `colour`
  here in their present places, with the least change to their
  programs that keeps the levels' tests green until 3.5 and 3.6
  rebuild them.
- **Documents.** `docs/dev/course.md` (lesson 7, *Los aros*); the
  world's account of things and events.
- **Tests.** The world's; the level's solution and wrong programs;
  the lesson's; the chapter's spec through *Los aros*, with a pair
  flown the wrong way seen and said.
- **Check.** `ci/check.sh`; `chapter-4.spec.ts`, `levels.spec.ts`,
  `lesson.spec.ts`. The ring field's contact sheet (D208).

### 3.5 The race in two lanes (D220, 2.6)

- **Tools.** The race course's picture with its start line on
  column 6, by 2.6; its masks and `art.json` checked untouched outside
  the box; `map.txt` where a cell's kind changes; the sweep clean.
- **World.** `race.rings`; the racer's tick at his path's end; the
  checks at loading; his `through`; the tie in `before`.
- **Page.** `raceOf` and the racer's rings lighting; `race.tie` under
  the count.
- **Content.** `the-race` whole (level, solution, wrong programs,
  texts, the owner's card and won card).
- **Documents.** `docs/dev/course.md` (*La carrera*).
- **Tests.** The world's (a racer who misses his ring, leaves his
  lane or ends off the finish column does not load; the tie); the
  level's programs with their ticks (53, 60, the tie); the chapter's
  spec through the race, won and tied.
- **Check.** `ci/check.sh`; `chapter-4.spec.ts`, `levels.spec.ts`.
  The race course's contact sheet (D208).

### 3.6 *La revancha* as a fix, and *La meta* (2.6, 2.7)

- **Content.** `the-rematch` whole, its kind `fix`; `the-finish`'s
  `story.json` and both texts; the bible's line about the team.
- **Documents.** `docs/dev/course.md` (Fix 2, the story) and every
  document that tells the chapter's kinds and numbers; the course
  book made again.
- **Tests.** The level's programs with their ticks (88, 53); the
  kinds' numbers; the story's test of its staging; the chapter's spec
  to its end.
- **Check.** `ci/check.sh`; `chapter-4.spec.ts`, `levels.spec.ts`,
  `story.spec.ts`, `map.spec.ts`.

### 3.7 Tips (D221, 2.8)

- **Tools.** The build writes each level's and story's scene in the
  course file. The spec that makes the tips' pictures, run on demand.
- **Page.** `ui/waiting.ts` without its button, with the reading time
  and the picture; `route()` and `show()` with the scene last shown
  and the tip due at once; the warm-up's picture.
- **Content.** The twenty pictures.
- **Documents.** `docs/dev/architecture.md`'s account of how a screen
  is shown; `docs/dev/dev-environment.md` on remaking the pictures.
- **Tests.** The units of the wait (the first wait, a new scene, the
  same scene, a screen with no scene, a newcomer; the reading time;
  no button); a browser test from one level to the next of the same
  scene (no tip on a quick load) and to a level of another scene (a
  tip with its picture, then the level by itself); every tip's
  picture in every language.
- **Check.** `ci/check.sh`; `waiting.spec.ts`, `start.spec.ts`,
  `story.spec.ts`, `level.spec.ts`.

### 3.8 The load, measured (2.9)

- **Tools.** The spec and its server, run on demand; how to run it in
  `docs/dev/dev-environment.md`.
- **Page.** Only what 2.9 lets this piece put right, each thing said
  in the commit with its numbers before and after.
- **Check.** `ci/check.sh`; the specs of what was touched.

### 3.9 The whole check, the walkthrough, the changed texts and the report

`docs/dev/plan.md` names this sprint's decisions in its chapter 4. The
whole `ci/check.sh --e2e`, in a copy, with Playwright's own server on
4173. Then, in `drafts/`, never committed:

- chapter 4's walkthrough, `recorrido-capitulo-4-<date>.es.md`, each
  level in one arrangement;
- the page of the changed texts before and now, as 2.12;
- the contact sheets of the ring field and the race course, and the
  race course's picture whole, with the way its start line was made;
- the sheets of the three candidates of the code's letter in the real
  page (3.2), with the address that opens a level under `?debug` and
  where the choice is, for the owner to try them; and the ten tips
  with their pictures in Spanish;
- the report in Spanish: what was built piece by piece; every choice
  the plan left and how it was taken; every cell of 2.5 to 2.7 that
  moved; what Gemini's drafts needed corrected; what the rereading of
  3.1 found; the load's table and its answer in plain words, with what
  was put right and what is proposed for the server; and how the owner
  sees a tip at a new scene on their own server, step by step.

## 4. Gemini images

At most six: up to four attempts at the race course's start line
(2.6), and up to two at the rings' colours if the tool's paint is poor
(2.4). The tips' pictures are the game's own. Chapter 4 stands at 29
of its 50, and ends this sprint at 35 at most.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

Read first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-44.md (this plan, whole), docs/dev/sprint-43.md (what
you built last), drafts/recorrido-capitulo-4-2026-11-13.es-comments.md
(the owner's ten comments, in their words), and the memory notes
kydux-two-agents, kydux-sprint-43-state, kydux-designer-review-43,
kydux-designer-sprint-44-plan and kydux-checks-per-piece. The
designer's commits after yours (989846d to the plan's last) fix three
texts and enter this plan and its decisions (D219 to D224, with D187,
D189, D190, D214 and D218 brought to them): read them with
git log -p 989846d..HEAD before you start.

Build sprint 44 whole: pieces 3.1 to 3.9 in order, one local commit
each; before each commit ci/check.sh and the browser specs the piece
touches green, and the whole ci/check.sh --e2e once before the last
commit, in a copy with Playwright's own server on 4173; never a push,
never a timer, never a deploy: nothing is released until the owner is
happy with chapter 4. Never stop or build into the servers on ports
443 and 5173, and stop your own preview when you are done. The image
key is read from ~/.config/kydux/secrets.env by the tools and never
enters a file of the tree, a commit, a log or the report.

The eleven things the owner will look for:
(1) a pair of rings flown the first upward and the second downward,
    in every program of the chapter, and a ring flown the other way
    that shakes, says so and counts as missed;
(2) the rings in pairs of a colour, close together, a longer stretch
    between pairs;
(3) the race in two lanes, Zarek through rings of his own, nobody
    crossing anybody; the card in the owner's words; a tie flown
    again;
(4) La revancha as Fix 2: the race's 11 lines given, only numbers to
    repair;
(5) lesson 7 with quick_fly() and no ring;
(6) La meta: who claps is seen, the broom given for the racing team,
    the friend's line;
(7) no broom untied, only knots; no sentence that does or ends "la
    paja";
(8) comments never cut by hand, wrapped lines hanging under their
    own indentation; three candidates for the code's letter to try in
    the real page, chosen in the settings under ?debug: Inconsolata
    at 16 (the one in use where nothing is chosen), Noto Sans Mono
    semi-condensed at 14 and condensed at 14;
(9) no button on the waiting view; a tip with its picture at the
    first load and at every new scene, the screen opening by itself
    when the tip has had its reading time;
(10) a card open at its top, and the start card closed by any button
    of the page;
(11) the load measured, and the owner's question answered in plain
    Spanish.

The plan decides everything; where it does not, take the smallest
choice that keeps its intent and say it in the commit. Where a cell
of 2.5 to 2.7 does not give what its sentence asks, the sentence
rules. The owner's sentences are entered letter for letter and never
sent to Gemini to be written again; Gemini writes the rest from the
brief, and you correct its drafts and say what you corrected. Never
edit content while a browser run is going. Every document and comment
in the present. Before git add, read git diff of each file and stage
only your own hunks; commit promptly.

Hand over, in drafts/ and never committed: the walkthrough of chapter
4, the page of the changed texts before and now (2.12), the contact
sheets and pictures 3.9 lists, and the report in Spanish as 3.9 asks.
Write your memory note kydux-sprint-44-state, and end with the prompt
for the designer's review in English, in a code block.
```
