---
outputs:
  - content/lessons/kirra-and-osto/en.md
  - content/lessons/kirra-and-osto/es.md
  - content/levels/the-opening-hole/text.en.json
  - content/levels/the-opening-hole/text.es.json
  - content/levels/the-night-walk/text.en.json
  - content/levels/the-night-walk/text.es.json
  - content/stories/caught/text.en.json
  - content/stories/caught/text.es.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/while/es.md
  - content/lessons/kirra-and-osto/en.md
  - content/lessons/kirra-and-osto/es.md
  - content/levels/past-the-teacher/text.es.json
  - content/levels/the-opening-hole/text.en.json
  - content/levels/the-opening-hole/text.es.json
  - content/levels/the-dark-room/text.es.json
  - content/levels/the-night-walk/text.en.json
  - content/levels/the-night-walk/text.es.json
  - content/stories/caught/text.en.json
  - content/stories/caught/text.es.json
---
Correct, in English and Spanish, every text of chapter 3 that speaks of the thing in the
floor of the storeroom's corridor and of the way down. The game's owner looked at the picture
and decided: what the child sees is a round hole in the floor that opens and closes, so every
text speaks of a hole, and the code does too (*el dibujo muestra un agujero redondo; cambiemos
los textos; en el código `hole.closed` o `hole.open`*). The present files are given: they still
speak of a slab, a word which is now out of every text. Every text this brief does not change
goes back word for word, every key of it.

## The hole, as every text must say it

These words are the owner's, and are kept as they are:

- In Spanish the thing is *un agujero que se abre en el suelo*. Where it is first explained,
  in the lesson below, it is called *una trampa mágica, o un portal oscuro* (English: *a magic
  trap, or a dark portal*). Every later text speaks of it as *otro de esos agujeros* (English:
  *another of those holes*), or simply *el agujero*.
- No text says *losa*, *slab*, or that anything *va y viene*, *comes and goes*: the hole opens
  and closes, and while it is closed the floor is whole.
- In the code it is `hole`: `hole.open` is `True` while the hole is open, and `hole.closed` is
  `True` while the floor covers it; each is always the opposite of the other. A step onto the
  hole while it is open is not taken: the wizard stops at its edge. *osto*, cast beside the
  hole, holds it closed for a while.
- Waiting for it can be written two ways, which mean the same: `while hole.open:` (wait while it
  is open) and `while not hole.closed:` (wait while it is not closed). The lesson shows both as
  one idea. The levels' hints give `while not hole.closed:`, and say that `while hole.open:` is
  the same; a bonus goal names `closed`.

## How the chapter speaks

The rules you are given hold, and these of the owner's: the thing first, then the word for it,
then an example; a program looks at an attribute, never asks (*preguntar* is out); no text
says that a level is played in several ways, or that the game waits; an outro tells what the
three see next. A metaphor for an idea stands only where the idea is first explained: the
`while` loop and `not` are already known (the lessons *Mientras* and *Verdadero o falso*), so
they are not explained again. Spanish from Spain, natural and warm, for a child of eight. The
friend who teaches chapter 3 speaks the lesson and the levels.

## The lesson *Luz y trampas* / *Light and traps* (`kirra-and-osto`), three pages

It comes after *Mientras* and before *El agujero que se abre*, in the corridor before the
storeroom. Its title is *Luz y trampas*, English *Light and traps*.

1. About *kirra*: as it is, word for word.
2. A page headed *El agujero que se abre* / *The hole that opens*. In these passages there are
   holes that open in the floor: a magic trap, or a dark portal (this is where it is first
   told). The hole is closed for a few ticks, the floor whole over it, and open for as many,
   over and over. `hole.open` is `True` while it is open, `hole.closed` while the floor covers
   it, the one the opposite of the other; so a program waits for it with `while hole.open:`
   or, which is the same, `while not hole.closed:`, a wait underneath, and then takes the step.
   Cast beside the hole, *osto* holds it closed for a while.
3. *Pruébalo* / *Try it*: the present page 3, its words brought to the hole (two steps along the
   corridor, to the edge of the next level's hole, and look whether it is closed), and its
   block exactly:

   ```python try
   wizard.move_right(2)
   print(hole.closed)
   ```

## *El agujero que se abre* / *The hole that opens* (`the-opening-hole`)

Practice 7. The wizard starts at the corridor's left end, by the friends; three cells to the
right one of those holes opens in the floor; past it the mark lies in the storeroom's arch,
two cells beyond the hole. The level is played four ways, the hole opening every three, four,
five or seven ticks, so that no fixed wait crosses in all of them. The solution:

```python
wizard.move_right(2)
while not hole.closed:
    wizard.wait()
wizard.move_right(3)
```

Write its `title` (*El agujero que se abre* / *The hole that opens*), its `goals` (reach the
mark; the bonus: *Comprueba `closed`.* / *Check `closed`.*), its `starting_code` (three
comments, one a step, in the child's words, naming the method of each step and never writing
the program: walk to the hole's edge with `move_right`; wait while the hole is open, with
`while` and `wait`; cross it), its three `hints` (the walk of 2 to the edge; `while not
hole.closed:` with a wait under it, the same as `while hole.open:`; once the loop ends the
floor is whole, so walk 3 right to the arch), its `intro` (here is one of those holes; the
mark is in the storeroom's arch beyond it; we wait while it is open, then cross), its `outro`
as it is, its `learned` (that `while not` waits for something that is not true yet, and that
`hole.closed` says when it is, or `hole.open` the opposite), and its `ways`, which are the
owner's: *Se abre cada tres ticks*, *Se abre cada cuatro ticks*, *Se abre cada cinco ticks*,
*Se abre cada siete ticks* (English *Opens every three ticks*, and so on), keyed `three`,
`four`, `five`, `seven`.

## *El paseo nocturno* / *The night walk* (`the-night-walk`)

Practice 9, the chapter together. The hole here is another of those holes, and it takes the
whole width of the corridor, two cells, so that no one walks round it. Change only these, in
both languages, and keep every other text word for word:

- the last goal: *Comprueba `closed`.* / *Check `closed`.*;
- in the `starting_code`, the comment *# Espera a la losa.* / *# Wait for the slab.* becomes a
  wait while the hole is open, in the same few words; every other comment as it is;
- the second hint: `while not` with `hole.closed` for the hole (or `while hole.open`), and then
  `while` with `dask.facing` for Dask;
- the `intro`: *cruzar el agujero por la losa* / *cross the hole over the slab* becomes crossing
  another of those holes once it closes; the rest as it is.

## *Atrapados* / *Caught* (`caught`), story 4

Change only these two steps, and keep every other step word for word:

- step 4, said by the mate, the dormitory friend: the joke of an excuse that is not one, now
  about the hole: they were only keeping an eye on that hole that opens in the floor, sir,
  with a reason as silly and as funny as the present one. One or two short sentences.
- step 7, the voice: *osto, que sujeta lo que se mueve* / *osto, which holds what moves*
  becomes *osto*, which holds a hole closed; the rest of the step word for word.
