---
outputs:
  - content/lessons/true-or-false/en.md
  - content/lessons/true-or-false/es.md
  - content/lessons/if/en.md
  - content/lessons/if/es.md
  - content/lessons/else/en.md
  - content/lessons/else/es.md
  - content/lessons/repeat/en.md
  - content/lessons/repeat/es.md
  - content/lessons/while/en.md
  - content/lessons/while/es.md
  - content/lessons/kirra-and-osto/en.md
  - content/lessons/kirra-and-osto/es.md
context:
  - docs/dev/story.md
  - content/stories/after-dark/text.en.json
  - content/stories/the-top-of-the-stairs/text.en.json
  - content/lessons/what-a-program-is/en.md
  - content/lessons/a-name-for-a-value/en.md
  - content/lessons/what-things-know/en.md
  - content/lessons/what-things-know/es.md
  - content/lessons/true-or-false/en.md
  - content/lessons/if/en.md
  - content/lessons/else/en.md
  - content/lessons/repeat/en.md
  - content/lessons/while/en.md
  - content/lessons/kirra-and-osto/en.md
---
Rewrite the six lessons of chapter 3, *The passages*, in the voice of
Nuri, the wizard's friend, who teaches them at night in the castle's
passages, whispering so that Dask does not hear: eager, curious, saying
what the child may be thinking. The lessons as they are now are given:
keep their ideas, their code and their order, and make them Nuri's,
warm and short, for a child of eight. Each lesson is a few short pages
separated by `---`: first the idea, in the child's words, with no code;
then how it is written in Python, with a short code example; and a last
page, *Try it* / *Pruébalo*, ending in exactly one block fenced
```python try with the example given below, exactly. The same number of
pages in both languages. Nuri is the wizard's gender: Spanish choices
for Nuri's gendered words too.

Each new idea is named by the child's word beside the programmer's word
the first times (*a question, which programmers call an expression*; *a
choice, which programmers call a condition*; *a repeat, which
programmers call a loop*); the words of chapters 1 and 2 are used alone
now (*a method*, *an argument*, *a string*, *a variable*, *an
attribute*).

1. `true-or-false`: an expression is a question the computer answers
   with `True` or `False`: `3 > 2`, `door.locked`,
   `dask.facing == "left"` (`==` asks whether two things are equal, unlike
   `=`); `not` turns the answer round; an action can answer too,
   `dask.can_see(wizard)`. Try it, exactly: `print(dask.facing)` and
   `print(dask.can_see(wizard))`.
2. `if`: a condition. `if` runs its lines only when its expression is
   true; the lines inside are moved in by four spaces. `wizard.wait()`
   stands still for one tick while the world moves on. The level after
   it is played in two ways, and one program must win both. Try it,
   exactly: `if dask.facing == "left":` and, moved in,
   `wizard.wait()`.
3. `else`: the lines to run when the condition is false. Try it,
   exactly: `if left_door.locked:`, moved in `print("...")` saying the
   left one is locked, `else:`, moved in `print("...")` saying it is
   open (the strings in the child's language).
4. `repeat`: a loop. `for step in range(8):` repeats the lines moved in
   under it eight times. Try it, exactly: `for step in range(3):`, and
   moved in `wizard.move_up()` and `wizard.move_right()`.
5. `while`: `while` repeats its lines as long as its expression is true:
   a loop and a condition together; a `while` whose answer never changes
   goes on until the wizard is tired (the game's limit). Try it,
   exactly: `while dask.facing == "left":` and, moved in,
   `wizard.wait()`.
6. `kirra-and-osto`: two spells. `kirra` lights a dark room, so that what
   is in it shows; `osto`, cast beside a moving stair, holds it in place
   for a while. A moving stair is in place for a while and away for as
   long; `stair.in_place` asks whether a step onto it now would land.
   Both need the wand. Try it, exactly: `wizard.move_up(2)` and
   `print(stair.in_place)`.
