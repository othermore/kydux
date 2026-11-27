---
outputs:
  - content/lessons/the-cells/en.md
  - content/lessons/the-cells/es.md
  - content/lessons/where-i-am/en.md
  - content/lessons/where-i-am/es.md
  - content/lessons/waiting/en.md
  - content/lessons/waiting/es.md
  - content/lessons/true-or-false/en.md
  - content/lessons/true-or-false/es.md
  - content/lessons/if/en.md
  - content/lessons/if/es.md
  - content/lessons/else/en.md
  - content/lessons/else/es.md
  - content/lessons/repeat/en.md
  - content/lessons/repeat/es.md
  - content/lessons/while/en.md
  - content/lessons/while/es.md
  - content/lessons/kirra-and-osto/en.md
  - content/lessons/kirra-and-osto/es.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/the-cells/es.md
  - content/lessons/where-i-am/es.md
  - content/lessons/true-or-false/es.md
  - content/lessons/if/es.md
  - content/lessons/else/es.md
  - content/lessons/repeat/es.md
  - content/lessons/while/es.md
  - content/lessons/kirra-and-osto/es.md
---
Write chapter 3's nine lessons again, in English and Spanish. The owner, who read them
all, wrote several of their pages by hand: those texts are given below between the marks
FIXED and END, in Spanish, and go into the Spanish file word for word, with only the
wizard's braces as said; the English file says the same in natural English. The owner's
pages are the model of how the whole chapter must speak to a child, so write the others
in the same voice. The lessons' present Spanish is given as context: it is what the
owner corrected, and it may be used wherever this brief does not change it.

## How the chapter speaks

- A text the child reads says what a friend would say, in the order a child needs: the
  thing first, then the word for it, then an example with numbers, and nothing about how
  the game is built.
- A program *looks at* an attribute, *sees* where it stands, *checks* its coordinates. It
  never *asks*: in Spanish *preguntar* is out, in every form (*preguntar dónde estoy*,
  *preguntarle a la puerta*, *pregúntalo*); say *mirar*, *ver*, *consultar*, *comprobar*
  (*ver nuestra posición*, *mirar nuestras coordenadas*, *buscarnos en el mapa*). In
  English likewise *look at*, *see*, *check*, never *ask*.
- A cell is named by its two numbers, the first `x` from the left and the second `y` from
  the top, written `(x, y)`, both from 0, and the first lesson calls this a system of
  coordinates.
- The tunnel is dark, not enchanted: the word *encantado*, *enchanted*, is in no text. An
  *encantamiento de ocultación* in the owner's own text is said of the things one cannot
  see on the map, and stays.
- No text says that a level is played in several ways, that the friend whispers or speaks
  low (*hablo bajito*), or that the game waits: what the game does is shown, not told.
- The friend's reasons are said, and what the friend does not know is said as a guess
  (*creo que*).
- A page holds one idea. A lesson that needs three ideas takes three pages.

## The format

A lesson's Markdown as rules.md says, with this for its code: **any page may hold a block
fenced ```python try**, and every page that shows code shows it so. The child sees that
block in an editor with a *Run* button on the page itself, changes it and runs it, and
under it reads what it printed, or the cell the wizard ended on. It runs in the level the
brief names for the lesson, at that level's start, with nothing shown moving. So each
block must make sense there, as the facts below say. A page's last block is the only one
on the page. The last page of each lesson holds one, and the button under it leads to the
level; the level never starts with it.

The Spanish is Spanish from Spain, for a child. The first page opens with the `#` title;
pages are separated by a line with only `---`; the others open with a `##` heading.

## The lessons

### `the-cells`, *The cells* / *Las casillas*: run in the level `the-doors-corridor`

Three pages. Page 1, FIXED:

Este mapa que te he dado es el mapa del niño travieso. Es un plano de todo el castillo, y
siempre nos muestra lo que necesitamos ver en ese momento, si decimos el hechizo
correcto.

Funciona con un sistema de coordenadas: cada casilla del plano se nombra con dos números.
El primero es la x y el segundo la y, y se escriben (x, y). La x cuenta desde la izquierda
hacia la derecha, y la y desde arriba hacia abajo. Y, muy importante: empiezan en el 0.

Así que la casilla de arriba a la izquierda siempre será la (0, 0). La que está justo a su
derecha es la (1, 0) y la que está justo debajo es la (0, 1).

END. Page 2, *Contar los pasos*, FIXED:

Lo importante es que esos números nos dicen cuántos pasos hay entre dos casillas. Por
ejemplo, entre la (0, 0) y la (2, 0) hay dos pasos. Un paso a la derecha suma uno a la x.
Un paso hacia abajo suma uno a la y. Si damos un paso a la izquierda restamos uno a la x,
y si damos un paso hacia arriba restamos uno a la y.

Así que para ir desde la casilla (5, 12) hasta la (9, 9), tu {mago|maga} tiene que caminar
cuatro pasos a la derecha y tres arriba. Solo tienes que contar cuántos pasos hay de un
número a otro.

END. Page 3, *Pruébalo*: the map only works with the word in its corner, *orvim*; cast
with the wand it opens the plan of this corridor, with our three figures on it; it stays
open until you close it. Block: `wizard.cast("orvim")`.

### `where-i-am`, *Where I am* / *Dónde estoy*: run in the level `the-dark-tunnel`

Three pages; there the wizard stands on cell (15, 3), inside the dark tunnel. Page 1,
FIXED:

