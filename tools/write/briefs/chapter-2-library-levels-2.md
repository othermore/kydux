---
outputs:
  - content/levels/the-lost-book/text.en.json
  - content/levels/the-lost-book/text.es.json
  - content/levels/the-book-returned/text.en.json
  - content/levels/the-book-returned/text.es.json
  - content/levels/the-hidden-key/text.en.json
  - content/levels/the-hidden-key/text.es.json
  - content/levels/the-high-shelf/text.en.json
  - content/levels/the-high-shelf/text.es.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/giving-things/en.md
  - content/lessons/giving-things/es.md
  - content/lessons/keys-and-doors/en.md
  - content/lessons/fendra/en.md
  - content/levels/the-lost-book/text.en.json
  - content/levels/the-lost-book/text.es.json
  - content/levels/the-hidden-key/text.en.json
  - content/levels/the-hidden-key/text.es.json
  - content/levels/eldras-room/text.en.json
  - content/levels/eldras-room/text.es.json
  - content/levels/the-moving-key/text.en.json
---
## What changes, and why

The game's owner tried chapter 2 and asked for four of the library's
practices to be written again. A practice must guide the child: its
starting code is **comments only, one a step**, in the child's words,
each saying what to do next and naming in backquotes the method that
does it, and **never writing the program**: the child writes the line
under each comment. The lost book's practice asked for three ideas at
once; it is now two practices, one for finding and one for giving. Two
things are never hidden in the same place: the book now lies in plain
sight, half behind the pile of old books, while the door's key stays
hidden under the bookcase.

Write each level's text, in English and in Spanish, as a JSON object
with the keys `title`, `goals` (one sentence a goal, in the order given,
the bonus last), `starting_code` (comment lines, each starting with `# `,
ending with a newline), `hints` (three, each a little more precise than
the one before, never the whole program), `intro`, `outro` and
`learned`. Wenna, the librarian, speaks every `intro` to the wizard as
"you": precise and quiet, kind. The rules you are given hold: natural,
warm prose; natural Spanish from Spain, never American; the wizard's
gendered words in single braces, the boy's form first; `{wizard}`,
`{friend}` and `{mate}` for the names; methods in backquotes; a spell's
name in italics; Python never translated, but comments are. Never
explain again an idea the child has learned in a lesson: say what to do,
not what it is. The solutions below are for you to be true to; they
never appear in a text.

What the child knows when each level starts: everything of chapter 1;
`wizard.sleep()`; attributes, `wizard.items`, `door.locked`, and
`print`; then, lesson by lesson: `find_nearest` and keeping its answer
under a name, `reveal` (before *The lost book*); `find_item` and `give`
(before *The book returned*); `door.open()` and that a hidden thing is
found all the same (before *The hidden key*); `distance_to`, and the
spell *fendra*, which draws the thing it is told, three tiles away at
most in a straight line, down to the wizard's tile (before *The high
shelf*).

The library: the wizard enters from the reading room at the bottom,
through Wenna's door. Above it is the main room, with two long bookcases
side by side and a narrow aisle between them; the only way into that
aisle is from its right end, from the passage on the right side of the
room. At the aisle's left end, in the corner, is a pile of old books.
Above the bookcases is the wide hall; the corner with the pile is
reached from the hall's left end, one step down; Eldra, the ghost, waits
floating at the hall's right end, above it. A locked door in the
middle of the hall's top wall leads up to the top aisle, under the high
shelves, with Eldra's little room at its left end and the wand bank at
its right end.

## content/levels/the-lost-book (Practice 2, "The lost book")

The wizard starts in the reading room, before Wenna's open door; Wenna
and `{mate}` stand beside. Eldra's book lies in the corner at the left
end of the aisle between the two long bookcases, by the pile of old
books, half behind it: seen, but partly covered. The child finds it,
makes it glow, walks to it and picks it up. The goals: pick up the book;
bonus, make it glow with `reveal`. The solution:

    book = wizard.find_nearest("book")
    book.reveal()
    wizard.move_up(2)
    wizard.move_right(4)
    wizard.move_up(4)
    wizard.move_left(10)
    wizard.move_down()
    wizard.pick_up()

- `title`: "The lost book" / "El libro perdido".
- `intro`: Eldra lost a book long ago; it lies in the corner by the pile
  of old books, at the end of the aisle between the two big bookcases,
  half hidden; find it, make it glow, and pick it up. Two or three
  sentences.
- `starting_code`, one comment a step: find the book with
  `find_nearest` and the word "book", and keep it under a name; make it
  glow with `reveal`; walk to it: up through the door, right to the
  passage, up past the bookcases into the hall, left along it to its
  end, and one step down, beside the pile; pick it up with `pick_up`.
