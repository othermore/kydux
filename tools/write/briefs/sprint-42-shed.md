---
outputs:
  - content/levels/the-shed/text.en.json
  - content/levels/the-shed/text.es.json
  - content/levels/the-brooms-on-the-wall/text.en.json
  - content/levels/the-brooms-on-the-wall/text.es.json
  - content/levels/the-brooms-in-the-straw/text.en.json
  - content/levels/the-brooms-in-the-straw/text.es.json
  - content/levels/the-check/text.en.json
  - content/levels/the-check/text.es.json
  - content/lessons/less-or-greater/en.md
  - content/lessons/less-or-greater/es.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - docs/dev/sprint-42.md
  - content/stories/the-morning-after/text.*.json
  - content/levels/the-broom-at-your-feet/text.*.json
  - content/levels/the-shed/text.*.json
  - content/levels/the-brooms-on-the-wall/text.*.json
  - content/levels/the-brooms-in-the-straw/text.*.json
  - content/levels/the-check/text.*.json
  - content/lessons/the-broom/*.md
  - content/lessons/lists/*.md
  - content/lessons/for-each/*.md
  - content/lessons/checking-each/*.md
  - content/lessons/true-or-false/*.md
  - content/lessons/if/*.md
  - content/lessons/else/*.md
  - content/lessons/the-two-coordinates/*.md
  - content/lessons/the-distance/*.md
---
Write again the texts of four levels of the broom shed, in chapter 4, *The broom*, and
write a new lesson that comes before the third of them, in English and in Spanish: the
files listed. The plan that reshaped them, sprint 42, is given above in full: its
sections 2.2, 2.3 and 2.4 say what each level now is, cell by cell, and what each text
must say. Where this brief and the plan differ, this brief wins. The texts of these
levels as they were are given for their voice and their shape; many of their facts are
old.

## The owner's words, which this sprint follows

The game's owner read the shed's levels and wrote, in Spanish, four comments and three
answers. Their words decide everything below:

- On *El cobertizo*: *No hay que hablar de las maneras en ningún lugar de ningún
  capítulo. Eso es una cuestión de como está programado nuestro mundo, pero el usuario
  no debe saberlo. El usuario debe saber que el número de escobas cambia cada vez, así
  que hay que programarlo para contarlas, no vale contarlas a mano y decir el número.
  Además, no quiero complicar con dos zonas en este primer nivel. Las que están
  colgadas se ven inmediatamente, de modo que solo hay que preguntar cuantas son las que
  no están colgadas. Y en este punto si el personaje intenta llegar a la pared (a la zona
  de la pared) debería fallar diciendo: para contar las escobas en el suelo, mejor me
  quedo cerca de donde están tiradas. Y quitamos las otras referencias y solo esperamos
  el número de escobas que hay en el suelo.*
- On *Las escobas de la pared*: *Lo que hay que decir es que el número de escobas y su
  posición en la pared puede ser distinta cada vez, así que hay que hacer el programa
  para que valga en todos los casos. Además, no me gusta lo de caminar hasta la casilla
  8,6. No creo que eso importe. Lo que importa es recorrer todas las escobas. Hay que ir
  viendo su posición y moviéndose hacia la izquierda el número de casillas que faltan,
  usando la función que te da la distancia a un objeto (ir viendo la distancia al
  siguiente).* And: *Las escobas deben estar colgadas en lugares aleatorios y para
  resolverlo hay que irse a un extremo y iterar por las escobas, moviendose la cantidad
  definida con la funcion que te da la distancia a un objeto y, cuando estás al lado,
  desatándola. No hace falta llegar a la última casilla, pero sí hay que partir de la
  primera para asegurar que se va en una sola dirección hasta el final de la lista (el
  find_all nos las da ordenadas de más cercana a más lejana).*
- On *La revisión*: *No quiero que haya que caminar hasta la casilla 11,6. Hay que
  aplicar el mismo concepto que en la primera prueba: empezar en un extremo e ir
  iterando por las escobas, viendo la distancia hasta la escoba y moviéndose esos pasos,
  hasta llegar a la última.*
- On the row under the pegs: *La fila 5 debe ser pisable/transitable ... Y la fila 5 es
  desde la que se accede a las escobas colgadas, y desde donde se hace todo (el find
  para las escobas colgadas y te vas moviendo)*; and *la búsqueda de las escobas del
  suelo la puedes iniciar en la fila 6 y encontrar escobas en esa fila o las
  inferiores*.
- On the straw's level: *dije que deben estar ordenadas por distancia, pero el programa
  me acabo de dar cuenta de que tendra que ser capaz de moverse en las 4 direcciones
  porque podemos ir a la izquierda a coger una escoba que está arriba y luego tener que
  volver a la derecha a coger una escoba que está más abajo... De modo que hay que ver
  qué número es más grande para hacer movimientos a la izquierda o la derecha. Para que
  el niño sepa hacer eso habría que explicarle las comparaciones menor y mayor y
  recordárselo y hacerle un poco entender cómo se comportan los números en las
  coordenadas y que cambios hay que hacer de izquierda a derecha y cuáles de derecha a
  izquierda.*

## The rules of this brief

- Never *manera*, *maneras*, *way*, *ways* for the level's arrangements, nor any word
  for them: the child is never told that a level is played several times. Each level's
  `text.<lang>.json` keeps the key `changes`, the sentence the start card shows of what
  may differ at each run: copy it exactly as it is in the file given, letter for
  letter. Where another text needs to say what changes, it says it in the level's own
  words (how many brooms, on which pegs), never as "ways".
- No text names a cell for the child to walk to, nor asks to end on one.
- The wizard stands under the pegs, by the wall, to reach a hung broom (never "two
  rows below", never "on the straw"); and on the floor away from the wall to find the
  lying ones.
- A metaphor only where an idea is first explained; an idea taught only where it is
  needed; never explain again what the course has taught: `find_all`, `len`, `for`,
  `distance_to` (chapter 2, lesson *the-distance*), `position.x` and `position.y`
  (lesson *the-two-coordinates*), `if` and `else` (chapter 3), `==` and `True` /
  `False` (lesson *true-or-false*) are known and only recalled, in one sentence at most.
- The intros of *Las escobas de la paja* and of *La revisión* are the owner's own
  words. Keep every sentence of them that is still true, as it is; write again only
  what the new levels make false (in the straw, the brooms are no longer all down and
  to the left; in the check, the program does not always stop at the first broom).
- The speaker of every intro and outro is `{friend}`, as now; `{mate}` may be named.
  Keep the files' shape: `title`, `goals`, `starting_code`, `hints` (three), `intro`,
  `outro`, `learned`, `changes`, in that order.

## Each level

### `the-shed`, *El cobertizo* (plan 2.2)

One idea: `find_all` gives a list and `len` counts it. The level asks how many brooms
lie on the floor; the hung ones are seen at once and are not counted. From where the
wizard stands, on the floor, `find_all("broom")` finds the brooms lying on the floor,
also those hidden in the straw, and none of the hung ones. If the wizard walks up to the
wall it is stopped, with the owner's words, which the game says by itself: do not write
them. Goals: write `goals` as two lines, the first an empty string `""` (the developers
fill it), the second the bonus that uses `print`, as it is. The intro no longer speaks of
two places: it asks how many lie on the floor, says that some are hidden in the straw,
and that the hung ones are in plain sight. The starting code is comments only: find the
brooms on the floor with `find_all`, show the list with `print`, say how many with `say`
and `len`. Hints: from the idea (the hung ones need no counting; `find_all` finds the
floor's, even under the straw) to the line. The learned line says the thing itself.

### `the-brooms-on-the-wall`, *Las escobas de la pared* (plan 2.3)

The brooms hang on different pegs each time, with gaps between them. Goals: two lines,
the first exactly as it is in the file given (*No dejes ninguna escoba colgada con
nudo.* / *Leave no hanging broom knotted.*), the second the bonus that uses `for`, as it
is. The program goes up to the row under the pegs, then to one end of that row, because
the list comes nearest first and from an end the walk goes one way only; then for each
broom of the list it asks how far it is with `distance_to`, walks that many steps,
and unties it. The level's solution, which no text may write out:

```python
wizard.move_up(3)
wizard.move_right(4)
brooms = wizard.find_all("broom")
for broom in brooms:
    steps = broom.distance_to(wizard)
    wizard.move_left(steps)
    broom.untie()
```

The intro recalls `distance_to` from chapter 2 in one sentence. The two brooms lying on
the boards are left for later. The starting code is comments that lead through the
steps without writing them. Hints: from the idea to the line; the third may say that
the steps are the broom's `distance_to` and that a broom hung just over the wizard is 0
steps away.

### `the-brooms-in-the-straw`, *Las escobas de la paja* (plan 2.4)

The brooms on the floor come nearest first, and the next one may be on any side of the
wizard: left or right, up or down. For each broom: compare its `x` with yours to know
whether to walk left or right, and take the smaller number from the greater for the
steps; the same with `y` for up and down; then untie it. The level's solution, which no
text may write out:

```python
brooms = wizard.find_all("broom")
for broom in brooms:
    if broom.position.x < wizard.position.x:
        wizard.move_left(wizard.position.x - broom.position.x)
    else:
        wizard.move_right(broom.position.x - wizard.position.x)
    if broom.position.y < wizard.position.y:
        wizard.move_up(wizard.position.y - broom.position.y)
    else:
        wizard.move_down(broom.position.y - wizard.position.y)
    broom.untie()
```

Goals: two lines, the first that no broom is left knotted, the second the bonus that
uses `x`. The second hint recalls the new lesson: a smaller `x` is to the left, a smaller
`y` is higher up. The starting code's comments lead through the loop's steps without
writing its lines. No text names a cell.

### `the-check`, *La revisión* (plan 2.3)

Every broom hangs again; some still have a knot. The starting code is the wall's
solution above, given whole, under one comment of yours on its first line (write the
code exactly as above after it). It stops with an error at the first broom without a
knot, wherever that broom hangs: not always the first. The solution puts
`broom.untie()` under `if broom.knotted:`. Goals: three lines, that no broom is left
knotted, that the program ends with no error, and the bonus that uses `knotted`. Hints:
the idea, the attribute, the `if` inside the loop with its indentation; none names a
cell or a step to the right.

## The new lesson, `less-or-greater` (plan 2.4)

The friend teaches it, before *Las escobas de la paja*. Title: one short phrase. Three
pages, each with its block the child runs, in the shape of the lessons given (the first
page with the `#` title, the next ones after `---` with a `##` title, each block as
```` ```python try ````). The blocks' names and strings are translated in Spanish, as a
lesson's blocks are (`mi_x`, `escoba_x`, `"izquierda"`). What each page says is in the
plan's 2.4, word for word in what it must say:

1. `<` and `>` compare two numbers and answer `True` or `False`, as `==` does (recalled
   in one sentence). The sign's open side is towards the greater number. When the two
   are equal neither is the smaller: `4 < 4` is `False`. Its block prints `3 < 5`,
   `5 < 3`, `5 > 3` and `4 < 4`.
2. `x` is counted from the left and `y` from above (recalled in one sentence); so `x`
   grows with each step to the right and shrinks with each step to the left, and `y`
   grows with each step down and shrinks with each step up. A broom whose `x` is smaller
   than the wizard's is to its left; greater, to its right; a broom whose `y` is smaller
   is higher up; greater, lower down. That `y` grows downwards is what surprises: say it
   plainly. Its block sets the wizard's `x` to 9 and the broom's to 6 and prints whether
   the broom's is smaller; the page says that `True` means the broom is to the left, and
   asks the child to put 12 in the broom's and run it again.
3. A move takes 0 steps or more: `wizard.move_left(-3)` is refused, and the page gives
   the game's words for that refusal, as the child reads them: *`move_left` no se usa
   así. Prueba de esta forma: `wizard.move_left(3)`.* / *`move_left` is not used like
   that. Try it like this: `wizard.move_left(3)`.* So the program looks first and subtracts
   after, always the smaller from the greater, with the `if` and `else` of chapter 3
   (recalled in one sentence). Its block: the wizard's `x` 9, the broom's 6; if the
   broom's is smaller, print "left" and the wizard's less the broom's, else print "right"
   and the broom's less the wizard's. The page asks the child to try 12 and then 9: with
   9 the `else` runs and the steps are 0, and a move of 0 steps walks nothing. Up and
   down go the same way with `y`, said in two sentences and with no block of their own:
   a smaller `y` is up, and the steps are the wizard's `y` less the broom's.

The lesson names no `<=`, `>=`, `!=` or `abs`, and uses no metaphor after the sign's open
side.
