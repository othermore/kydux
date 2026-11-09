---
outputs:
  - content/stories/at-the-gate/text.en.json
  - content/stories/at-the-gate/text.es.json
  - content/stories/the-wand-bank/text.en.json
  - content/stories/the-wand-bank/text.es.json
context:
  - docs/dev/story.md
  - content/stories/at-the-gate/text.en.json
  - content/stories/at-the-gate/text.es.json
  - content/stories/the-wand-bank/text.en.json
  - content/stories/the-wand-bank/text.es.json
---
Two earlier stories of Kydux change a little, because of chapter 3 and of the end of
the course. Both are given whole. Give them back whole, in English and Spanish, every
step word for word as it is, but for what this brief changes. Each file is a JSON
object, `{"title": "...", "steps": ["...", ...]}`.

## `at-the-gate`

It gains two new steps, right after the step where the wizard says who they are and
asks whether the friend knows how the gate opens (the step that begins *Delighted* /
*¡Encantad{o|a}*), and before the step where the friend says they grew up among
wizards, which stays as it is:

- A new step, said by `{wizard}`: their parents are not wizards, so they know nothing
  of magic.
- A new step, said by `{friend}`: a wizard born to parents without magic is extremely
  rare, a thing to be proud of; the friend's parents are wizards and have taught them
  some things, so the friend can teach `{wizard}` the basics.

In Spanish the wizard's words depend on the wizard, `{un mago|una maga}`, and the
friend's own in double braces. The story has ten steps after this.

## `the-wand-bank`

Only the step where `{friend}` comes out from behind the shelves changes (it begins
*¡{wizard}!*): the friend has come to the library for an old book about the castle's
passages, because of the rumours they have heard, and heard `{wizard}`'s voice through
the shelves. The rest of that step stays. The story keeps its ten steps.
