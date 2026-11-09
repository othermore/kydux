---
outputs:
  - content/lessons/the-portal/en.md
  - content/lessons/the-portal/es.md
  - content/levels/the-night-walk/text.en.json
  - content/levels/the-night-walk/text.es.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/kirra-and-osto/en.md
  - content/lessons/kirra-and-osto/es.md
  - content/lessons/fendra/en.md
  - content/lessons/fendra/es.md
  - content/levels/the-opening-hole/text.en.json
  - content/levels/the-opening-hole/text.es.json
  - content/stories/the-voices/text.en.json
  - content/stories/the-voices/text.es.json
  - content/levels/the-night-walk/text.en.json
  - content/levels/the-night-walk/text.es.json
  - content/stories/caught/text.en.json
  - content/stories/caught/text.es.json
---
The spell *osto* gets a lesson of its own in chapter 3, and the chapter's last level needs it.
Write the new lesson, in English and Spanish, and the texts of the level *El paseo nocturno*
that change; the rest of that level's texts come back word for word.

## Why

The game's owner wants the child to learn to wait with the loop `while` before any spell spares
the wait: in *El agujero que se abre* the child waits with `while not hole.closed:` for a hole
that opens and closes again and again, and that level knows no spell for the hole. *Luz y
trampas* teaches `kirra`, `hole.open` and `hole.closed`, and no longer speaks of *osto*. After
the story *Voces en el muro*, on the way home, comes a different hole: one that never closes on
its own. No wait ever ends, so the `while` that worked before would wait for ever. The spell
*osto* is the way across, and this lesson teaches it right before the level.

## 1. The lesson *El portal que no se cierra* / *The portal that never closes* (`the-portal`)

Taught by the friend, in the friend's voice, on the way down after *Voces en el muro*: the three
of them stand at the top of the long way down, the hole of the way home ahead of them. Two
pages, separated by a line with only `---`, the first opening with the `#` title, the second
with a `##` heading of its own; **no block of code** on either page (the game's owner: a lesson's
block is for trying an idea of the language, never a spell, and the child casts it in the
level). What the two pages say, as a friend would, for a child of eight:

1. The hole on the way home is not like the one they crossed before. That one closed every few
   ticks, and a `while` waited for it. This one is a dark portal that never closes on its own:
   it stays open, tick after tick, so a `while` that waits for it to close would wait for ever.
   (Say *un portal oscuro* / *a dark portal* here, once, where the idea is first told; from
   then on, *el agujero* / *the hole*.)
2. The spell *osto*: cast with the wand, `wizard.cast("osto")`, from a cell right beside the
   hole, it holds the floor shut over the hole for a while (a few ticks). While it is held, a
   thin crack of light shows round it, and the steps across it land on the floor. So the
   program casts *osto* from the cell before the hole and then walks across at once, before the
   hold ends.

Each page two short paragraphs or three. *osto* is written in italics, as the course writes its
spells, and the code `wizard.cast("osto")` in `inline code`. No numbers of ticks.

## 2. *El paseo nocturno* / *The night walk*: the texts that change

The level: the three of them go home down the long way; the wizard takes the key one step down,
opens the door below, walks two steps down to the cell right before the hole; the hole lies
across the corridor on the next row and **never closes on its own**; from that cell the wizard
casts *osto*, and then walks three steps down at once, across the hole, to the cell before
Dask's corridor; there it waits while Dask looks to the right, and then walks four down to the
mark in the arch below. Its solution, which no text gives away:

```python
wizard.move_down()
wizard.pick_up()
wizard.move_down()
door.open()
wizard.move_down(2)
wizard.cast("osto")
wizard.move_down(3)
while dask.facing == "right":
    wizard.wait()
wizard.move_down(4)
```

Its goals, in this order, and their words (one string each in the JSON's `goals`): pick up the
key; open the door; **hold the hole shut with *osto*** (*Sujeta el agujero con* osto. / *Hold
the hole shut with* osto.); reach the mark in the arch below; not be seen by Dask; and, as the
bonus, **without bumping into anything** (*Sin chocar con nada.* / *Without bumping into
anything.*). The old bonus goal, *Comprueba `closed`.*, is gone.

What changes in its JSON, in both languages:

- `goals`: the six above, in that order. The words of the other four as they are now.
- `intro`, said by the friend: as now, the whole way home together (the key, the door, Dask's
  lantern), but the hole is the one that never closes on its own, held shut with *osto*,
  instead of crossed when it closes. Three or four sentences, the friend's voice.
- `starting_code`: the same comments, one a step, in the child's words, but the comment of the
  hole's wait becomes one that says to hold the hole shut with *osto* (*# Sujeta el agujero con
  osto.* / *# Hold the hole shut with osto.*), and the next one says to walk down across it to
  the cell before Dask's corridor. Never the code itself.
- `hints`: three, as now: the first with the steps to the key and to the hole's edge; the
  second that the hole never closes, so a `while` would wait for ever, and that *osto* cast
  from the cell right before the hole holds it, and then `while` with `dask.facing` for Dask;
  the third that after *osto* it is 3 down to the cell before Dask's corridor, and, once Dask
  turns, 4 down to the arch. No hint gives the whole program.
- `title`, `outro`, `ways` (and any other key): word for word.

## The rules these texts keep

- A program *looks at* an attribute (*mirar*), never *asks*; a spell is a word cast with the
  wand, never a method.
- The words *losa* and *slab* are never used.
- The wizard's Spanish words in braces, the friend's in double braces, as the present files
  have them.

## Your answer

Four files: the lesson in both languages, Markdown, and the level's text in both languages,
JSON.
