---
outputs:
  - content/lessons/if/es.md
  - content/lessons/if/en.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/if/*.md
  - content/lessons/if/lesson.json
  - content/lessons/true-or-false/*.md
---
Write a third page for the lesson *Si* / *If* (chapter 3, lesson 5), in Spanish and in
English: the page that tells the keys that move a line in. Answer with the whole lesson
in each language, its two pages exactly as they are now, letter for letter, and the new
page after them, opened by a line of three dashes (`---`) and a `## ` heading, as the
second page is.

## Why

The `if` is the first place in the course where lines go inside another line, four
spaces in. The owner of the game wants the child taught how to do that without counting
spaces. Their words:

> Cuando se enseñe el primer "anidamiento" (if o for o while) hay que explicar el
> tabulador (la tecla tabulador del teclado) y los 4 espacios, y decir que en nuestro
> editor el tabulador se usa para poner cuatro espacios y que borrar también borra
> cuatro espacios seguidos. Quizás haga falta una página para poner todo eso.

The game's editor already does all of it: Enter at the end of a line that ends with a
colon starts the next line four spaces in, and the lines after it stay in; the Tab key
puts four spaces; the delete key (Backspace), pressed in the spaces at the start of a
line, takes four away at once.

## What the page says, in this order

1. The four spaces before a line are how Python knows that the line is inside the
   `if`. One sentence: the page before has shown it.
2. Nobody has to count them. In this editor, pressing Enter at the end of a line that
   ends with a colon starts the next line already moved in, and the lines after it
   stay in.
3. The Tab key puts four spaces at once: it moves a line in. Say where the key is: at
   the keyboard's left, above the Caps Lock key, often drawn with two arrows.
4. The delete key, the one with the long arrow that points left, pressed in the spaces
   before a line, takes the four away at once: one press brings the line out.
5. Four presses of the space bar are the same for Python; Tab is only quicker.
6. What to try in the block below, step by step: run it, and one line is printed, the
   one outside; put the cursor at the start of the last line and press Tab, run it
   again, and nothing is printed, because the line is now inside the `if` and Dask
   does not look down; press the delete key there, and the line is out again and is
   printed again.

Six to eight sentences, and the block. Name the keys as a child's keyboard names them
in each language: in Spanish *Tab* and *Intro*, and the delete key told by where it is
and what is drawn on it; in English *Tab*, *Enter* and *Backspace*.

## The block, at the page's end

Give it exactly as here, with its first line `python try`, and translate only its two
strings, as the second page translates its own:

```python try
if dask.facing == "down":
    print("Dask mira hacia abajo")
print("Esta línea está fuera del if")
```

In English its strings are *Dask looks down* and *This line is outside the if*.

## Rules

- The course's own words for a line moved in: *metida hacia dentro* (*meter hacia
  dentro*, *sacar*), *moved in* (*move in*, *bring out*), as the two pages say it.
- No new word of programming: not *indentation*, not *sangría*, not *bloque*. No
  metaphor.
- Do not tell Shift+Tab, nor moving several lines at once.
- Spanish from Spain. Who speaks is the lesson's teacher, a friend, as on the two
  pages; where a word would need the wizard's gender, write it as the pages do, with
  braces, the boy's form first: `{mago|maga}`.
- The page's heading: short, in the voice of the second page's (*Una condición*).
