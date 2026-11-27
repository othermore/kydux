---
outputs:
  - content/lessons/a-name-for-a-value/es.md
  - content/lessons/a-name-for-a-value/en.md
  - content/levels/the-reading-room/text.es.json
  - content/levels/the-reading-room/text.en.json
  - content/lessons/each-thing-its-methods/es.md
  - content/lessons/each-thing-its-methods/en.md
  - content/levels/wennas-door/text.es.json
  - content/levels/wennas-door/text.en.json
  - content/lessons/finding-things/es.md
  - content/lessons/finding-things/en.md
  - content/levels/the-fallen-book/text.es.json
  - content/levels/the-fallen-book/text.en.json
  - content/levels/the-lost-book/text.es.json
  - content/levels/the-lost-book/text.en.json
  - content/stories/at-the-library/text.es.json
  - content/stories/at-the-library/text.en.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/objects-and-actions/*.md
  - content/lessons/how-much/*.md
  - content/lessons/things-to-carry/*.md
  - content/lessons/keys-and-doors/*.md
  - content/stories/at-the-library/text.*.json
  - content/levels/the-lost-book/text.*.json
  - content/levels/the-book-returned/text.*.json
  - content/levels/the-hidden-key/text.*.json
---
The start of chapter 2's walk through the library is taught again, in smaller steps, in
English and in Spanish: the one long lesson *Lo que saben las cosas* / *What things know*
(eight pages, given above) goes away, and in its place stand three short lessons, each
followed by a short level, before the level *El libro perdido* / *The lost book*. This
brief asks for those three lessons, the texts of those three levels, the texts of *El
libro perdido* as it becomes, and the story page that comes before them all. Where this
brief and the course document differ, this brief wins.

## Why

A child of ten who played the chapter was lost here, in four ways, and every text of this
brief is written against them:

1. The child did not understand that a method can give something back, and that what it
   gives back is lost unless the program keeps it in a variable.
2. The lesson's example was `book = wizard.find_nearest("book")`. The variable and the
   word in quotes were the same word, and the child took them for one thing. A variable
   can have any name: the texts must say so, show it with names that are **not** the word
   in quotes, and make the child choose a name of their own.
3. The child wrote `wizard.reveal(key)` and `wizard.reveal("key")`: every method they had
   used so far was the wizard's, and nobody had shown them, slowly, that another object
   has methods of its own, written after its own name.
4. All of it came at once, in eight pages with no level between them.

So the three ideas come one at a time, each practised at once in a level that needs that
idea alone: **a variable** (a name for a value, the name chosen by the child); **an object
other than the wizard has its own methods** (a door: `door.open()`); **a method that gives
something back**, kept in a variable, and the thing kept has its own methods
(`tesoro.reveal()`).

## Where it happens, and the order

Wenna, the librarian, walks the wizard and their dormitory mate (`{mate}`) through her
library towards the bank of wands at the back. The reading room is the first room: a
carpet at the bottom, round tables above it, and above the tables the door to the rest of
the library. Beyond the door runs a corridor, with two great bookcases above it and a
narrow aisle between the two. The order is:

| | id | Spanish title (yours to better) | what it is |
|---|---|---|---|
| story | `at-the-library` | *En la biblioteca* | they come in; Wenna will walk them |
| lesson 2 | `a-name-for-a-value` | *Un nombre para un valor* | `print`, a variable, the name is the child's |
| practice 2 | `the-reading-room` | *Entre las mesas* | three equal stretches walked with one variable |
| lesson 3 | `each-thing-its-methods` | *Cada objeto, sus métodos* | the door has a method of its own |
| practice 3 | `wennas-door` | *La puerta de Wenna* | open the door and go through |
| lesson 4 | `finding-things` | *Encontrar cosas* | a method that gives back; keep it; use its methods |
| practice 4 | `the-fallen-book` | *El libro caído* | a book in plain sight: find, reveal, pick up |
| practice 5 | `the-lost-book` | *El libro perdido* | the half-hidden book, under a name of the child's |

Titles are short, as the chapter's others are. Wenna teaches the three lessons and speaks
every level text (intro, outro), in her voice: precise and quiet, she loves order and a
good question; she speaks to the two children as *vosotros* in the lessons when she means
both, and to the wizard as *tú* about their program, as the present lessons do.

## What the child knows before these texts

From chapter 1: a program is lines run in order; everything is an object and an action is
a method, written `wizard.move_right()` (the lesson *Objetos y acciones*, given); an
argument between the brackets says how far (`wizard.move_up(3)`); a string is words in
quotes; `wizard.pick_up()`; a spell is cast with `wizard.cast("…")`; the notebook lists
what each object can do. The child has **never** seen `print`, a variable, a method of
another object, or a method that gives something back. Attributes (`door.locked`,
`wizard.items`) are **not** taught in these texts at all: they are taught in chapter 3.
`None` is not mentioned either. Sums of variables are not taught here.

## The names in the code

The Python keywords and the game's names stay English in both languages. **The names of
variables are the program's own, and in these texts they differ by language**: Spanish
texts use Spanish names, English texts use English names, and **no variable is ever named
like the word in quotes that finds it**, in either language. Use exactly these:

| | Spanish | English |
|---|---|---|
| lesson 2's examples | `edad`, `nombre` (`"Marta"`), `caramelos` | `age`, `name` (`"Martha"`), `sweets` |
| the steps of practice 2, in a hint only | `pasos` | `steps` |
| the book of lesson 4 and practice 4 | `tesoro` | `treasure` |
| other names lesson 4 offers as just as good | `libro_viejo`, `mi_hallazgo` | `old_book`, `my_find` |

Wenna named the variable `tesoro` / `treasure` because to a librarian every book is a
treasure; she says so, once, in lesson 4, and it is her proof that the name is whatever
the one who writes the program likes.

## 1. Lesson 2, `a-name-for-a-value`: four pages

Said by Wenna on the carpet of the reading room, before they cross it.

1. **`#` title page, `print`.** Two sentences of Wenna's that open the walk's first idea
   (a program can keep a value and give it a name; first, a way to *see* a value), then
   what `print` is: the second paragraph of the present page *Mostrar el valor* /
   *Showing the value*, kept as close to word for word as the new place allows (it no
   longer follows a page about attributes: say "a value", not "an attribute"). It ends
   with that page's block, exactly: `print(7)`, `print(2 + 3)`, `print("Hola")` /
   `print("Hello")`.
2. **`## Una variable` / `## A variable`.** The present page *Una variable*, word for
   word, with its block (`edad = 9`, `nombre = "Marta"` and their two `print`).
3. **`## El nombre lo eliges tú` / `## The name is yours to choose`.** New. The name of a
   variable is chosen by whoever writes the program; Python does not care which, only
   that the same name is written each time. The rules of a name, in one sentence: letters,
   digits and the low line `_`, no spaces, and it never starts with a digit. A good name
   says what the value is. Then the invitation, which is the point of the page: run the
   block; then change the name, in **both** lines, to one of your own, and run it again:
   it prints the same. Then change it in one line only and see what the game answers (it
   says nothing is called that: the program knows a value only by the name it was kept
   under). The block, exactly (`sweets` in English):

```python try
caramelos = 12
print(caramelos)
```

4. **`## Una variable entre los paréntesis` / `## A variable between the brackets`.** New,
   words only, **no block** (this lesson's last page has none: the level that follows is
   where the child tries it). A variable that holds a number can stand wherever a number
   goes, also as the argument of a move: with `pasos = 2`, the line
   `wizard.move_left(pasos)` walks two steps (show the two lines as inline code or a
   plain fenced block that is **not** `python try`). Why bother: when several moves need
   the same number, the program says the number once; and if the number must change one
   day, it is changed in one place. One closing sentence of Wenna's that leads to the
   tables.

## 2. Practice 2, `the-reading-room`

The wizard stands on the carpet at the bottom of the reading room; the mate stands just at
their right and Wenna waits beside the door, above the tables. The way to the door goes
round a table by its left: two steps left along the carpet, two steps up through the gap
between two tables, two steps right to the door. The three stretches are equal because
Wenna set her tables in order, and that is the level's reason: the number is said once.

The solution (never shown in a text):

```python
pasos = 2
wizard.move_left(pasos)
wizard.move_up(pasos)
wizard.move_right(pasos)
```

Its goals, three texts in this order: (1) reach the door; (2) required: keep the number
of steps in a variable and walk with it (the game checks that a variable is the argument
of a move); (3) a bonus: write the number only once in the whole program.

Its `starting_code` is four comments and no code, one a step, with an empty line after
each: keep the number 2 in a variable, *the name is yours to choose*; walk left with
`move_left` and your variable between the brackets; go up with `move_up` and the same
variable; go right with `move_right` and the same variable, to the door. The comments do
not give a name for the variable.

Three hints, from the gentlest: (1) what a line that keeps a number looks like, in words
(the name, `=`, the number), with no example name; (2) the variable goes where the number
went, between the brackets of each move; (3) the three stretches are two steps each, and
an example with a name, `pasos = 2` / `steps = 2`, and one move.

`intro`: Wenna, three or four sentences: the door is beyond the tables; her tables stand
in order, so the way is three stretches of the same length, two steps each, left, up and
right; say the number once, in a variable, and walk with it. `outro`: one or two
sentences, at the door. `learned`: what a variable is and that it can be the argument of
a method.

## 3. Lesson 3, `each-thing-its-methods`: three pages, no block

Said by Wenna at the closed door. No page of this lesson has a block: a block would open
the door, and that is the level's.

1. **`#` title page.** Until now every method the child used was the wizard's:
   `wizard.move_up()`, `wizard.pick_up()`. What stands before the dot is the object that
   does it; what stands after is what it does. The wizard is not the only object: each
   object has methods of its own.
2. **`## La puerta` / `## The door`.** This door is an object, and in the program its
   name is `door`. It has a method of its own: `door.open()`. A door opens only for a
   wizard standing right beside it. (A locked door and its key are a later lesson: say
   nothing of them.)
3. **`## ¿De quién es el método?` / `## Whose method is it?`.** `wizard.open()` does not
   work, and why: opening is something the door does, not the wizard, so the method is
   written after the door's name. The notebook shows each object with its own methods:
   when in doubt about whose a method is, look there. One closing sentence that leads to
   the door.

## 4. Practice 3, `wennas-door`

The wizard stands right before the closed door; it is not locked. Solution (never shown):

```python
door.open()
wizard.move_up(2)
```

Goals, two texts: open the door; go through it into the corridor. `starting_code`: two
comments, an empty line after each: open the door with its method `open` (the method is
the door's: its name goes first); go up two steps to pass through. Three hints: (1) whose
method `open` is, and what is written before the dot; (2) a method needs its brackets,
even with nothing between them; (3) once it is open, two steps up. `intro`: Wenna, two or
three sentences: she opens no door for them; this one is not locked; it has its own
method. `outro`: they are in the corridor. `learned`: that an object other than the
wizard has its own methods, written after its own name.

## 5. Lesson 4, `finding-things`: five short pages

Said by Wenna in the corridor, where a book lies on the floor a few steps away. Each page
is one idea in two short paragraphs at most.

1. **`#` title page.** Some methods do something in the world, like moving or picking
   up; others give something back, a value. `wizard.find_nearest("book")` gives back the
   nearest book, the thing itself, even if it lies far away. (The present page *Encontrar
   cosas* says this: keep what serves.)
2. **`## Si no lo guardas, se pierde` / `## Not kept, it is lost`.** A line that is only
   `wizard.find_nearest("book")` finds the book and forgets it at once: the program has
   no name to call it by on the next line. To keep it, a name and `=` go in front:
   `tesoro = wizard.find_nearest("book")`. Wenna says why she called it `tesoro`.
3. **`## Dos palabras distintas` / `## Two different words`.** The line holds two words
   that are not the same kind of word. `"book"`, in quotes, is the game's word: it says
   what kind of thing to look for, and must be written exactly so. `tesoro` is the
   variable, the name the writer chose: `libro_viejo` or `mi_hallazgo` would do as well.
   From that line on the program knows the book by that name and no other: writing `book`
   without quotes means nothing to it.
4. **`## Los métodos de lo que encuentras` / `## The methods of what you find`.** What was
   found is an object, and like the door it has methods of its own. `tesoro.reveal()`
   makes it glow, so that it is seen wherever it lies. The variable's name goes before
   the dot, exactly as `door` did in `door.open()`. And not `wizard.reveal(tesoro)`:
   `reveal` is the thing's method, not the wizard's.
5. **`## Pruébalo` / `## Try it`.** Two or three sentences round the lesson's one block,
   exactly this (`treasure` in English):

```python try
tesoro = wizard.find_nearest("book")
print(tesoro)
```

   It runs in the corridor of the level that follows: the nearest book is the one on the
   floor, and the program prints `<book at 3, 15>`. Wenna says what that is: the game's
   way of writing a thing, its kind and the square where it lies (the two numbers will
   be explained another day). Then the invitation: change the name in both lines to one
   of your own and run it again; it finds the same book.

## 6. Practice 4, `the-fallen-book`

The wizard stands in the corridor, just through the door. A book lies on the floor four
steps to the left, in plain sight. Books turn up on this floor some mornings, and Wenna
does not say why (the next level tells of Eldra; do not name her here). The level's job is
the mechanics, on a thing the child can see: the first line is **given**, and the child
writes the rest. This level is the one exception to the rule that a practice's starting
code holds no code.

Solution (never shown beyond its given first line):

```python
tesoro = wizard.find_nearest("book")
tesoro.reveal()
wizard.move_left(4)
wizard.pick_up()
```

Goals, two texts: make the book glow with `reveal`; pick the book up.

`starting_code`, exactly this shape (`treasure` in English; comments in each language):

```
# Esta línea ya está escrita: encuentra el libro y lo guarda en la variable `tesoro`.
tesoro = wizard.find_nearest("book")

# Haz que brille con `reveal`. El método es del libro: delante va el nombre de la variable.

# Camina a la izquierda hasta el libro.

# Recógelo con `pick_up`.

```

Three hints: (1) `reveal` is the book's method, so the variable's name goes before the
dot, as `door` did; (2) the book lies four steps to the left; (3) `pick_up` is the
wizard's method and needs nothing between its brackets. `intro`: Wenna, two or three
sentences: a book on the floor again; her first line already finds it and keeps it;
make it glow, walk to it and pick it up. `outro`: Wenna takes the book and puts it back
on its shelf. `learned`: that a method can give something back, that a variable keeps it,
and that the thing kept has its own methods.

## 7. Practice 5, `the-lost-book`, as it becomes

Its present texts are given. What stays: Eldra, the ghost who lost a book long ago; the
book half hidden beside the pile of old books in the corner, at the end of the aisle
between the two great bookcases, reached from the end of the hall just above it; the
order *find it, make it glow, walk, pick it up*. What changes:

- The wizard starts in the corridor, where the fallen book was, not before the door: the
  walk is *right along the corridor to the side passage, up to the hall, left along the
  hall to its end, one step down beside the pile*. No text says "go up through the door".
- Nothing is given: the child writes the whole program, and **keeps the book under a name
  of their own invention**. The game refuses `book` and `tesoro` / `treasure` as that
  name: Wenna wants a name the child thought of.

Solution (never shown; `mi_libro` stands for the child's own name):

```python
mi_libro = wizard.find_nearest("book")
mi_libro.reveal()
wizard.move_right(8)
wizard.move_up(4)
wizard.move_left(10)
wizard.move_down()
wizard.pick_up()
```

Goals, three texts in this order: (1) pick the book up; (2) required: keep the book in a
variable with a name of your own, neither `book` nor `tesoro` (`treasure` in English);
(3) a bonus: make the book glow with `reveal`.

`starting_code`: four comments, an empty line after each: find the book with
`find_nearest` and the word "book", and keep it in a variable with a name you invent;
make it glow with `reveal`; walk to it (the walk above, in words, no numbers); pick it up
with `pick_up`. No comment gives a name.

Three hints: (1) the line has the shape of Wenna's line with `tesoro`, with your own
name in its place; (2) `reveal` and every later line use that same name of yours; (3) the
walk, in words, and `pick_up` beside the pile.

`intro`: as the present one, for the new start, and with Wenna's wish for a name of the
child's own. `outro`: the present one may stay word for word. `learned`: that the name of
a variable is the child's to choose, and that the thing a method gives back is used by
that name.

## 8. The story `at-the-library`

Its present six steps are given. Steps 1 to 4 and step 6 come back word for word. **Step 5
changes**: Wenna no longer opens the door for them. Before her words she walks one step
towards the door, above the tables; she says that the way to the bank of wands goes
through that door beyond the tables, that she opens no door for those who come to learn,
and that she will teach them what they need on the way, one thing at a time, starting
here. One bubble, two or three sentences. Same keys and the same six steps in each file.

## The rules these texts keep

- A metaphor for an idea stands only where the idea is first explained: the variable in
  lesson 2 (the present page *Una variable* has it). Lessons 3 and 4 and every level say
  *variable*, *method*, *object*, *argument*.
- Never *ask* / *preguntar* for what a program does.
- A level's `starting_code` comments name the method of each step and never write the
  line; hints never show the whole solution; the third hint may show one line.
- The wizard's Spanish words in braces (`{mago|maga}`, `{vosotros mismos|vosotras
  mismas}`), the mate as `{mate}`, as the present files have them.
- Each level's text is a JSON object with exactly these keys: `title`, `goals` (a list of
  strings, as many as this brief lists for the level, in its order), `starting_code` (one
  string with line breaks, ending with an empty line), `hints` (a list of three strings),
  `intro`, `outro`, `learned`.

## Your answer

Sixteen files: the three lessons in each language, the four levels' texts in each
language, and the story in each language.
