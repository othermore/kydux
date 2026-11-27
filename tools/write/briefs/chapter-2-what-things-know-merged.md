---
outputs:
  - content/lessons/what-things-know/en.md
  - content/lessons/what-things-know/es.md
  - content/lessons/fendra/en.md
  - content/lessons/fendra/es.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/stories/at-the-library/text.en.json
  - content/stories/at-the-library/text.es.json
  - content/lessons/fendra/en.md
  - content/lessons/fendra/es.md
---
Two lessons of chapter 2 change, in English and Spanish. The game's owner decided why: a
block of code inside a lesson is for trying an idea of the language (a value printed, a
variable, a sum, an attribute looked at), never for walking the wizard, casting a spell or
making a thing glow where no scene shows it; and a page that only holds such a block goes.
The lessons' present files are given. Every page this brief does not name as new comes back
word for word, in both languages.

## 1. *Lo que saben las cosas* / *What things know*, one lesson of eight pages

Today *Lo que saben las cosas* (four pages) and *Encontrar cosas* (six pages) are two lessons
taught one after the other by Wenna, the librarian, on the way into the library, with no level
between them. They become one lesson, the file `what-things-know`, with its title *Lo que saben
las cosas* / *What things know*, taught by Wenna as now, before the level *El libro perdido*.
Its eight pages, in this order, separated by a line with only `---`:

1. *Lo que saben las cosas*: the first page of *Lo que saben las cosas*, its `#` title and its
   words, word for word.
2. *Mirar un atributo*: its second page, word for word.
3. *Mostrar el valor*: its third page, word for word, with its block (`print(7)`, `print(2 +
   3)`, `print("Hola")`; in English `print("Hello")`).
4. *Encontrar cosas* / *Finding things*: **new words**, from the first page of *Encontrar
   cosas*: a method may do something in the world, like moving or picking up, and another gives
   something back, a value; `wizard.find_nearest("book")` gives back the nearest book, the
   thing itself, even if it lies far away. It is now the fourth page of a lesson, not the first
   page of one: a `##` heading, no `#` title, and its sentences may follow on from page 3 (the
   child has just printed values). Two short paragraphs, as the old page has.
5. *Una variable*: the second page of *Encontrar cosas*, word for word, with its block.
6. *Sumar variables*: the third page of *Encontrar cosas*, word for word, with its block.
7. *Guardar lo que devuelve un método* / *Keeping what a method gives back*: the fourth and
   fifth pages of *Encontrar cosas* as one page of words, under the fourth's heading: the
   fourth page's two paragraphs (`book = wizard.find_nearest("book")`, `None`) and then the
   fifth page's paragraph (`book.reveal()`), each word for word, the fifth page's heading
   dropped. No block.
8. *Pruébalo* / *Try it*: **new words** round this block, which is exactly this in both
   languages:

```python
door = wizard.find_nearest("door")
print(door.locked)
```

   It runs where the level after the lesson starts: the wizard stands right beside the door
   Wenna opened for the two of them a moment ago (the story *At the library*), and that door is
   the nearest one. So the program keeps the nearest door in a variable, then prints whether it
   is locked, and the answer it prints is `False`: Wenna opened it, so it is not locked. Wenna
   says this, in her voice, in two or three sentences before the block: what the program does
   line by line (finds the nearest door and keeps it in `door`; looks at its attribute `locked`
   and prints it), and what it will answer, and why. The old page *Pruébalo* of *Lo que saben
   las cosas* (`print(door.locked)` alone) and the old block of *Encontrar cosas*
   (`book.reveal()`) are gone.

The lesson's last page ends with that block.

## 2. *Un hechizo que alcanza* / *A spell that reaches* (`fendra`)

Its third page, *Pruébalo* / *Try it*, and its block go. Its sentence that teaches something
moves to the end of its second page, *Volar sobre las cosas* / *Flying over things*, as that
page's last paragraph: *Recuerda que un hechizo mueve las cosas, pero tus manos las llevan.
Debes recoger la cosa una vez que haya bajado hasta ti.* / *Remember that a spell moves things,
but your hands carry them. You must pick the thing up once it has come down to you.*, word for
word. The lesson's first and second pages are otherwise word for word: two pages, no block.

## The rules these texts keep

- A program *looks at* an attribute (*mirar*), never *asks* for it (*preguntar*); the game
  never *asks* either.
- A metaphor for an idea stands only where the idea is first explained: the attribute on page 1,
  the variable on page 5; page 4 and page 8 say *method*, *attribute*, *variable*.
- The wizard's Spanish words in braces, as the present files have them.

## Your answer

Four files: the two `what-things-know` files, eight pages each, and the two `fendra` files, two
pages each.