Aquí no se ve nada, pero eso no nos impide saber dónde estamos. Como tiene el mapa del
niño travieso, tu {mago|maga} siempre sabe en qué casilla está. Puedes verlo abriendo el
mapa, pero si necesitas verlo dentro del programa, puedes usar `wizard.position`.
`position` es un atributo de `wizard`, y guarda dos números juntos, como `(15, 3)`.

También podemos ver la posición de algún objeto o cosa que haya en el escenario. Por
ejemplo, si tenemos una llave, `key`, podemos ver su posición usando `key.position`.

END. A block that prints `wizard.position` closes the page. Page 2, FIXED:

A veces no podemos ver algunas cosas en el mapa (quizás hay un encantamiento de
ocultación, o quizás son muy pequeñas). Sin embargo, usando el atributo `position`, el
programa ve exactamente dónde están las cosas, incluso aunque tú no lo veas en el mapa.

END. Its heading: *Lo que no se ve* / *What cannot be seen*. Page 3, *Pruébalo*, FIXED:

Vamos a mirar en qué casilla estamos ahora mismo, aquí dentro del túnel.

END. Block: `print(wizard.position)`. It prints `(15, 3)`.

### `waiting`, *Waiting* / *Esperar*: run in the level `the-tunnel-exit`. New.

Two pages. Page 1, FIXED opening:

Hasta ahora hemos hecho programas en los que nuestro personaje siempre hacía algo, pero a
veces nos hace falta hacerlo esperar. Por ejemplo, en la siguiente pantalla, nuestro
personaje tiene que esperar a que Dask pase antes de poder cruzar. Para esperar se usa el
método `wizard.wait()`.

END. Go on, in the same voice, from what the present lesson *If* says of it: a tick is a
moment of the game in which everything else moves; `wizard.wait()` waits one, and
`wizard.wait(2)` waits two. Page 2, *Pruébalo*: try it: wait two ticks and then walk nine
cells to the right. Block, exactly: `wizard.wait(2)`, then `wizard.move_right(9)`. Say that
under it they will read the cell the wizard ended on, and that it can be changed and tried
again.

### `true-or-false`, *True or false* / *Verdadero o falso*: run in the level `by-the-statues`

Five pages, one idea each, slowly and in order, as the owner laid them out. There Dask
stands still looking up, and the wizard looks down. Each page but the first says its
example in words before its block.

1. *Otros atributos* (the title page, `# Verdadero o falso`, says it first). An attribute
   may hold something other than two numbers: `dask.facing` holds a word, a string, that
   says which way Dask looks, `"up"`, `"down"`, `"left"` or `"right"`; `wizard.facing` the
   same for the wizard. Block: `print(dask.facing)`.
2. *Comparar*. We can compare two things to see whether they are the same, with `==`; the
   answer can only be yes or no, which in programming are called `True` and `False`. A
   single `=` gives a value a name and `==` compares: said once, here. Block:
   `print(3 == 3)` and `print(3 == 4)`.
3. *Comparar atributos*. Two attributes compared: whether Dask and the wizard look the same
   way, `dask.facing == wizard.facing`; an attribute and a literal, a value written just as
   it is: whether Dask looks up, `dask.facing == "up"`. Block:
   `print(dask.facing == wizard.facing)` and `print(dask.facing == "up")`.
4. *Decir lo contrario*. `not` before an expression says the opposite: if Dask looks up,
   `not dask.facing == "up"` is `False`. Name what the two sides make, an expression, beside
   the easy word, here or on page 2. Block: `print(not dask.facing == "up")`.
5. *Pruébalo*. A small program the child changes: print whether Dask looks down, then
   whether he does not. Block: `print(dask.facing == "down")` and
   `print(not dask.facing == "down")`.

Never *darle la vuelta* (the owner: *decir lo contrario*).

### `if`, *If* / *Si*: run in the level `by-the-statues`

Three pages. Page 1: the condition, its colon and its four spaces, as the present lesson
says it, without any question. Page 2, tied to the level that follows, in words: if Dask
looks up, go down two cells. Block, exactly:

```
if dask.facing == "up":
    wizard.move_down(2)
print(wizard.position)
```

Say that it prints the wizard's cell, which changes only when the condition is true. Page
3, *Pruébalo*: change `"up"` for `"down"` and see that the cell stays; the same block. Say
nothing about ways, or about Dask being able to do different things.

### `else`, *Else* / *Si no*: run in the level `left-or-right`

Three pages, after the level *By the statues* and before *Left or right*; as the present
lesson, with the doors as its example instead of Dask: if the left door is locked ... else
.... Its last block, with its strings in the child's language:

```
if left_door.locked:
    print("Vamos por la puerta derecha")
else:
    print("Vamos por la puerta izquierda")
```

*Pregunta* out: *cuando comprobamos algo con `if`*. There the left door is locked, so it
prints the first.

### `repeat`, `while`, `kirra-and-osto`: as they are

Read by the rules above; nothing else changes but this:

- `repeat`, *Repeat* / *Repetir*, run in `the-three-doors`, keeps its block.
- `while`, *While* / *Mientras*, run in `past-the-teacher`, where Dask starts walking to
  the right and turns after a few ticks. Its last block, exactly, so that there is
  something to read under it:

  ```
  while dask.facing == "right":
      wizard.wait()
  print(dask.facing)
  ```

  It prints `left`. The page's words: the wizard stays still while Dask looks to the right.
- `kirra-and-osto`, *Light and slabs* / *Luz y losas*, run in `the-moving-slab`: *preguntamos
  `slab.in_place`* becomes *miramos `slab.in_place`*; it says *agujero* and *losa*, never
  *piedra*. It keeps its block.
