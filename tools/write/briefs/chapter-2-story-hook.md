---
outputs:
  - docs/dev/story-hook.es.md
  - docs/dev/the-wizards-way.en.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - drafts/chapter-2/capitulo-2.md
  - content/stories/the-letter/text.es.json
  - content/stories/at-the-gate/text.es.json
  - content/stories/up-to-the-castle/text.es.json
---
This brief is not for texts the child reads. It is for the owner of Kydux,
who designs the game and reads Spanish, and for the story bible,
`docs/dev/story.md`, which every later text is written from. Write as a
storyteller writing for a grown-up who will judge whether the story holds
together and pulls the child on: clear, warm, concrete, never technical,
and never a list of bullet points where a paragraph tells it better.

## What has changed, and why you are writing

The owner has redesigned chapter 2 and wants the whole story to have a
hook: something the children discover that they must act on, which pulls
chapter into chapter until the end. The design document
`drafts/chapter-2/capitulo-2.md` holds the owner's decisions for chapter 2;
read it as the truth for that chapter. The story bible holds the rest, and
chapters 3, 4 and 5 keep their lessons, places and characters, but their
story is to be rewoven round the hook below.

### Chapter 2, as the owner wants it

1. *The entrance.* A story on a new scene, the castle's great entrance
   hall at night: the two new pupils have just come in through the great
   door (the end of chapter 1). Ilda, the teacher, receives the first-year
   pupils and takes them to the first-year dormitory.
2. *The first night.* On the dormitory scene: a common room with a
   fireplace, and a dormitory on each side, one for girls and one for
   boys. The wizard and the friend from the gate (who is of the other
   gender) arrive in the common room; the friend says good night and goes
   to their own dormitory. The wizard cannot go in there (if they try, the
   wizard says they should not go into the girls'/boys' dormitory), so
   they go into their own. There is one other pupil there, of the wizard's
   own gender: the dormitory mate (Teku for a boy wizard, Nuri for a
   girl). They introduce themselves, a few words each; the mate says the
   wizard must be tired and that the bed by them is free: lie down and
   sleep. The level ends when the wizard lies down. The wizard keeps the
   friend's spare wand; the mate has no wand at all.
3. *The morning.* A story in the dormitory: the two wake up; the mate
   says they must go to the library, to the wand bank, to borrow a school
   wand until they can buy one, because they have none. The wizard needs
   one too: theirs is the friend's spare, lent. They go together, and are
   seen leaving through the common room's door.
4. *At the library's door.* They arrive at the library; Wenna, the
   librarian, receives them, opens her own door (the small door in the
   partition behind the reading room, which only she opens) and leads
   them in. From here the library's levels follow, as the design document
   tells them: Eldra's lost book; the key hidden behind Eldra's armchair,
   which opens the door to the top aisle; the key that moves; the old
   program that opens a door from afar; the glowing rare book brought
   down with the spell *fendra*; Eldra's own book from her little room;
   and the wand bank at the end of the top aisle, where both get a school
   wand and the wizard gives the spare back to the friend, who is there
   too. The mate goes with the wizard through all the library.

### The hook, for chapters 3, 4 and 5

- *Chapter 3, the passages, at night.* The friend from the gate, who
  sleeps in the other dormitory, knocks at night and wakes the wizard and
  the mate: they have found that the castle's passages change at night,
  and want to see them. Out they go, where Dask patrols. Somewhere in the
  night passages they overhear a conversation they were not meant to
  hear: someone says there will be an "accident" tomorrow on the training
  field, where the first-years learn to fly; the brooms have been
  tampered with. They cannot tell a teacher, because they should never
  have been out of bed. Dask catches them at the end and lets them go,
  impressed, and they keep the secret.
- *Chapter 4, the broom field.* They go to the training field to stop the
  accident themselves: find the broom that was tampered with among all
  the brooms, learn from someone the spell that lifts a curse from a
  broom, and keep the race against Zarek from ending badly. They win the
  race; Zarek becomes a friendly rival; the accident never happens; but
  they still do not know who did it. (The chapter's ideas are lists, a
  loop over a list, and an action of one's own: the story should give
  those a reason, such as checking every broom.)
- *Chapter 5, the familiar.* In the tower, Orla gives each pupil a
  familiar, and the wizard describes their own: what kind of creature it
  is, what it knows, what it can do. They use the familiar to find out
  who was behind the brooms: something only a small creature can do, such
  as going through a passage too small for a wizard. (The ideas are a
  class, its attributes and its methods.) Decide who was behind it in the
  spirit of the bible's tone: warm, never scary, never cruel; a prank
  that went too far, by someone with a reason, who is sorry at the end.
  Do not make Zarek the culprit; he is the rival who turns friend. You
  may add one new character for it, with a name by the bible's rule for
  names, and say who they are.

Keep every name, place and spell of the bible, and the two friends' rule.
Never name any famous wizard, school of magic or game.

## The files to write

### `drafts/story/historia.es.md`

For the owner, in Spanish. Two parts:

1. *La historia completa*: the whole story from the letter to the end of
   chapter 5 and the challenges, one or two paragraphs for each chapter,
   with the hook running through chapters 3 to 5. Then one short
   paragraph, *El tono*.
2. *El capítulo 2 en detalle*: scene by scene, in the order above: the
   entrance, the first night, the morning, the library's door, then each
   of the six library levels as a beat of story (what the children see,
   what Wenna or Eldra says, why the thing that is learned is needed
   there), and the wand bank. Write it as the story the child will live,
   in the present tense, a paragraph a scene, with a line or two of what
   each character says, in their own voice. Use `{wizard}` for the
   wizard's name and name the friend and the mate as Nuri or Teku
   according to who they are for a girl wizard; say once at the start
   that for a boy wizard the names swap.

Markdown, with `##` headings for the two parts and `###` for each
chapter and scene.

### `drafts/story/the-wizards-way.en.md`

For the story bible, in English, in the bible's own voice: a replacement
for its section *The wizard's way*, with the same shape (the opening,
then one paragraph a chapter with an *opening beat* and a *closing beat*),
rewoven round the hook; then, under a heading *New rows for the tables*,
the rows to add to the bible's places table (the entrance hall and the
dormitory, each with its scene id, `the-entrance` and `the-dormitory`) and
to its characters table if you added a character, in the tables' format.
