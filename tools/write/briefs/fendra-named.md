---
outputs:
  - content/lessons/fendra/en.md
  - content/lessons/fendra/es.md
  - content/levels/the-high-shelf/text.en.json
  - content/levels/the-high-shelf/text.es.json
  - content/levels/eldras-book/text.en.json
  - content/levels/eldras-book/text.es.json
  - content/levels/the-high-shelf/words.json
context:
  - docs/dev/story.md
  - content/lessons/finding-things/en.md
  - content/lessons/keys-and-doors/en.md
  - content/lessons/keys-and-doors/es.md
  - content/lessons/the-distance/en.md
  - content/lessons/fendra/en.md
  - content/lessons/fendra/es.md
  - content/levels/the-hidden-key/text.en.json
  - content/levels/the-wrong-order/text.en.json
  - content/levels/the-high-shelf/text.en.json
  - content/levels/the-high-shelf/text.es.json
  - content/levels/eldras-book/text.en.json
  - content/levels/eldras-book/text.es.json
  - content/stories/the-wand-bank/text.en.json
---
## What changes, and why

In chapter 2, in the library, the child learns the spell *fendra*, which
brings a thing that is out of reach to the wizard's feet. Until now
*fendra* brought the nearest thing in a straight line. But the library's
high shelves are full of books, and "the nearest" does not say which one
is wanted. So *fendra* is now told which thing to bring, as its second
argument, the thing's name in the program:

    book = wizard.find_nearest("book")
    wizard.cast("fendra", book)

The spell reaches three cells at most, in a straight line, in any of the
four ways, over shelves and bookcases, and never through a wall or a
closed door. When the thing it is told to bring is not in a straight line
within its reach, the spell cannot reach it and nothing comes. When it
reaches the thing, the thing glows and floats down to the wizard's own
cell, and the wizard must still pick it up: a spell moves the world, the
hands carry. The other spells (*zelim*, *kirra*, *osto*) are cast as
before, with no thing.

Two more things change in the game:

- `thing.reveal()` makes the thing's outline beat all round it, even when
  nothing hides it, so that among many books on a shelf the right one is
  shown. Behind something, the outline still shows through it.
- A wizard who tries `pick_up` beneath a thing up on a shelf, in a straight
  line, now thinks that the thing is there but too high to reach by hand.

Write anew the lesson on *fendra* and the texts of the two practices that
use it, in English and in Spanish, so that they teach the spell as it is
now, and a small file of the game's new sentences.

## What the child already knows

Before the lesson the child has learned, in chapter 1, what a program and
an instruction are, objects and methods, the moves, arguments, strings,
things and `pick_up`, the wand, `cast` and *zelim*; and in chapter 2 so
far, the right place to stand, what things know (attributes, as
`key.position`), finding things by their kind with `find_nearest` and
keeping what it returns under a name, a variable; doors and keys,
`door.open()`, `key.reveal()` to show a thing hidden behind something
(*The hidden key*), `distance_to` and a program that works wherever the
key lies (*The moving key*, *The wrong order*). Nothing a lesson has
taught is explained again; the new idea here is a spell given the thing it
acts on, as `pick_up(key)` and `give(book)` are given theirs.

## The lesson, content/lessons/fendra

Spoken by Wenna, the librarian, as now. Keep its shape: Markdown, a `#`
title, then parts split by `---`, each with a `##` heading but the first,
short and warm; the last part, "Try it", ends with this exact block,
which the game runs in the next practice:

```python try
book = wizard.find_nearest("book")
wizard.move_right(5)
wizard.cast("fendra", book)
wizard.pick_up()
```

It must say: a spell can reach across a gap; *fendra* is cast with the
wand and told which thing to bring, by the name the program keeps it
under, as its second argument; the thing comes to the wizard's own cell
and must then be picked up; it reaches three cells at most in a straight
line, over shelves and bookcases, not through walls or closed doors, and
when the thing is out of its reach nothing comes and the wizard says so.
The "Try it" part: a rare book lies among many on a high bookcase, out of
reach; first the program finds it and keeps it under a name, then the
wizard walks under it and casts the spell at it. Keep the Spanish's
gender braces as the files have them ({mago|maga}).

