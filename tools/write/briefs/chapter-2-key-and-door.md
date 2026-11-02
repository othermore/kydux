---
outputs:
  - content/levels/the-moving-key/text.en.json
  - content/levels/the-moving-key/text.es.json
  - content/levels/eldras-door/text.en.json
  - content/levels/eldras-door/text.es.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/the-distance/en.md
  - content/lessons/the-distance/es.md
  - content/levels/the-hidden-key/text.en.json
  - content/levels/the-moving-key/text.en.json
  - content/levels/the-moving-key/text.es.json
  - content/levels/eldras-door/text.en.json
  - content/levels/eldras-door/text.es.json
  - content/levels/eldras-room/text.en.json
  - content/levels/eldras-room/text.es.json
---
## What changes, and why

The game's owner tried chapter 2 and found two of its levels a poor pair.
In *The moving key* the child repaired Wenna's old program so that it
fetched the key to Eldra's little room and gave it to Wenna; then, in *The
wrong order*, a level of its own, Wenna gave the key back and the child
fixed a program that opened the door from too far. The key went away and
came back for nothing. Now the two are one tale in two steps:

1. *The moving key* becomes a fix level (Fix 1): yesterday's program walks
   four steps to the key, but the key is never twice in the same place;
   the child repairs it so that it asks the key how far it is, keeps that
   number under a name, walks there and picks the key up. The level ends
   there, the key in hand. Nothing is given to Wenna any more.
2. A new level, *Eldra's door*, an improve level (Improve 1): the program
   the child has just repaired is given to them whole, and they make it do
   more. The level starts again from the beginning, the same place, the
   key again somewhere along the aisle: the repaired program takes the
   key, and then the child adds the rest: come back to where the wizard
   started with the same name, walk to the door, and open it. The level
   ends with the door open and the wizard standing just in front of it.

*The wrong order* goes; what it taught, that a door listens only to who
stands beside it, lives in the new level's second hint.

Write each level's text, in English and in Spanish, as a JSON object with
the keys `title`, `goals` (one sentence a goal, in the order given, the
bonus last), `starting_code` (ending with a newline), `hints` (three, each
a little more precise than the one before, never the whole program),
`intro`, `outro`, `learned` and `ways` (the three ways' names, as now).
Wenna, the librarian, speaks every `intro` and `outro` to the wizard as
"you": precise and quiet, kind. The rules you are given hold: natural,
warm prose; natural Spanish from Spain, never American; the wizard's
gendered words in single braces, the boy's form first; `{wizard}` and
`{mate}` for the names; methods in backquotes; Python never translated,
but comments are. Never explain again an idea the child has learned in a
lesson: say what to do, not what it is. Never speak of a cell's numbers or
a position: the child sees where things are, and the grid comes in
chapter 3. The solutions below are for you to be true to; they never
appear in a text.

What the child knows when these levels start: everything of chapter 1;
`wizard.sleep()`; attributes, `wizard.items`, `door.locked`, and `print`;
`find_nearest`, keeping its answer under a name, and `reveal`;
`find_item` and `give`; a door's `open` method and its key; and, from the
lesson just before, *The distance*: `key.distance_to(wizard)`, a number
the program cannot know when it is written, kept under a name and used
twice, and a level played in several ways that one program must win.

## The scene, for both levels

The library's top aisle. The wizard starts on the aisle, to the right of
Eldra's little room. Along the aisle to the left lies the key to Eldra's
room: near, halfway or far, a different place in each of the three ways
the level is played. At the aisle's left end, above it, is the locked door
of Eldra's little room; the cell just below the door, on the aisle, is
five steps to the left of where the wizard starts. Wenna and `{mate}`
stand on the aisle to the wizard's right.

## content/levels/the-moving-key (Fix 1)

The goals: pick up the key; bonus, write no number at all. Yesterday's
program, the starting code, exactly (its comment translated):

    # This is yesterday's program, but the key has moved!
    key = wizard.find_nearest("key")
    wizard.move_left(4)
    wizard.pick_up()

It walks four steps, which is right in one way only. The solution:

    key = wizard.find_nearest("key")
    steps = key.distance_to(wizard)
    wizard.move_left(steps)
    wizard.pick_up()

- `title`: "The moving key" / "La llave que se mueve", as now.
- `intro`: as now, but without walking back or giving the key to Wenna:
  the key to Eldra's room is never twice in the same place, Wenna thinks
  Eldra moves it; yesterday's program walked four steps, but today the key
  is somewhere else; make the program ask the key how far it is, keep that
  number under a name, and use it to walk there and pick the key up. Two
  or three sentences, by Wenna.
- `hints`: 1, ask the key for its `distance_to` you and keep that number
  under a name; 2, put that name inside the brackets of `move_left`; 3,
  then `pick_up` the key where the walk ends.
- `outro`: the key is in your hand, wherever Eldra left it, and Eldra's
  door is waiting. One or two sentences, by Wenna.
- `learned`: now you know what a variable is for: a number the program
  cannot know when it is written, kept under a name.

## content/levels/eldras-door (Improve 1)

The goals, in this order: pick up the key; open the door; stand in front
of it; bonus, write only one number. The starting code, exactly (the
comments translated): the repaired program of *The moving key*, whole,
then one comment a step, in the child's words, each naming in backquotes
the method that does it, never writing the code:

    key = wizard.find_nearest("key")
    steps = key.distance_to(wizard)
    wizard.move_left(steps)
    wizard.pick_up()

    # Come back to where you started, with `move_right` and the same name.

    # Walk left to the door: it is five steps from where you started.

    # Open it with `open`.

The solution:

    key = wizard.find_nearest("key")
    steps = key.distance_to(wizard)
    wizard.move_left(steps)
    wizard.pick_up()
    wizard.move_right(steps)
    wizard.move_left(5)
    door.open()

What goes wrong, so that the hints help: `door.open()` asked from where
the wizard starts, or from beside the key, is refused, since the door is
far; coming back with a number typed (`move_right(4)`) is right in one way
only.

- `title`: "Eldra's door" / "La puerta de Eldra".
- `intro`, by Wenna, in the owner's own words, made natural: but wait,
  what if, besides taking the key, you want to open the door? Let's
  practise it! Let's try again from the start, but this time, once you
  have the key, go to the door and open it. Say too that the program from
  before is already written for you.
- `hints`: 1, come back with `move_right` and the very same name the walk
  there used, since the program cannot know the number; 2, a door only
  listens to who stands right beside it: walk to it before you open it;
  3, back with the name, five steps left to the door, then `open` it.
- `outro`: the door is open, the key in hand; Eldra's little room is
  waiting. One or two sentences, by Wenna, leading to the next level,
  where Eldra's other book is fetched from that room.
- `learned`: now you know that one name can be used as many times as the
  program needs, and that a program that works can be made to do more.
