---
outputs:
  - docs/dev/the-wizards-way.en.md
  - docs/dev/story-villain.es.md
context:
  - docs/dev/story.md
  - drafts/chapter-2-story-hook/docs/dev/the-wizards-way.en.md
  - drafts/chapter-2-story-hook/docs/dev/story-hook.es.md
  - drafts/chapter-2-story-hook/REVIEW.md
---
This brief is not for texts the child reads. It is for the story bible,
`docs/dev/story.md`, which every later text is written from, and for its
owner, who reads Spanish.

## What changes

Your earlier draft (given) made the one who tampered with the brooms a
second-year pupil, Rinlo, who was afraid of flying. The owner has decided
otherwise: **the one behind the brooms is a real villain, a truly bad one,
whom everyone believes to be long gone, dead and done with; and these
children begin to suspect that he is alive.** Rewrite the story's hook round
that, from chapter 3 to the end of the course.

Hold to these, which the owner's game needs:

- **The tone stays the game's**: an adventure for children of eight to
  twelve, warm, brave and funny, never frightening. The villain is felt,
  not seen: a voice in the dark, a trace, a broom that was tampered with,
  a name the grown-ups will not say lightly. The children are never hurt
  and never in real danger on screen; what is at stake is the others, the
  school, and being believed. Rewrite the bible's paragraph *The tone* to
  say this, keeping its last sentences (a failure is the code's, never the
  child's).
- **He is Kydux's own.** Never anything like a famous villain of a famous
  book, film or game: no dark lord, no scar, no snake, no hooded army, no
  "he who must not be named", no return from death by a dark ritual, no
  prophecy. Give him a name by the bible's rule for names (a word of
  neither English nor Spanish, easy to say in both, short) and a story of
  his own that fits a school where magic is done by writing instructions:
  for example someone who once wrote the castle's own enchantments, or who
  wanted the castle to obey him alone, and who vanished years ago. Say who
  he was, why everyone believes him gone, what he wants now, and why a
  broom "accident" serves it.
- **The course's shape stays**: chapter 3 at night, where they overhear
  the plan in the passages and Dask catches them and lets them go; chapter
  4 on the training field, where they stop the accident (lists, a loop
  over a list, an action of one's own) and win the race against Zarek, who
  becomes a friendly rival; chapter 5 in the tower, where the familiar
  goes where a wizard cannot (a class, its attributes and methods) and
  finds proof that he is alive. Decide how the course ends: the proof
  found and shown to Orla, who believes them, and the villain still out
  there, for the challenges and the years to come; or caught. Choose the
  one that pulls a child on and does not frighten.
- **Rinlo** goes from the story, or stays as someone the villain used,
  sorry at the end: your choice, said in a sentence.
- Chapters 1 and 2 stay as they are, but chapter 2's closing beat ends at
  dusk with the rumour of the passages, which leads to chapter 3.

## The files to write

### `docs/dev/the-wizards-way.en.md`

In the bible's own voice, in English: the section *The wizard's way*,
replacing the earlier draft (the opening, then one paragraph a chapter with
an *opening beat* and a *closing beat*); then *The tone*, rewritten; then,
under *New rows for the tables*, the rows to add to the places table (the
entrance hall, `the-entrance`; the dormitory, `the-dormitory`) and to the
characters table (the villain, with an id, his name, who he is, how he
speaks; and Rinlo if he stays), in the tables' format.

### `docs/dev/story-villain.es.md`

For the owner, in Spanish, in a storyteller's voice: the whole story from
the letter to the end of chapter 5 and the challenges, a paragraph or two a
chapter, with the villain running through chapters 3 to 5; then a short
paragraph on who the villain is and why he fits Kydux; then *El tono*.
Markdown, with `###` headings for each chapter.