## The practice the-high-shelf (Practice 4, "The high shelf")

The scene: the library's top aisle, a long corridor; above it the high
bookcases, packed with books. The wizard starts at its left end. Five
cells to the right, three cells up on the top of the bookcase, lies the
rare book Wenna has long wanted down: it rests on the shelf among the
others and looks like them, so no one can see which one it is. Wenna and
{mate}, the dormitory mate, stand at the aisle's right end. The solution:

    book = wizard.find_nearest("book")
    book.reveal()
    wizard.move_right(5)
    wizard.cast("fendra", book)
    wizard.pick_up()

- `title`: "The high shelf" / "El estante alto", as now.
- `goals`: two, in this order: take the rare book; and the bonus, show
  the book with `reveal` before the spell brings it.
- `starting_code`: one or two comments, never the code: the rare book is
  somewhere among the books up on the high shelf.
- `hints`: three, each a little more help than the one before: find the
  book with `find_nearest`, keep it under a name, and show it with
  `reveal`; stand right beneath it; cast *fendra* with the book, then
  pick it up. Name methods by their code name in backquotes.
- `intro`: Wenna, in the aisle: the rare book she has wanted for so long
  is up there among all the others, and she cannot tell which one; the
  program can find it. Without the code.
- `outro`: Wenna, delighted, the book in the wizard's hands.
- `learned`: one sentence: that *fendra* is told which thing to bring,
  and that a thing it brings must still be picked up.

## The practice eldras-book (Practice 5, "Eldra's book")

The scene: the same aisle. At its left end the door of Eldra's little
room stands open; inside, on a shelf, three cells above the aisle, lies
Eldra's own book. Eldra, a gentle ghost, floats at the aisle's left end,
beside the door; Wenna and {mate} stand by. The wizard starts in the
middle of the aisle. The solution:

    book = wizard.find_nearest("book")
    wizard.move_left(5)
    wizard.cast("fendra", book)
    wizard.pick_up()
    wizard.give(book)

- `title`: as now.
- `goals`: two, in this order: give Eldra her book; and the bonus, in
  fewer than 6 lines.
- `starting_code`, `hints` (three), `intro`, `outro`, as the files have
  them now, rewritten so that they say the spell is told which book to
  bring: find the book and keep it under a name; stand in line with it,
  in the doorway of her room; cast *fendra* with the book, pick it up and
  give it to Eldra, who is beside the door. The intro is Wenna's, as now.
  No `learned` key, as now.

## The game's new sentences, content/levels/the-high-shelf/words.json

One JSON object: `{"en": {...}, "es": {...}}`, each with these five keys.
`{thing}` is the thing's word with its article, as "the book" and "el
libro"; in Spanish put it where no preposition joins it ("a {thing}" would
read "a el libro"). The wizard's thoughts are said by the wizard, in the
first person, one short sentence, never blaming, and never naming the
spell or the code.

- `too_high`: the wizard's thought after `pick_up` beneath a thing up on a
  shelf: it is right there, up high, but too high to reach by hand.
- `out_of_reach`: the wizard's thought when *fendra* is cast at a thing
  out of its reach: the spell cannot reach it from here.
- `spell_fendra`: the line on *fendra* in the notebook's list of spells,
  which begins with a small letter and ends with a full stop, as the
  others: "zelim: breaks the seal of a door beside you." It says that it
  brings to your cell the thing you name, three cells away at most in a
  straight line.
- `cast`: the description of the method `cast` in the notebook. It is now:
  "Casts a spell with the wand, which the wizard must carry. What a spell
  does depends on where the wizard stands and what is near; it may do
  nothing at all." Keep that, and add that *fendra* is also given the thing
  to bring, as `wizard.cast("fendra", book)`. The Spanish says {el
  mago|la maga} for the wizard, as now: "Lanza un hechizo con la varita,
  que {el mago|la maga} tiene que llevar. Lo que hace un hechizo depende
  de dónde está y de lo que tiene cerca; puede que no haga nada."
- `reveal`: the description of the method `reveal` in the notebook. It is
  now "Shows where a hidden thing is." / "Muestra dónde se encuentra una
  cosa oculta." It now makes the thing's outline beat all round it, even
  behind what hides it, so that you see where it is.
