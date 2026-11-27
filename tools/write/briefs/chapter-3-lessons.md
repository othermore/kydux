---
outputs:
  - content/lessons/the-cells/en.md
  - content/lessons/the-cells/es.md
  - content/lessons/where-i-am/en.md
  - content/lessons/where-i-am/es.md
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
  - content/lessons/counting-with-names/es.md
  - content/lessons/fendra/es.md
---
Write the eight lessons of chapter 3 of Kydux, *The passages*, in English and
Spanish. The owner's design document is given in full: its section 4 has the
Spanish of these lessons, which the owner has read and likes. Keep their voice
and whatever is still true of them, and write English that says the same. Where
this brief says something changes, this brief wins over the design document. The
friend teaches them at night, in the castle's passages, whispering so as not to be
heard, with {mate} beside them; between the levels that use them. Each lesson is
a few short pages, separated by a line with only `---`. The first page opens
with the `#` title.

## What the child knows by now

All of chapters 1 and 2: programs, objects and methods, comments, arguments,
strings, `say`, `pick_up`, a spell cast with the wand, attributes and `print`,
`find_nearest` kept under a name, `None`, `door.open()` beside a door, `distance_to`,
a number made from a name, a level played in several ways. Never explain those
again.

## What is new in this chapter's world

- The naughty child's map is a thing the wizard carries. `wizard.cast("orvim")` takes
  a moment, needs the wand and the map, and opens a window over the game with the
  plan of the place, seen from above: the walls, the floor, the doors, every column
  and row numbered round its edges, each floor cell's two numbers small inside it,
  and every person and thing with their name and their cell. The game stops while
  the window is open, and goes on when it is closed. It shows no numbers on the
  floor of the scene itself: never say that.
- In the enchanted tunnel no one is seen, neither on the scene nor on the plan; the
  wizard walks as on any floor, and `wizard.position` says where they stand.
- There are no stairs in this chapter. Over a hole in the floor a slab comes and
  goes, a stone slab, `slab` in the code; `slab.in_place` is `True` when a step onto
  it, taken now, would land on it. *osto* holds it in place for a while. Never use
  the word *stair*, *escalera* or *escalón*.
- A program asks `dask.facing`, which says `"up"`, `"down"`, `"left"` or `"right"`.
  Never mention `can_see`, in no lesson.

## The lessons, in the order the child reads them

1. `the-cells`, *The cells* / *Las casillas*. As the design gives it, but the map is the
   window with the plan: the map shows the whole castle floor by floor as a plan of
   cells, ours open at the corridor we stand in; a cell's two numbers, x counted from
   the left and y from the top, both from 0; to go from one cell to another, count
   what changes in each number. The example of counting: from `(5, 16)` to `(9, 13)`,
   four to the right and three up. Its Try it, the last page: the map only works
   with the word written in its corner, *orvim*; cast it, and the plan opens with
   this corridor's cells numbered and the three of them named; close it, and the
   game goes on:

   ```python try
   wizard.cast("orvim")
   ```

2. `where-i-am`, *Where I am* / *Dónde estoy*. The reason is the enchanted tunnel
   ahead: inside it neither the scene nor the plan shows anyone, and a program can
   ask all the same: `wizard.position` is an attribute with the two numbers together,
   like `(15, 3)`. One sentence says that a thing knows its cell too, `key.position`.
   Its Try it, tried inside the tunnel, where it prints `(15, 3)`:

   ```python try
   print(wizard.position)
   ```

3. `true-or-false`, *True or false* / *Verdadero o falso*. As the design gives it,
   with `can_see` taken out: an expression; `True` and `False`; `==`, and how it is
   not `=`; `not`; `dask.facing` and its four strings. Its example is shown in an
   ordinary ```python block, `print(dask.facing == "left")`, and is not tried, for the
   next stop is a lesson: no ```python try block in this one.

4. `if`, *If* / *Si*. As the design gives it: a condition, `if`, four spaces;
   `wizard.wait()` stands still for a tick, a moment of the game, while everything
   else moves, and `wizard.wait(2)` two; a level played several ways. Its Try it:

   ```python try
   if dask.facing == "left":
       wizard.wait()
   ```

5. `else`, *Else* / *Si no*. As the design gives it, but its Try it is on Dask, who is
   the one in the next level, each string in the child's language:

   ```python try
   if dask.facing == "left":
       print("Dask looks left")
   else:
       print("Dask does not look left")
   ```

6. `repeat`, *Repeat* / *Repetir*. As the design gives it, but with no stairs at all:
   the three doors ahead. A loop: `for step in range(3):` and the lines moved in by
   four spaces run three times; `step` is only a name the loop counts with. The friend
   looks at the three doors alike across the corridor: the same three lines, three
   times, are a loop. Its Try it, which shows what the loop counts:

   ```python try
   for step in range(3):
       print(step)
   ```

   It prints 0, 1 and 2: say so, and say that it starts from 0, as a cell's numbers do.

7. `while`, *While* / *Mientras*. As the design gives it, unchanged in what it says.
   Its Try it:

   ```python try
   while dask.facing == "left":
       wizard.wait()
   ```

8. `kirra-and-osto`, *Light and slabs* / *Luz y losas*. As the design gives it, in the
   two ideas: *kirra* lights the room you are in, so that what lies in the dark can
   be found; a hole in the floor of one cell, a slab that covers it for a few ticks
   and is gone for as many; `slab.in_place`; `while not slab.in_place:` and a wait
   under it; *osto*, cast beside the hole, holds the slab in place. Its Try it,
   beside the hole of the next level, two steps along the corridor:

   ```python try
   wizard.move_right(2)
   print(slab.in_place)
   ```

Each file ends with its Try it block as shown, but for *True or false*. In Spanish, a
comment or a string in the code is in Spanish: `print("Dask mira a la izquierda")`.
