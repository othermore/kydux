---
outputs:
  - content/stories/at-the-library/text.en.json
  - content/stories/at-the-library/text.es.json
  - content/levels/the-lost-book/text.en.json
  - content/levels/the-lost-book/text.es.json
  - content/lessons/finding-things/en.md
  - content/lessons/finding-things/es.md
context:
  - docs/dev/story.md
  - content/stories/at-the-library/text.en.json
  - content/stories/at-the-library/text.es.json
  - content/levels/the-lost-book/text.en.json
  - content/levels/the-lost-book/text.es.json
  - content/lessons/finding-things/en.md
  - content/lessons/finding-things/es.md
  - content/lessons/keys-and-doors/en.md
---
## What changes, and why

The game's owner read the library's first story and level again. Write
each file again, in English and in Spanish, changing **only** what this
brief lists, and keeping every other step, sentence, hint and key exactly
as it is now, word for word. Each file keeps its number of steps, pages
and hints. The rules you are given hold: natural Spanish from Spain,
never American; the wizard's gendered words in single braces, the boy's
form first; `{wizard}`, `{friend}` and `{mate}` for the names; methods in
backquotes.

## content/stories/at-the-library (six steps)

Step 5 only, said by Wenna, the librarian, once she has walked to the
shut door between the reading room and the main library and opened it
before the children: she invites them through into the next room; she
has opened this door for them, but the other doors on their way they
will have to open themselves. Warm, one to three sentences. She does not
say whose door it is. Steps 1 to 4 and 6 as now.

## content/levels/the-lost-book ("The lost book")

Eldra's book is no longer by the piles at the left wall: it lies in the
narrow aisle between the two long bookcases of the main room, where no
one sees it, hidden between them. The wizard starts in the reading room,
before Wenna's open door; the only way into the aisle is up through the
door, right to the passage on the right side of the room, up that passage
and into the aisle, left along it. Eldra waits by her armchair at the top
left of the room, above the bookcases. The solution:

    book = wizard.find_nearest("book")
    book.reveal()
    wizard.move_up(2)
    wizard.move_right(4)
    wizard.move_up(2)
    wizard.move_left(6)
    wizard.pick_up()
    wizard.move_up(2)
    wizard.move_left()
    wizard.give(book)

- `intro`, by Wenna: Eldra lost a book long ago; it must have slipped
  into the aisle between the two big bookcases, where no one can see it;
  find it with `find_nearest`, make it glow, and bring it to her.
- `starting_code`: one comment: Eldra's book is hidden between the two
  big bookcases; find it and bring it to her.
- `hints`: 1, as now; 2, walk to where it glows: up through the door,
  right to the passage, up into the aisle between the bookcases and left
  along it, then `pick_up`; 3, go up to Eldra, beside her armchair, and
  use `give` with your variable's name.
- `goals`, `outro`, `learned`: as now.

## content/lessons/finding-things (four pages)

Only the last page's sentence about Eldra changes: Eldra, our ghost, has
lost a book somewhere between the two big bookcases; let us find it and
make it glow. Everything else as now, the block too.
