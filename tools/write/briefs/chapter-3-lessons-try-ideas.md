---
outputs:
  - content/lessons/the-cells/en.md
  - content/lessons/the-cells/es.md
  - content/lessons/if/en.md
  - content/lessons/if/es.md
  - content/lessons/kirra-and-osto/en.md
  - content/lessons/kirra-and-osto/es.md
  - content/lessons/the-two-coordinates/en.md
  - content/lessons/the-two-coordinates/es.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/true-or-false/en.md
  - content/lessons/true-or-false/es.md
  - content/lessons/the-cells/en.md
  - content/lessons/the-cells/es.md
  - content/lessons/if/en.md
  - content/lessons/if/es.md
  - content/lessons/kirra-and-osto/en.md
  - content/lessons/kirra-and-osto/es.md
  - content/lessons/the-two-coordinates/en.md
  - content/lessons/the-two-coordinates/es.md
---
Four lessons of chapter 3 change, in English and Spanish. The game's owner decided why: a block
of code inside a lesson is for trying an idea of the language (a value printed, a variable, an
expression, a condition), where the wizard is at most a value to look at; it never walks the
wizard, waits, casts a spell or picks something up, which are the levels' to do. A page that
only holds such a block goes. All four lessons are taught by the friend, in the friend's
voice. Their present files are given; every page this brief does not name comes back word for
word, in both languages, with its heading and its block.

## 1. *Las casillas* / *The cells* (`the-cells`): three pages

Pages 1 and 2 word for word. Page 3 loses its block (`wizard.cast("orvim")`) and its heading
*Pruébalo* / *Try it*: it is a page of words about the word written in the map's corner, under
a heading of its own, *La palabra del mapa* / *The map's word*. Its words stay as they are,
the map working only with the word in its corner, *orvim*, and what casting it with the wand
does (the plan of the corridor opens, with the three figures on it, until it is closed), with
nothing that invites the child to run anything on this page: the child casts it in the level.

## 2. *Si* / *If* (`if`): two pages

Page 1 word for word. Page 3 (*Pruébalo*) goes. Page 2, *Una condición* / *A condition*, gets
new words round a new block, which is exactly this in Spanish:

```python
if dask.facing == "up":
    print("Mirando hacia arriba")
print("Posición:", wizard.position)
```

and exactly this in English:

```python
if dask.facing == "up":
    print("Looking up")
print("Position:", wizard.position)
```

What the page must say, in two short paragraphs before the block: the first line is the
condition; the line moved in under it, four spaces, runs only when the condition is `True`; the
last line is not moved in, so it runs always, and prints the word and the wizard's cell (with
`print` given two values, separated by a comma, it writes both with a space between them).
Dask looks up right now, so this program prints both lines. And an invitation: change `"up"`
to `"down"` and run it again, and only the cell is printed, because the condition is no longer
`True`.

## 3. *Luz y trampas* / *Light and traps* (`kirra-and-osto`): two pages

Page 1 word for word. Page 3 (*Pruébalo*) and its block go. Page 2, *El agujero que se abre* /
*The hole that opens*, word for word but its last sentence, the one about the spell *osto*
(*Y si lanzamos el hechizo* osto *junto al agujero, lo mantiene cerrado durante un rato.* /
its English): that sentence goes, and nothing takes its place. The spell is taught later, in a
lesson of its own.

## 4. *Las dos coordenadas* / *The two coordinates* (`the-two-coordinates`): three pages

Pages 1 and 2 word for word. Page 3, *Pruébalo* / *Try it*, gets a new block, which is exactly
this in both languages:

```python
position = wizard.position
print(position.x)
print(position.y)
```

and new words before it, two or three sentences: the program keeps the wizard's position in a
variable, `position`, and then prints its two numbers, its attribute `x` first and its attribute
`y` second, each on its own line; so the child sees the two numbers of the cell where the wizard
stands. No light, no key and no subtraction on this page: the level does those.

## The rules these texts keep

- A program *looks at* an attribute (*mirar*), never *asks* for it (*preguntar*).
- A metaphor for an idea stands only where the idea is first explained; these pages say
  *condition*, *attribute*, *variable*.
- The wizard's Spanish words in braces, the friend's in double braces, as the present files
  have them.

## Your answer

Eight files: each lesson in both languages, with the pages listed above.
