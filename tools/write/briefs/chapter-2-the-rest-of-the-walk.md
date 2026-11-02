---
outputs:
  - content/lessons/counting-with-names/en.md
  - content/lessons/counting-with-names/es.md
  - content/levels/the-moving-key/text.en.json
  - content/levels/the-moving-key/text.es.json
  - content/levels/eldras-door/text.en.json
  - content/levels/eldras-door/text.es.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/what-things-know/en.md
  - content/lessons/the-distance/en.md
  - content/lessons/the-distance/es.md
  - content/lessons/fendra/en.md
  - content/levels/the-moving-key/text.en.json
  - content/levels/the-moving-key/text.es.json
  - content/levels/eldras-door/text.en.json
  - content/levels/eldras-door/text.es.json
  - content/levels/eldras-room/text.en.json
---
## What changes, and why

The game's owner tried chapter 2 again and found a better program for
*Eldra's door* than the one it asked for. The wizard starts on the aisle,
the door of Eldra's little room is five steps to the left, and the key
lies somewhere between them. The level asked the child to walk to the
key, come back to the start with the same name, and then walk the five
steps to the door. The better way is to subtract: the wizard has already
walked `steps` of the five, so the rest is `5 - steps`, and the wizard
walks only the rest. The child should learn that a name can be counted
with, and the level should give its bonus to the shorter way.

So a new lesson comes between *The moving key* and *Eldra's door*: a
number can be made from a name, `5 - steps` or `steps + 2`, kept under a
name of its own or written straight into a method's brackets, and
`print` shows it. The key now lies two, three, four or five steps from
the start, never farther than the door, so the rest is never below zero
(numbers below zero come much later; never speak of them).

Write, in English and in Spanish:

1. the lesson, `content/lessons/counting-with-names/`, Markdown, three
   pages, taught by Wenna;
2. *The moving key*'s level text again, with its intro and its ways'
   names for the key at two to five steps;
3. *Eldra's door*'s level text again, for the subtraction.

The rules you are given hold: natural, warm prose; natural Spanish from
Spain, never American; the wizard's gendered words in single braces, the
boy's form first; `{wizard}` and `{mate}` for the names; methods in
backquotes; Python never translated, but comments are. Never explain
again an idea the child has learned in a lesson: say what to do, not what
it is. Never speak of a cell's numbers or a position: the child sees
where things are, and the grid comes in chapter 3. The solutions below
are for you to be true to; they never appear in a level's text.

What the child knows when the lesson starts: everything of chapter 1
(moves with a number of steps, `say`, comments, arguments, strings);
attributes and `print`; `find_nearest`, keeping its answer under a name
(a variable), and `reveal`; `find_item` and `give`; a door's `open`
method and its key; and, from the last lesson, *How far*:
`key.distance_to(wizard)`, a number the program cannot know when it is
written, kept under a name, and a level played in several ways that one
program must win. They have just repaired *The moving key* with
`steps = key.distance_to(wizard)` and `wizard.move_left(steps)`.

## The scene, for both levels

The library's top aisle. The wizard starts on the aisle, to the right of
Eldra's little room. Along the aisle to the left lies the key to Eldra's
room, two, three, four or five steps away: a different place in each of
the four ways the level is played. At the aisle's left end, above it, is
the locked door of Eldra's little room; the cell just below the door, on
the aisle, is five steps to the left of where the wizard starts, so the
key is never past it. Wenna and `{mate}` stand on the aisle to the
wizard's right.

## content/lessons/counting-with-names (Lesson 7)

A lesson is Markdown: pages separated by a line with only `---`; the
first page opens with its `#` title, the others with a `##` heading; the
last ends with exactly one block fenced ```python try, the example,
shown on that page. Each page short: a few sentences, a line of code or
two in backquotes or a small fenced ```python block where it helps.

- Title: "Counting with names" / "Contar con nombres", or a better one of
  the same meaning.
