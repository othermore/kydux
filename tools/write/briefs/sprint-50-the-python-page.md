---
outputs:
  - content/sprint-50/notebook-python.es.json
  - content/sprint-50/notebook-python.en.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/notes/*.md
  - content/lessons/words/*.md
  - content/lessons/what-things-know/*.md
  - content/lessons/true-or-false/*.md
  - content/lessons/if/*.md
  - content/lessons/else/*.md
  - content/lessons/repeat/*.md
  - content/lessons/while/*.md
  - content/lessons/lists/*.md
  - content/lessons/for-each/*.md
  - content/lessons/less-or-greater/*.md
  - content/lessons/an-action-of-your-own/*.md
  - content/lessons/arguments-of-your-own/*.md
---
Write the seventeen lines of a new page of the wizard's notebook, *Python*, in Spanish
and in English. Answer with two JSON files, one an object of the seventeen keys below to
a string: `notebook-python.es.json` and `notebook-python.en.json`. Use exactly these keys
and no others.

## Why

The notebook is the panel the child opens while writing a program. It lists what the
level's objects can do. The owner of the game wants one more page in it, with the words
and signs of Python the course has taught so far. Their words, whole:

> quiero añadir al cuaderno una sección más donde estén los elementos que se hayan ido
> enseñando ya de sintaxis: for, if, while, comparaciones, listas.... simplemente una
> linea recordando lo que hace cada uno, y un ejemplo. Eso ayuda al niño a ver la sintaxis
> para escribir los programas.

The page shows, for each word or sign, three things one under the other: the word as it
is typed, the line you write, and an example the game gives. Only the line is yours. The
entries come in the order the course teaches them, and a child sees an entry only once
its lesson has been read. The lessons that teach each one are given above, whole, in
both languages.

## The seventeen lines, in this order

For each: the key, the word or sign as the page shows it, the lesson that teaches it,
what the line says, and the example the page shows under it (so that your line does not
repeat it).

1. `comments`, shown `#`, lesson *notes*: a comment is a note for whoever reads the
   program; the computer skips what follows the `#` on its line. Example:
   `# Towards the door` / `wizard.move_right()` (in Spanish the comment is
   `# Hacia la puerta`).
2. `strings`, shown `" "`, lesson *words*: a string is words between quotes; the computer
   keeps them exactly as written. Example: `wizard.say("Hello")` (Spanish:
   `wizard.say("Hola")`).
3. `print`, shown `print()`, lesson *what-things-know*: shows a value under the editor.
   Example: `print(door.locked)`.
4. `variables`, shown `=`, lesson *what-things-know*: a variable keeps a value under a
   name: the name left of the `=`, the value right of it. Example:
   `book = wizard.find_nearest("book")`.
5. `arithmetic`, shown `+  -`, lesson *what-things-know*: add and subtract numbers; the
   result is a number, to keep or to use. Example: `total = 4 + 3` / `rest = total - 2`.
6. `equal`, shown `==`, lesson *true-or-false*: compares two values: `True` when they are
   equal, `False` when not. Example: `print(dask.facing == "up")`.
7. `not`, shown `not`, lesson *true-or-false*: says the contrary of an expression.
   Example: `print(not door.locked)`.
8. `if`, shown `if`, lesson *if*: a condition: the lines moved in under it run only when
   its expression is `True`. Example: `if dask.facing == "up":` / `    wizard.move_right(2)`.
9. `else`, shown `else`, lesson *else*: goes with an `if`: its lines run when the
   condition is `False`. Example: `if left_door.locked:` / `    wizard.move_right(2)` /
   `else:` / `    wizard.move_left(2)`.
10. `for_range`, shown `for … in range()`, lesson *repeat*: a loop: runs the lines moved
    in under it as many times as `range` says. Example: `for step in range(3):` /
    `    wizard.move_right(2)`.
11. `while`, shown `while`, lesson *while*: a loop that runs its lines again and again
    while its expression is `True`. Example: `while dask.facing == "right":` /
    `    wizard.wait()`.
12. `lists`, shown `[ ]`, lesson *lists*: a list is several values in order, between
    square brackets; an element is asked for by its index, counted from 0. Example:
    `names = ["Teku", "Nuri", "Bimo"]` / `print(names[0])` (Spanish: `nombres`).
13. `len`, shown `len()`, lesson *lists*: says how many values a list has. Example:
    `print(len(brooms))`.
14. `for_each`, shown `for … in …`, lesson *for-each*: a loop over a list: runs its lines
    once for each element. Example: `for broom in brooms:` / `    broom.untie()`.
15. `less_greater`, shown `<  >`, lesson *less-or-greater*: compare two numbers, less
    than and greater than; they answer `True` or `False`. Example:
    `if broom_x < my_x:` / `    wizard.move_left(my_x - broom_x)` (Spanish: `escoba_x`,
    `mi_x`).
16. `def`, shown `def`, lesson *an-action-of-your-own*: a function: gives a name to the
    lines moved in under it; they run each time the name is written with its brackets.
    Example: `def quick_fly():` / `    wizard.move_right(2)` / `    wizard.move_up(2)` /
    (a blank line) / `quick_fly()`.
17. `def_arguments`, shown `def …(…)`, lesson *arguments-of-your-own*: the names between
    the `def`'s brackets are the function's arguments; a call gives them their values in
    the same order. Example: `def greet(name):` / `    print("Hello", name)` / (a blank
    line) / `greet("Teku")` (Spanish: `def saludar(nombre):`, `print("Hola", nombre)`,
    `saludar("Teku")`).

Three lines are in the game now, for the page after the objects, and are written again
here, since their examples leave the line:

- `len`: *Da cuántos valores tiene una lista: len(brooms) es el número de escobas de la
  lista brooms.* / *Gives how many values a list has: len(brooms) is the number of
  brooms in the list brooms.*
- `def`: *Da un nombre a las líneas que van metidas debajo, una función. Se ejecutan
  cada vez que se escribe el nombre con paréntesis: quick_fly().* / *Gives a name to the
  lines moved in under it, a function. They run each time the name is written with
  brackets: quick_fly().*
- `def_arguments`: *Los nombres entre los paréntesis del def son los argumentos de la
  función: al llamarla se les dan sus valores en el mismo orden, two_rings(2, 4).* /
  *The names in the brackets of def are the function's arguments: the call gives them
  their values in the same order, two_rings(2, 4).*

## Rules

- One sentence a line, two short ones at most, no longer than about 110 letters.
- Write the seventeen together, so that they read as one list.
- It says what the word or sign does, as a reminder to one who has read the lesson; it
  teaches nothing new.
- The programming words of the lessons and no other: *comentario*, *cadena*,
  *variable*, *expresión*, *condición*, *bucle*, *lista*, *elemento*, *índice*,
  *función*, *argumento*; *comment*, *string*, *variable*, *expression*, *condition*,
  *loop*, *list*, *element*, *index*, *function*, *argument*. The lessons' own words for
  a line moved in (*metida hacia dentro*, *moved in*) and for brackets (*paréntesis*,
  *corchetes*; *brackets*, *square brackets*).
- No metaphor: none of these is explained here for the first time.
- Nothing of the story and no character; no mark of the wizard's gender.
- A word of Python between backquotes: `` `if` ``, `` `True` ``, `` `range` ``.
- Do not repeat the example in the line.
