---
outputs:
  - content/lessons/giving-things/es.md
  - content/lessons/giving-things/en.md
  - content/lessons/keys-and-doors/es.md
  - content/lessons/keys-and-doors/en.md
  - content/lessons/the-distance/es.md
  - content/lessons/the-distance/en.md
  - content/lessons/counting-with-names/es.md
  - content/lessons/counting-with-names/en.md
  - content/lessons/fendra/es.md
  - content/lessons/fendra/en.md
  - content/lessons/where-i-am/es.md
  - content/lessons/where-i-am/en.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/giving-things/*.md
  - content/lessons/keys-and-doors/*.md
  - content/lessons/the-distance/*.md
  - content/lessons/counting-with-names/*.md
  - content/lessons/fendra/*.md
  - content/lessons/the-cells/*.md
  - content/lessons/where-i-am/*.md
---
Six lessons change, in English and in Spanish, because the start of chapter 2 is taught
again in smaller steps. Each lesson's present files are given. **Whatever this brief does
not name as changed comes back word for word, in both languages**: these are small, exact
changes, not new lessons. Where this brief and the course document differ, this brief
wins.

## What changed before these lessons

The long lesson *Lo que saben las cosas* / *What things know* (given above) is gone. In
its place, at the start of chapter 2, Wenna teaches three short lessons, each with a short
level after it:

1. *A name for a value*: `print`; a variable; the name of a variable is the child's to
   choose; a variable as the argument of a move.
2. *Each object, its methods*: the door is an object named `door` with its own method,
   `door.open()`, and it opens only for a wizard right beside it. The child has opened an
   unlocked door.
3. *Finding things*: a method can give something back; `wizard.find_nearest("book")`
   gives back the nearest book; unless a variable keeps it, it is lost; the word in
   quotes is the game's word and the variable's name is the writer's own, and the two are
   never the same word (Wenna's example is `tesoro = wizard.find_nearest("book")`, in
   English `treasure = …`); the thing kept has its own methods (`tesoro.reveal()`).

Then, in *El libro perdido* / *The lost book*, the child kept Eldra's book under a name
they invented themselves.

Three things those lessons do **not** teach, and these lessons take up: `None`, attributes,
and sums of variables.

## The names in the code

A child who played the chapter took the variable `book` and the word `"book"` for one
thing, and `key` and `"key"` too. So **no variable is named like the word in quotes that
finds it, in either language**, and variables have Spanish names in the Spanish texts and
English names in the English texts. Python's keywords and the game's names (`wizard`,
`door`, `find_nearest`, `distance_to`…) stay English in both. Use exactly these:

| the value | Spanish | English |
|---|---|---|
| Eldra's first book, carried and given back (*Dar cosas*) | `libro_de_eldra` | `eldras_book` |
| the key of Eldra's small room (*A qué distancia*, *Contar con variables*) | `llave_de_eldra` | `eldras_key` |
| the steps to that key | `pasos` | `steps` |
| the steps left to the door | `resto` | `rest` |
| Eldra's other book, on the high shelf (*Un hechizo que alcanza*) | `otro_libro` | `other_book` |

## 1. *Dar cosas* / *Giving things* (`giving-things`)

- Page 1: the sentence that says *a variable you kept in the last program, like `book`,
  is gone* names no variable: the child chose that name themselves. Say *the variable
  where you kept the book in the last program is gone*, the rest of the page word for
  word.
- Page 2: the line is `libro_de_eldra = wizard.find_item("book")` (English
  `eldras_book = …`). This page is now the first place the child meets `None`: say in one
  short clause what it is (Python's word for *nothing*), where the page says the method
  gives back `None` when the wizard carries none.
- Page 3: `wizard.give(libro_de_eldra)` (English `wizard.give(eldras_book)`).

Three pages, no block, as now.

## 2. *Llaves y puertas* / *Keys and doors* (`keys-and-doors`)

- Page 1, **new words**: the child already knows `door.open()` and that a door opens only
  for a wizard right beside it, so the page does not teach them again; it recalls them in
  half a sentence and teaches the one new thing: some doors are locked with a key, and a
  locked door opens only when the wizard carries its key. Two short sentences or three,
  Wenna's voice, the `#` title kept.
- Page 2, *Cosas ocultas* / *Hidden things*: word for word.

## 3. *A qué distancia* / *How far* (`the-distance`)

The key is no longer a name the program has from the start: the program finds it first,
and keeps it under `llave_de_eldra` / `eldras_key`.

- Page 2, *Comprobar la distancia*: say that once a program has found the key and kept it
  in a variable, say `llave_de_eldra`, the key can tell how many steps lie between it and
  the wizard, with `llave_de_eldra.distance_to(wizard)`. The same two ideas as now, one
  sentence more at most.
- Page 3, *Usar una variable*: `pasos = llave_de_eldra.distance_to(wizard)`,
  `wizard.move_left(pasos)` (English `steps`, `eldras_key`). Otherwise word for word.
- Page 4's block, exactly (English: `eldras_key`, `steps`):

```python try
llave_de_eldra = wizard.find_nearest("key")
pasos = llave_de_eldra.distance_to(wizard)
print(pasos)
```

Pages 1 and 4's words: word for word.

## 4. *Contar con variables* / *Counting with variables* (`counting-with-names`)

The page *Sumar variables* / *Adding variables* of the lesson that is gone moves here, and
the names change. Four pages:

1. The `#` title, the present first sentence of the lesson (a variable that holds a number
   can be used to count, exactly like a number), and then the two paragraphs and the block
   of *Sumar variables*, word for word (`a = 4`, `b = 3`, `total = a + b`, `print(total)`),
   with no heading of their own. If the first sentence of *Sumar variables* now repeats the
   lesson's first sentence, keep one of the two.
2. A new `##` heading of yours (the steps that are left), over the present first page's
   second paragraph (*Imagina una puerta que está a cinco pasos…*), word for word but for
   the names: `pasos`, `5 - pasos`, `pasos + 2`.
3. *Guardarlo o usarlo*: word for word but for the names: `resto = 5 - pasos`,
   `wizard.move_left(resto)`, `wizard.move_left(5 - pasos)`.
4. *Pruébalo*: word for word, and its block, exactly (English: `eldras_key`, `steps`):

```python try
llave_de_eldra = wizard.find_nearest("key")
pasos = llave_de_eldra.distance_to(wizard)
print(5 - pasos)
```

## 5. *Un hechizo que alcanza* / *A spell that reaches* (`fendra`)

One change: `wizard.cast("fendra", book)` is `wizard.cast("fendra", otro_libro)` (English
`other_book`). Everything else word for word.

## 6. *Dónde estoy* / *Where I am* (`where-i-am`), chapter 3

This lesson is said by the wizard's friend, `{friend}`, in a dark tunnel under the castle,
the night they slip out with the map (the lesson before it, *Las casillas*, is given). It
is now **the first place the child meets attributes**: the present text says *`position`
is an attribute of `wizard`* as if the word were known. So the idea is first explained
here, with what the two first pages of the lesson that is gone said (given above:
*Lo que saben las cosas* and *Mirar un atributo*), in the friend's voice and in this
place. Four pages:

1. `# Dónde estoy` / `# Where I am`: the dark, and that it does not stop them knowing where
   they are (the present first two sentences may open it), then the idea: an object has
   methods, and it also knows things about itself, which programmers call attributes
   (the child's word beside the programmer's word, here, once); the wizard knows what it
   carries, a door knows whether it is locked. Two short paragraphs.
2. `## Mirar un atributo` / `## Looking at an attribute`: the page of the lesson that is
   gone, as close to word for word as the friend's voice allows: a dot after the object's
   name and no brackets, because it is not a method; `door.locked`, `wizard.items`.
3. `## La posición` / `## The position` (a heading of yours): the rest of the present first
   page from *Como tiene el mapa…* on (`wizard.position`, the two numbers together,
   `key.position`), word for word where it can be, and its block `print(wizard.position)`.
4. *Lo que no se ve*: word for word.

## The rules these texts keep

- A program *looks at* an attribute (*mirar*), never *asks* for it (*preguntar*).
- A metaphor for an idea stands only where the idea is first explained.
- The wizard's Spanish words in braces, the friend's in double braces, as the present
  files have them.

## Your answer

Twelve files: the six lessons in each language.
