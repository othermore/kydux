---
outputs:
  - content/levels/eldras-room/text.en.json
  - content/levels/eldras-room/text.es.json
  - content/lessons/fendra/en.md
  - content/lessons/fendra/es.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/fendra/en.md
  - content/lessons/fendra/es.md
  - content/levels/the-moving-key/text.en.json
  - content/levels/the-wrong-order/text.en.json
  - content/levels/the-wrong-order/text.es.json
  - content/levels/eldras-room/text.en.json
  - content/levels/eldras-room/text.es.json
  - content/stories/the-wand-bank/text.en.json
  - content/stories/the-wand-bank/text.es.json
---
## What changes, and why

The game's owner tried chapter 2 and found that its last practice made no
sense: the fix before it, *The wrong order*, opens the door of Eldra's
little room, and then the practice fetched Eldra's other book from the
high shelf of the aisle, so the open door led to nothing. Eldra's other
book is now inside her little room: the room holds a wooden bookcase full
of books standing upright, and her old red book stands among them on the
middle shelf. A book on a shelf is too high for the wizard's hands, and
the spell *fendra* does not reach into a room from the aisle in front of
it: it reaches only from the room's doorway, or from inside. So the child
steps up into the open doorway, draws the book down with *fendra*, picks
it up, steps back down into the aisle and gives it to Eldra, who waits
there beside the wizard.

The practice keeps its place, the chapter's last practice and its review
(Practice 5), after the lesson *A spell that reaches* (`fendra`), and it
gets a new id, `eldras-room`, and a new title. The file
`content/levels/eldras-room/text.*.json` you are given is the practice's
text as it was, for the high shelf: write it again for the room.

Write the level's text, in English and in Spanish, as a JSON object with
the keys `title`, `goals` (one sentence a goal, in the order given, the
bonus last), `starting_code` (comment lines, each starting with `# `,
ending with a newline), `hints` (three, each a little more precise than
the one before, never the whole program), `intro` and `outro`. No
`learned`: the chapter's last level has none, since the story after it,
*The wand bank*, sums the chapter up. Wenna, the librarian, speaks the
`intro` and the `outro` to the wizard as "you": precise and quiet, kind.
The rules you are given hold: natural, warm prose; natural Spanish from
Spain, never American; the wizard's gendered words in single braces, the
boy's form first; `{wizard}` and `{mate}` for the names; methods in
backquotes; a spell's name in italics; Python never translated, but
comments are. Never explain again an idea the child has learned in a
lesson: say what to do, not what it is. Never speak of a cell's numbers
or a position: the child sees where things are, and the grid comes in
chapter 3. The solution below is for you to be true to; it never appears
in a text.

What the child knows when the level starts: everything of chapter 1;
`wizard.sleep()`; attributes, `wizard.items`, `door.locked`, and `print`;
`find_nearest`, keeping its answer under a name, and `reveal`;
`find_item` and `give`; a door's `open` method and its key; `distance_to`
and a number kept under a name; the order of a program's lines; and the
spell *fendra*, cast with the wand and told which thing to bring,
`wizard.cast("fendra", book)`, three cells at most in a straight line.

## content/levels/eldras-room (Practice 5, the chapter's review)

The scene: the library's top aisle. The wizard starts at its left end,
right in front of the open door of Eldra's little room, which *The wrong
order* has just opened. Through the doorway the room's bookcase is seen,
full of books; Eldra's old red book stands among them on the middle shelf.
Eldra, the library's ghost, floats beside the wizard in the aisle, facing
the wizard; `{mate}` and Wenna stand a little further along the aisle.
The wizard carries the wand. The goals: give Eldra her book; bonus, make
it glow with `reveal`. The solution:

    book = wizard.find_nearest("book")
    book.reveal()
    wizard.move_up()
    wizard.cast("fendra", book)
    wizard.pick_up()
    wizard.move_down()
    wizard.give(book)

What goes wrong, so that the hints help: cast from the aisle, the spell
does not reach the book (the doorway stops it); `pick_up` in the doorway
before the spell is refused, the book is too high for the hands.

- `title`: a short title about Eldra's room, in both languages (the
  room is Eldra's; it is "little").
- `goals`: give Eldra her book; make the book glow with `reveal`.
- `intro`: now the door is open, Eldra's other lost book can be fetched:
  it stands on the bookcase in her little room, among many books just like
  it, and it is too high for hands; *fendra* reaches it, but only from the
  doorway, not from the aisle. Find it, make it glow, step into the
  doorway, bring it down with the spell, pick it up, and give it to
  Eldra. Two or three sentences, by Wenna.
- `starting_code`, one comment a step, in the child's words, each naming
  in backquotes the method that does it, never writing the code: find the
  book with `find_nearest` and keep it under a name; make it glow with
  `reveal`; step up into the doorway; cast *fendra* with `cast` and the
  book's name; pick it up with `pick_up`; step back down beside Eldra;
  give it to her with `give`.
- `hints`: 1, find it and make it glow with `reveal`; 2, from the aisle
  the spell cannot reach into the room: step up into the doorway first;
  3, `cast` *fendra* with the book, then `pick_up`, step down, and `give`.
- `outro`: both her books are back; Eldra is at peace at last. One or two
  sentences, by Wenna, leading to the story after it, which opens with
  Eldra holding her own book again.

## content/lessons/fendra (Lesson 7, *A spell that reaches*)

The lesson before the practice, taught by Wenna, keeps its title, its
three pages and its first page as they are. Write it whole again, in both
languages, changing only what follows from the practice above:

- The second page, *Flying over things*, says how far the spell reaches:
  three cells at most in a straight line, in any of the four ways, over
  shelves and bookcases, not through walls or closed doors; and now also
  not past a doorway: a thing inside a room is reached from the room's
  doorway, or from inside it, never from in front of the room through its
  door, even an open one. One or two sentences more, plainly said, with
  the rest of the page as it is.
- The third page, *Try it*, is the example the child is shown, which
  plays on the practice after the lesson: Eldra's book stands among many
  others on the bookcase in her little room, too high for hands; the
  wizard, in front of the open door, finds it and keeps it under a name,
  steps up into the doorway, casts *fendra* at it, and picks it up. Keep
  the sentence that a spell moves things and the hands carry them. The
  example's code, exactly:

```python try
book = wizard.find_nearest("book")
wizard.move_up()
wizard.cast("fendra", book)
wizard.pick_up()
```

The lesson is Markdown: pages separated by a line with only `---`, the
first opening with the `#` title, the others with a `##` heading, the
last ending with exactly the one block above, fenced ```python try.