- `hints`: 1, find it with `find_nearest` and the word "book", keep it
  under a name, and `reveal` it; 2, up through the door, right to the
  passage, up into the hall, left along it to its end, and one step
  down; 3, beside the pile of books, use `pick_up`. Shorter than the
  ones now.
- `outro`: you have it! Eldra waits at the other end of the hall, and
  will be so glad.
- `learned`: now you know that a method can give something back, that a
  name keeps it, and that a revealed thing shows where to go.

## content/levels/the-book-returned (Practice 3, "The book returned", new)

It starts where the last level ended: the wizard at the hall's left end,
above the pile, with Eldra's book in hand; Wenna and `{mate}` wait in the
reading room below. Eldra floats at the hall's other end, facing down. This is a new program: the name
of the last one is gone, and the child asks for the book in hand with
`find_item`. The goals: give Eldra her book; bonus, in fewer than 5
lines. The solution:

    book = wizard.find_item("book")
    wizard.move_up()
    wizard.move_right(10)
    wizard.give(book)

- `title`: "The book returned" / "El libro devuelto".
- `intro`: the book is in your hands, and Eldra floats at the other end
  of the hall; take it to her. Two or three sentences.
- `starting_code`, one comment a step: ask for the book in your hands
  with `find_item` and the word "book", and keep it under a name; go up a
  step into the hall, and right along it to Eldra; give her the book with
  `give` and the name.
- `hints`: 1, `find_item` with the word "book" gives the book you carry;
  keep it under a name; 2, up a step, then right along the hall, until
  Eldra is right beside you; 3, use `give` with the name you kept the
  book under.
- `outro`: Eldra holds her book again and thanks you, glad; one or two
  sentences, said as the other outros are.
- `learned`: now you know that a name lives in its own program, that
  `find_item` asks for what you carry, and that `give` hands a thing to
  whoever stands beside you.

## content/levels/the-hidden-key (Practice 4, "The hidden key")

As it is now: the wizard starts in the hall, above the bookcases; the
key of the locked door in the middle of the hall's top wall fell under
the front bookcase long ago, where no one sees it; it is found, made to
glow, picked up from the aisle beside it, and the door is opened and
gone through. The goals as now. The solution:

    key = wizard.find_nearest("key")
    key.reveal()
    wizard.move_down(2)
    wizard.move_left(8)
    wizard.pick_up()
    wizard.move_right(8)
    wizard.move_up(2)
    wizard.move_left(4)
    wizard.move_up(2)
    door.open()
    wizard.move_up(3)

- `title`, `goals`, `hints`, `outro`, `learned`: as now, word for word.
- `intro`: as now, with one sentence more: Eldra's book is back with
  her, and no book lies in the aisle any more; this time it is the key
  that is out of sight.
- `starting_code`, one comment a step: find the key with `find_nearest`
  and the word "key", and keep it under a name; make it glow with
  `reveal`; go down into the aisle and left along it to beside the key;
  pick it up with `pick_up`; go back right to the aisle's end, up into
  the hall, left along it and up to the door; open it with its `open`
  method; go up through it.

## content/levels/the-high-shelf (Practice 5, "The high shelf", the chapter's review)

The wizard starts at the left end of the top aisle, before Eldra's little
room. Eldra floats a little further along the aisle, facing the wizard;
Wenna and `{mate}` stand further on, by the wand bank. Eldra lost a
second book long ago: it is up on the high shelf among many others, and
she cannot tell which; the program can. The child finds it, makes it
glow, walks to stand right under it, draws it down with *fendra*, picks
it up and gives it to Eldra, who is then right beside the wizard. The
goals: give Eldra her book; bonus, make it glow with `reveal`. The
solution:

    book = wizard.find_nearest("book")
    book.reveal()
    wizard.move_right(5)
    wizard.cast("fendra", book)
    wizard.pick_up()
    wizard.give(book)

- `title`: "The high shelf" / "El estante alto".
- `intro`: Eldra's other lost book is up on the high shelf among all the
  others, and she cannot tell which one it is; your program can: find
  it, make it glow, stand under it, bring it down with *fendra*, pick it
  up, and give it to her. Two or three sentences, by Wenna.
- `starting_code`, one comment a step: find the book with `find_nearest`
  and keep it under a name; make it glow with `reveal`; walk right until
  you stand right under it; cast *fendra* with `cast` and the book's
  name; pick it up with `pick_up`; give it to Eldra with `give`.
- `hints`: 1, find it and `reveal` it; 2, walk right until you stand
  right below the glowing book; 3, `cast` *fendra* with the book, then
  `pick_up` and `give`.
- `outro`: both her books are back; Eldra is at peace at last.
- `learned`: now you know that *fendra* is told which thing to bring, and
  that what it brings must still be picked up; and, in one sentence, the
  chapter's ideas together: a thing's attributes, a method that gives
  something back kept under a name, finding what is hidden, a door and
  its key, a number your program cannot know, and a spell that reaches.