- Page 1, a number made from a name: once a number is kept under a name,
  the name can be counted with, as the number itself could. If `steps`
  holds the steps the wizard walked, `5 - steps` is a number too: five
  less those steps; and `steps + 2` is another, two more. Say it with
  the story: the door is five steps away, and the key lies on the way.
- Page 2, keeping it or using it at once: the new number can be kept
  under a name of its own, `rest = 5 - steps`, and used as a move's
  argument, `wizard.move_left(rest)`; or written straight into the
  brackets, `wizard.move_left(5 - steps)`. Both walk the same.
- Page 3, *Try it* ("Try it" / "Pruébalo"): let us see how many steps are
  left to the door once the key is reached. The example, exactly:

```python try
key = wizard.find_nearest("key")
steps = key.distance_to(wizard)
print(5 - steps)
```

## content/levels/the-moving-key (Fix 1)

Its text as it is now, but for the intro and the ways' names; keep the
title, goals, starting code, hints, outro and learned (correct only what
the change asks). The goals: pick up the key; bonus, write no number at
all. The starting code, yesterday's program, walks four steps, right in
one way only. The solution:

    key = wizard.find_nearest("key")
    steps = key.distance_to(wizard)
    wizard.move_left(steps)
    wizard.pick_up()

- `intro`: as now, saying that today the key lies somewhere between two
  and five steps away, never twice in the same place.
- `ways`: the four ways' names, by their ids, `two`, `three`, `four`,
  `five`: "The key is two steps away", "three", "four", "five" /
  "La llave está a dos pasos", etc.

## content/levels/eldras-door (Improve 1)

The level starts again from the beginning: the repaired program of *The
moving key* is given whole, and the child makes it do more. The goals,
in this order: pick up the key; open the door; stand in front of it;
bonus, take the shortest way: fewer than 8 steps in all, where each cell
walked, the pick-up and the opening each count as one step (the
subtraction takes 7 in every way; walking back to the start and then the
five takes 11 or more). The starting code, exactly (the comments
translated): the repaired program whole, then one comment a step, in the
child's words, each naming in backquotes what does it, never writing the
code:

    key = wizard.find_nearest("key")
    steps = key.distance_to(wizard)
    wizard.move_left(steps)
    wizard.pick_up()

    # Take the steps you walked from the five to the door, and keep the rest under a name.

    # Walk left the rest, to the door, with `move_left`.

    # Open it with `open`.

The solution:

    key = wizard.find_nearest("key")
    steps = key.distance_to(wizard)
    wizard.move_left(steps)
    wizard.pick_up()
    rest = 5 - steps
    wizard.move_left(rest)
    door.open()

When the key lies five steps away, the rest is zero: `move_left(0)`
walks nothing, and the door is right there; do not dwell on it.

What goes wrong, so that the hints help: `door.open()` asked from
beside the key is refused, since the door is far; walking five more after
the key goes past the door in every way but one; walking back to the
start and then the five wins, but without the bonus.

- `title`: "Eldra's door" / "La puerta de Eldra", as now.
- `intro`, by Wenna: the owner's own words as now ("But wait: what if,
  besides taking the key, you want to open the door? Let's practise it!
  Let's try again from the start, but this time, once you have the key,
  go to the door and open it."), then: the door is five steps from where
  you started, and you have already walked some of them to the key; walk
  only the rest. Say that the program from before is already written.
- `hints`: 1, the door is five steps from the start: the rest is five less
  the steps you already walked, `5 - steps`; 2, a door only listens to who
  stands right beside it: walk to it before you open it; 3, keep `5 -
  steps` under a name, walk left that many, then `open` the door.
- `outro`: the door is open and the key in hand, by the shortest way;
  Eldra's little room is waiting. One or two sentences, by Wenna.
- `learned`: now you know that a number can be made from a name, `5 -
  steps`, kept under a name of its own or written straight into a move.
- `ways`: as *The moving key*'s.
