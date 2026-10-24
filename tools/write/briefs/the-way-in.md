---
outputs:
  - content/levels/the-way-in/text.en.json
  - content/levels/the-way-in/text.es.json
  - content/levels/the-gate/walked-over.json
context:
  - docs/dev/story.md
  - content/stories/up-to-the-castle/text.en.json
  - content/lessons/your-first-spell/en.md
  - content/lessons/words/en.md
  - content/levels/the-password/text.en.json
  - content/levels/the-sealed-door/text.en.json
  - content/levels/the-sealed-door/text.es.json
  - content/levels/the-way-in/text.en.json
  - content/levels/the-way-in/text.es.json
---
## What the child already knows

This is the last practice of chapter 1, Practice 7, "The way in". Before it
the child has learned what a program and an instruction are, objects and
methods, the four moves, comments, arguments (a move told how far),
strings and `say`, things and `pick_up`, and spells: the wand, `cast` and
*zelim*, the spell that breaks a seal. In the practice before this one,
the sealed door, the child broke a seal with `wizard.cast("zelim")`. In
the password practice, the child opened the school's gate by saying the
school's word, *ambrel*, with `wizard.say("ambrel")`. Nothing is
explained again that a lesson has taught.

## What to write

The texts of the-way-in, in English and in Spanish, as the two JSON files
it has now (given as context), with the same keys: `title`, `goals`,
`starting_code`, `hints` (three), `intro` and `outro`. The friend speaks
in the intro, the hints and the outro, in the voice of the earlier
levels; the friend is `{friend}`, with the friend's gendered words in
double braces, the boy's form first, as the rules say.

The scene: the wizard and the friend stand at the foot of the castle's
steps. Two steps up is the castle's great door. It is sealed by a rune,
and it also listens for the school's word. The rule the game has, which
the texts must get right: **while the seal holds, the door hears no
word**. A word said to it then is lost, and must be said again once the
seal is broken. So the order matters: first the spell, then the word.
The door then opens onto the castle's lit hall, and one more step walks
in. The solution is:

    wizard.move_up(2)
    wizard.cast("zelim")
    wizard.say("ambrel")
    wizard.move_up()

- `goals`: open the castle's door; walk in; the bonus, in fewer than 5
  lines. Keep the three goals' sense; their words may be bettered.
- `starting_code`: one or two comments that say what the door is like
  (sealed, and listening for a word it cannot hear while sealed), never
  the code to write.
- `hints`: three, each a little more help than the one before: where to
  stand; that the seal must be broken before the door can hear, so the
  spell comes first; and the last step into the hall. Name methods by
  their code name in backquotes, as the earlier levels do.
- `intro`: the friend, at the foot of the steps, before the great door:
  wonder, and what the door is like, without giving the code away.
- `outro`: the door open, the lit hall, and walking in together.

The texts now in content/ were corrected by hand to say the rule; write
them anew, in natural, warm prose, as the rules ask, so that they read as
the rest of the chapter does.

Write one more small file, `content/levels/the-gate/walked-over.json`: a
JSON object `{"en": "...", "es": "..."}` holding one sentence the game
shows a child whose program walked the wizard over the round mark it had
to reach and went on past it, so that the run did not win. It says
plainly, without blame, that the wizard went over the mark without
stopping on it, and that the program must end with the wizard on it. The
game shows it under "Not yet: 0 of 1 goals met. Try again." It is said by
the game, not by the friend. The game now says: "You walked over the
mark without stopping on it: your program must end there." and "Has
pasado por la marca sin pararte en ella: el programa tiene que terminar
allí."
