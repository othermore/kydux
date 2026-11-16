---
outputs:
  - content/lessons/the-broom/en.md
  - content/lessons/the-broom/es.md
  - content/lessons/lists/en.md
  - content/lessons/lists/es.md
  - content/lessons/for-each/en.md
  - content/lessons/for-each/es.md
context:
  - docs/dev/story.md
  - docs/dev/sprint-40.md
  - content/lessons/lists/en.md
  - content/lessons/lists/es.md
  - content/lessons/for-each/en.md
  - content/lessons/for-each/es.md
  - content/lessons/checking-each/es.md
  - content/lessons/the-cells/es.md
---
Write three lessons of chapter 4, *The broom*, in English and Spanish: the files listed.
The owner read the chapter and asked for these lessons (sprint 40's plan, given above:
its decisions D196 to D198 and its section 2.5). The lessons *Lists* and *For each one*
as they are now are given: keep what they say well, and change what this brief asks.
`{friend}` teaches all three, the friend the child met at the gate, in the broom shed,
the morning the three children found the brooms tampered with.

## The lesson's file

Markdown with no HTML. Each page starts with a heading, `# ` for the first page and
`## ` for the others; pages are parted by a line `---`. A page may hold at most one
block of code the child can run, fenced as ```` ```python try ````; it must run on its
own and print something (no `wizard`, nothing that walks). Text between backquotes is
code. Spanish from Spain for a child of eight, natural and warm, as a friend talks; the
English says the same with contractions. Never *preguntar*, *pregunta*, *ask*,
*question*: a program **looks at** an attribute. A metaphor only where an idea is first
explained, beside its programming word (*a list*, *una lista*; *an index*, *un
índice*); after that, the programming word. In Spanish, `{friend}`'s gendered words in
double braces, `{{listo|lista}}`; the wizard's in single braces, `{el mago|la maga}`.

## 1. `the-broom` — *The broom and its knot* / *La escoba y su nudo*

New, the first lesson of the chapter, right after the friend has found the black knot
in a broom's twigs and said: "Esta de aquí, a tus pies, tiene uno. Quítaselo tú: te
enseño cómo se hace." Two pages, **no block of code**.

- Page 1, *The broom and its knot* / *La escoba y su nudo*: a broom is an object, like
  the keys and the doors; when a program keeps it in a name, `broom`, it can look at
  its attribute `broom.knotted`, which is `True` while the black thread is tied in it
  and `False` once it is off, and use its method `broom.untie()`, which takes the knot
  off, but only when the wizard stands on the broom, or, if it hangs on a peg, right
  under it. To find the broom, `wizard.find_nearest("broom")` gives the nearest one, as
  it gave a key in the library.
- Page 2, *What you find depends on where you stand* / *Lo que encuentras depende de
  dónde estés*: the owner's rule, in their own words (keep its sense whole): "No
  siempre puedes encontrar todo: a veces, desde donde estás, solo encuentras algunas
  cosas. Por ejemplo, si estás junto a la pared en la que se cuelgan las escobas, solo
  encontrarás las escobas colgadas, y si estás en la paja, encontrarás las que están
  tiradas en el suelo." Use the shed's two places as the example: by the wall, under
  the rack, the hung ones; in the straw, the fallen ones.

## 2. `lists` — *Lists* / *Las listas*

Three pages.

- Page 1 opens with the owner's words, said by `{friend}`, word for word in Spanish:
  "Pero ¿cuántas son? Y ¿cómo las encontramos? Hay una manera de encontrar todas las
  cosas del mismo tipo. Os la enseñaré." Then what a list is, as now (`nombres =
  ["Teku", "Nuri", "Bimo"]`, `print(nombres)`), and its name.
- Page 2, *Find them all* / *Encontrarlas todas*, as now: `len`, and
  `wizard.find_all("broom")`, which gives the list of every broom found from where you
  stand, the nearest first (say "from where you stand" plainly: by the wall the hung
  ones, in the straw the fallen ones; not "every broom of the place", and not that it
  sees through the straw). Its block as now.
- Page 3, new, *One of the list* / *Uno de la lista*: the owner's question, "¿Y si
  queremos solo uno de los elementos de la lista?". A list's element by its place, its
  index: `nombres[0]` is the first, since a list counts from 0, as the cells of the
  grid do; `nombres[2]` the third. Asking for one the list does not have, `nombres[3]`
  in a list of three, is an error, and the game says it: "la lista no tiene tantos:
  tiene 3, y pediste el 4.º" / "the list doesn't have that many: it has 3, and you asked
  for number 4". A block that prints the first and the last of the list `nombres`,
  with `nombres[0]` and `nombres[2]`.

## 3. `for-each` — *For each one* / *Para cada una*

Two pages, each with its block.

- Page 1, *For each one* / *Para cada una*, as now: `for broom in brooms:` runs the
  lines moved in under it once for each element of the list, `broom` being the next
  each turn; `broom.untie()` inside. Its block as now.
- Page 2, new, *By its place* / *Por su sitio* (or a better short title): the same loop
  over the places of the list: `for i in range(len(brooms)):` with `brooms[i]`, the
  index counting the turns, from 0, as `range` does. When each way is handy: the first,
  to do something with each element; the second, when the number of the turn matters
  too. A block: `nombres = ["Teku", "Nuri", "Bimo"]`, a `for` over `range(len(nombres))`
  that prints each turn's number and its name.
