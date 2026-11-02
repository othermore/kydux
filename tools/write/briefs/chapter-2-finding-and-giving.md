---
outputs:
  - content/lessons/finding-things/en.md
  - content/lessons/finding-things/es.md
  - content/lessons/giving-things/en.md
  - content/lessons/giving-things/es.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/things-to-carry/en.md
  - content/lessons/the-right-place/en.md
  - content/lessons/the-right-place/es.md
  - content/lessons/what-things-know/en.md
  - content/lessons/what-things-know/es.md
  - content/lessons/finding-things/en.md
  - content/lessons/finding-things/es.md
  - content/lessons/keys-and-doors/en.md
  - content/lessons/keys-and-doors/es.md
---
## What changes, and why

The game's owner tried chapter 2 and found that the lesson *Finding
things* taught three ideas at once: finding a thing, making it glow, and
giving it. A lesson teaches one idea, and the level after it needs that
idea alone. So *Finding things* now teaches finding a thing and making it
glow, and a new lesson, *Giving things*, comes after the level that
practises it and teaches asking for the thing the wizard carries and
giving it.

Both lessons are taught by Wenna, the librarian: precise and quiet, fond
of order and of a good question, kind. She speaks to the wizard as "you".
The rules you are given hold: natural, warm prose, not a string of clipped
sentences; natural Spanish from Spain, never American; the wizard's
gendered words in single braces, the boy's form first; methods and code
in backquotes; Python never translated.

What the child knows by now: a program and its instructions run from the
top down; objects and their methods, `wizard.move_right(3)` and the
others; comments; arguments; strings; `wizard.pick_up()`; a spell cast
with the wand; `wizard.sleep()` only in the right place; attributes,
read without brackets, `wizard.items` and `door.locked`, and `print` to
show them (the lesson *What things know*). Do not explain any of these
again.

## content/lessons/finding-things (four pages)

Keep the first three pages exactly as they are now, word for word, in
both languages: what a method that gives something back is,
`wizard.find_nearest("book")`; keeping the answer under a name, a
variable, with `=`, and `None`; making it glow with `book.reveal()`.

Write the fourth page again. Its heading is *Try it* / *Pruébalo*. It
says nothing about giving. Eldra, our ghost, lost one of her books long
ago; it lies in a corner of the library, by the pile of old books, half
hidden behind it; a program finds it wherever it lies, so let us find it
and make it glow. Two to four sentences, then exactly this block:

```python try
book = wizard.find_nearest("book")
book.reveal()
```

## content/lessons/giving-things (four pages, new)

*Giving things* / *Dar cosas*. It comes after the level where the child
finds Eldra's book, makes it glow and picks it up. The next level starts
with the book already in the wizard's hands, and the child gives it to
Eldra.

1. **Each level is a new program.** When a level starts, its program
   starts from nothing: a name kept in the last program, like `book`, is
   gone, even when the thing itself is still in the wizard's hands. So
   the program asks for the thing again. Say it plainly and warmly, as
   something that surprises a child the first time; no code yet.
2. **Asking for what you carry.** `wizard.find_item("book")` gives back
   the thing of that kind the wizard carries, or `None` when it carries
   none, just as `find_nearest` gives back the nearest one lying on the
   map; `find_nearest` looks on the floor, `find_item` in the wizard's
   hands. It is kept under a name as before:
   `book = wizard.find_item("book")`. Do not explain variables or `None`
   again; the child knows them.
3. **Giving a thing.** A thing kept under a name can be handed to
   whoever stands right beside the wizard: `wizard.give(book)`. The name
   in the brackets says which thing. If nobody stands beside the wizard,
   the wizard says so and keeps the thing.
4. **Try it** / **Pruébalo**. The book is in your hands, and Eldra waits
   at the other end of the hall, far from you; nobody stands beside you yet.
   Let us ask for the book and try to give it right here, to see what the
   wizard says; then, in the level, you will walk to Eldra first. Then
   exactly this block:

```python try
book = wizard.find_item("book")
wizard.give(book)
```

Each page a short paragraph or two. The Spanish says the same in natural
Spanish from Spain: *Dar cosas*, *Pruébalo*.
