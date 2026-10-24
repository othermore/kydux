---
outputs:
  - docs/dev/story.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - docs/dev/plan.md
---
Rewrite the story bible of Kydux: the document the writers of every lesson,
level and story page read before they write. You are given the current
bible (docs/dev/story.md), the course (docs/dev/course.md) and the plan,
whose phase 5 says what the owner of the game asked after playing it.

Keep every name of the current bible: the school Arvelia; Ilda, Orla,
Dask, Wenna, Nuri, Zarek, Bimo, Eldra; the spells zelim, fendra, kirra,
osto, drevo, minka; the password ambrel. Keep the chapters, their places
and their ideas, the tone, and the characters' voices. Keep the sections
of the current bible, in English, for writers: *The names*, *The school*
(with its table of places), *The characters* (with its table: id, name,
who, how they speak), *The spells* (with its table), *The wizard's way*
(a paragraph per chapter), *The tone*. Keep the tables in Markdown with
the ids in backticks, as they are.

Add what the owner asked:

- **An opening, before the game's mechanics.** The child receives a letter
  of admission to Arvelia for their first year; the opening tells it, the
  journey, and the arrival at the gate at dusk. The game's tutorial comes
  after, inside the story.
- **The gate, and Nuri.** The wizard reaches the gate and cannot open it:
  they do not know how. Nuri arrives at the same moment, a first-year too,
  of the same gender as the wizard (a girl with a girl, a boy with a
  boy), who grew up among wizards and already knows some magic. Nuri
  offers to show the basics there and then, and becomes the wizard's
  friend. Chapter 1 is that tutorial: Nuri explains what a program is,
  actions, how much, words, carrying things and the first spell, at the
  gate and on the road up, until the gate is opened and the castle
  reached.
- **The wand, lent.** The wizard has no wand. Nuri lends a spare one, to
  be given back. A wizard without a wand can borrow one from the wand
  bank that the parents' association of the school keeps, until they can
  buy one of their own at the wand shop in the village. Getting a wand of
  their own is a thread through the chapters.
- **The wizard grows.** Through the chapters: a wand of their own, a
  broom, friends (Nuri first, then others), a rival who becomes something
  better, a familiar at the end. Say in each chapter's paragraph what the
  wizard gains.
- **Each chapter opens and closes.** For each chapter, say the opening
  beat (where the wizard is, what they want) and the closing beat (what
  they gained, what comes next), so that each chapter can open and close
  with a short story page.
- **The method.** A wizard of Arvelia learns by trying, watching what
  happens, and trying again: say it as part of the school's way, which
  the teachers and Nuri say.

The answer is one file, `docs/dev/story.md`: the whole new bible
in Markdown. It is a document for writers, not for the child, so it is
written in English only and in the bible's dense style.
