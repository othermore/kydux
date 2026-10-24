---
outputs:
  - content/lessons/a-name-for-a-value/en.md
  - content/lessons/a-name-for-a-value/es.md
  - content/lessons/what-things-know/en.md
  - content/lessons/what-things-know/es.md
  - content/lessons/finding-things/en.md
  - content/lessons/finding-things/es.md
  - content/lessons/keys-and-doors/en.md
  - content/lessons/keys-and-doors/es.md
  - content/lessons/fendra/en.md
  - content/lessons/fendra/es.md
context:
  - docs/dev/story.md
  - content/stories/in-the-castle/text.en.json
  - content/lessons/what-a-program-is/en.md
  - content/lessons/objects-and-actions/en.md
  - content/lessons/how-much/en.md
  - content/lessons/words/en.md
  - content/lessons/your-first-spell/en.md
  - content/lessons/your-first-spell/es.md
  - content/lessons/a-name-for-a-value/en.md
  - content/lessons/what-things-know/en.md
  - content/lessons/finding-things/en.md
  - content/lessons/keys-and-doors/en.md
  - content/lessons/fendra/en.md
---
Rewrite the five lessons of chapter 2, *The library*, in the voice of
Wenna, the librarian, who teaches them in her library: precise and
quiet, fond of order and of a good question. The lessons as they are
now are given: keep their ideas, their code and their order, and make
them Wenna's, warm and short, for a child of eight. Each lesson is a few
short pages separated by `---`: first the idea, in the child's words,
with no code; then how it is written in Python, with a short code
example; and a last page, *Try it* / *Pruébalo*, ending in exactly one
block fenced ```python try with the example given below, exactly. The
same number of pages in both languages.

Each new idea is named by the child's word beside the programmer's word
the first times (*a name for a value, which programmers call a
variable*; *what a thing knows, which programmers call an attribute*);
the words of chapter 1 are used alone now (*a method*, *an argument*, *a
string*, *a comment*).

1. `a-name-for-a-value`: a variable. A program often uses the same value
   many times; give it a name and use the name. `steps = 3`, then
   `wizard.move_right(steps)`. The `=` puts the value under the name; it
   does not ask whether they are equal. Try it, exactly:
   `steps = 3` and `wizard.move_right(steps)`, two lines.
2. `what-things-know`: an attribute. An object knows things about itself:
   where it is (`wizard.position`), what it carries (`wizard.items`),
   whether a door is locked (`door.locked`), where a thing lies
   (`thing.position`). Written with a dot and no brackets, because
   nothing is done: you only ask. `print(...)` shows the answer on the
   card under the editor. Try it, exactly: `print(door.locked)`.
3. `finding-things`: an action that gives something back.
   `wizard.find_nearest("book")` gives back the nearest book; keep it
   under a name, `book = wizard.find_nearest("book")`, and ask it, like
   `book.position`; when there is none it gives back `None`. And the
   wizard gives a thing it carries to whoever stands beside it:
   `wizard.give(book)`. Try it, exactly:
   `book = wizard.find_nearest("book")` and `print(book.position)`.
4. `keys-and-doors`: a door is an object with an action of its own,
   `door.open()`, done standing beside it; a locked door opens only when
   the wizard carries its key, so the key comes first. Try it, exactly:
   `wizard.move_up(2)` and `wizard.pick_up()`.
5. `fendra`: a spell that reaches. `fendra` draws the nearest thing it
   can reach, up to three tiles straight ahead in each of the four ways,
   over shelves, stopped by walls and closed doors, onto the wizard's
   tile; then the wizard picks it up. It needs the wand. Try it,
   exactly: `wizard.cast("fendra")` and `wizard.pick_up()`.
