---
outputs:
  - content/stories/the-entrance/text.en.json
  - content/stories/the-entrance/text.es.json
  - content/stories/the-first-night/text.en.json
  - content/stories/the-first-night/text.es.json
  - content/stories/the-morning/text.en.json
  - content/stories/the-morning/text.es.json
  - content/stories/at-the-library/text.en.json
  - content/stories/at-the-library/text.es.json
  - content/lessons/the-right-place/en.md
  - content/lessons/the-right-place/es.md
  - content/lessons/what-things-know/en.md
  - content/lessons/what-things-know/es.md
  - content/lessons/finding-things/en.md
  - content/lessons/finding-things/es.md
  - content/lessons/keys-and-doors/en.md
  - content/lessons/keys-and-doors/es.md
  - content/levels/your-bed/text.en.json
  - content/levels/your-bed/text.es.json
  - content/levels/the-lost-book/text.en.json
  - content/levels/the-lost-book/text.es.json
  - content/levels/the-hidden-key/text.en.json
  - content/levels/the-hidden-key/text.es.json
context:
  - docs/dev/story.md
  - content/stories/up-to-the-castle/text.en.json
  - content/stories/the-entrance/text.en.json
  - content/stories/the-entrance/text.es.json
  - content/stories/the-first-night/text.en.json
  - content/stories/the-first-night/text.es.json
  - content/stories/the-morning/text.en.json
  - content/stories/the-morning/text.es.json
  - content/stories/at-the-library/text.en.json
  - content/stories/at-the-library/text.es.json
  - content/lessons/the-right-place/en.md
  - content/lessons/the-right-place/es.md
  - content/lessons/what-things-know/en.md
  - content/lessons/what-things-know/es.md
  - content/lessons/keys-and-doors/en.md
  - content/lessons/keys-and-doors/es.md
  - content/levels/your-bed/text.en.json
  - content/levels/your-bed/text.es.json
  - content/levels/the-lost-book/text.en.json
  - content/levels/the-lost-book/text.es.json
  - content/levels/the-hidden-key/text.en.json
  - content/levels/the-hidden-key/text.es.json
---
## What changes, and why

The game's owner played the first half of chapter 2, *The library*, and
asked for changes to how it is staged and taught. The texts you are given
are the ones in the game now. Write each file again, in English and in
Spanish, changing **only** what this brief lists for it, and keeping every
other step, sentence, hint and key exactly as it is now, word for word.
Each file keeps the number of steps, pages and hints it has now.

What the game now does, which the texts must follow:

- **Two figures can walk at once.** In the stories, the wizard and a
  friend walk side by side, and a teacher can go to a door, open it, step
  out, close it behind her and walk away down the corridor.
- **The dormitories open on the common room through a doorway** on each
  side, a gap in the wall, not an arch. A level never calls it an arch.
- **The dormitory mate is inside the wizard's dormitory from the start of
  the first night**, waiting by the first bed, under the window. They have
  never met the wizard and do not know the wizard's name before the
  wizard says it.
- **To sleep in a bed, the wizard stands beside the trunk at the foot of
  that bed**, and then sleeps: `wizard.sleep()` lies the wizard down in a
  free bed only from there.
- **A thing found with `find_nearest` is shown with `reveal`**: the thing
  glows where it is, even through whatever hides it, so that the child
  sees where to walk. This is taught with `find_nearest`, in the lesson
  *Finding things*, and used again in *Keys and doors*. No text of these
  files prints or speaks of a thing's position (`position`), which the
  child cannot read: the grid's numbers are not shown to the child.
- In the library, Eldra's lost book now lies on the floor beside the piles
  of books by the left wall, far from her armchair; the key of the locked
  door lies under the big bookcase, where no one can see it.

The rules you are given hold: natural Spanish from Spain, never
American; the wizard's gendered words in single braces, the boy's form
first ({cansado|cansada}); the friend's in double braces
({{cansado|cansada}}); the mate's take the wizard's single braces, as the
mate is of the wizard's gender; `{wizard}`, `{friend}` and `{mate}` for the
names; methods in backquotes; spell names in italics.

## Who is who

The wizard, the child. **{friend}**, the friend met at the gate, of the
other gender, who sleeps in the other dormitory. **{mate}**, the dormitory
mate, of the wizard's own gender. **Ilda**, the teacher who looks after
the first-years. **Wenna**, the librarian. **Eldra**, the old ghost of the
library.

## Stories

A story is played on the scene, step by step; each step is said by the
voice, in a band under the scene ("you" is the wizard), or by a character
in a bubble. Keep each story's number of steps and who says each step.

### content/stories/the-entrance (eight steps)

1. The voice: you and {friend} have just come in through the great door.
   The hall is enormous and bright, the thick red carpet, the armour
   shining in the torchlight. Outside the night is falling, while the
   castle is warm and welcoming. Do not speak of a cold night outside: it
   was dusk at the gate.
2. Ilda: as now.
3. Ilda: as now.
4. The wizard: a child's wonder at how big and beautiful the place is,
   one or two sentences. Nothing of being tired, nothing of where to sleep.
5. {friend}: as now (eager to see everything tomorrow).
6. Ilda: tomorrow will be a long day, so she takes them now to the
   first-year dormitory to rest; follow her, please.
7. The voice: the two of you follow Ilda across the hall, side by side,
   under a chandelier that shines like the stars.
8. Ilda: as now.

### content/stories/the-first-night (nine steps)

On the scene: the common room, the fire, the round rug, a doorway on each
side to a dormitory. The wizard, {friend} and Ilda stand before the door
to the corridor; {mate} waits inside the wizard's dormitory, by the first
bed, out of sight of the common room.

1. The voice: the common room, very quiet, the warm fire crackling, the
   round rug, and a doorway on each side, one to each dormitory.
2. Ilda: as now (which side sleeps where; the common room is shared).
3. Ilda: tomorrow is a long day; good night to the three of them; she
   will see them in the morning.
4. {friend}: as now (good night, {wizard}; so tired; see you tomorrow).
5. The voice: Ilda goes out through the door and closes it behind her,
   and her steps go away down the corridor; {friend} crosses the doorway
   on the left into the other dormitory and stops by a bed.
6. The voice: you cross the doorway on the right into your dormitory,
   between the beds; by the first bed, under the window, someone is
   waiting for you.
7. {mate}: hello; they are {mate}; they think the two of you share this
   dormitory; this bed by the window is theirs, and they think yours is
   the one beside it; and what is your name? Two or three sentences,
   warm, a little shy. Never the wizard's name: {mate} does not know it.
8. The wizard: says their name, `{wizard}`, glad to meet {mate} and to
   share the room, and very tired. One or two sentences.
9. The voice: {mate} goes to the first bed, slips under the sheet and
   falls asleep; in the other dormitory {friend} is asleep already; you
   are tired too, and your bed is the next one: to sleep in a bed, one
   stands beside the trunk at its foot.

### content/stories/the-morning (six steps)

1 to 4 as now. 5, the voice: you leave the dormitory together, across
the common room to the door, {mate} close behind you. 6, the voice: you
open the door and go out into the castle's long corridors with {mate},
on your way to the library.

### content/stories/at-the-library (six steps)

1 to 4 as now. 5, Wenna: she walks to her own little door, which is
shut, and opens it for them; the main library begins behind it. Say it
as she says it while opening it, not as something she did before ("Here
is my own little door. Let me open it for you!"). 6 as now.

## Lessons

Markdown, as now: a `#` title on the first page, pages split by a line
with only `---`, a `##` heading on every page but the first. Keep each
lesson's speaker and its number of pages; the last page ends with exactly
the block given below.

### content/lessons/the-right-place (three pages)

Say the rule exactly: `wizard.sleep()` lies the wizard down in a free bed,
but only when the wizard stands beside the trunk at the foot of that
bed; anywhere else, the wizard wonders why and nothing happens; so a
program walks to the right place first, then does the action. The *Try
it* page: you are in your own dormitory, between the beds, but beside no
bed's trunk; let us see what happens if we try to sleep right here. No
"arch". The block, as now:

```python try
wizard.sleep()
```

### content/lessons/what-things-know (three pages)

The examples of what an object knows are `door.locked` and
`wizard.items`: never `position`. Everything else as now, the try too:

```python try
print(door.locked)
```

### content/lessons/finding-things (four pages, one more than now)

1. As now: some methods do something in the world, others give back
   something, an answer; `wizard.find_nearest("book")` gives the nearest
   book, the thing itself, even very far away.
2. As now: keeping the answer under a name, a variable; `=` puts the
   value under the name and does not ask whether two things are equal;
   `None` when there is none.
3. A new page, "Making it glow": to see which thing the name holds and
   where it is, `book.reveal()` makes it glow where it lies, even through
   whatever hides it, and from then on you know where to walk.
4. "What to do with a thing": `wizard.give(book)` hands it to whoever
   stands right beside the wizard. Eldra, the ghost, has lost a book
   somewhere among the piles by the left wall; let us find it and make it
   glow. No `position`. The block:

```python try
book = wizard.find_nearest("book")
book.reveal()
```

### content/lessons/keys-and-doors (three pages)

1. As now: `door.open()`, only beside the door, and a locked door only
   with its key carried.
2. "Hidden things": a thing out of sight is still there for the program;
   `find_nearest` finds it and `reveal` shows it through whatever hides
   it, as you learned. Do not explain `reveal` again as new.
3. *Try it*: the key of the door ahead fell under the big bookcase long
   ago, and no one has seen it since; let us find it and make it glow.
   The block, as now:

```python try
key = wizard.find_nearest("key")
key.reveal()
```

## Levels

JSON with the keys each file has now: `title`, `goals`, `starting_code`,
`hints` (three, each more help than the one before, never the whole
solution), `intro`, `outro`, `learned`, as now; a key not listed below
stays as it is.

### content/levels/your-bed ("Your bed")

The wizard starts in their dormitory, between the first two beds, where
the first night left them; {mate} sleeps in the first bed. The free bed
is the second, the one below {mate}'s. The solution:

    wizard.move_down()
    wizard.sleep()

- `intro`, by {mate}: this is our dormitory; the free bed is the one
  beside mine; to sleep, stand beside its trunk, and then sleep.
- `starting_code`: one comment, never the code, saying what to do: go to
  the free bed's trunk and sleep.
- `hints`: 1, `sleep` works only beside the trunk at the foot of a free
  bed, and the free bed is the one below {mate}'s; 2, one step down puts
  you beside its trunk; 3, then use the method `sleep`.
- `goals`, `outro`, `learned`: as now.

### content/levels/the-lost-book ("The lost book")

The wizard starts in the reading room, just before Wenna's open door.
Through it, the main room: two long bookcases across it, a passage on the
right side, Eldra's armchair at the top left with Eldra beside it, and
piles of books on the floor by the left wall, below the bookcases. The
book lies there, beside the piles. The solution:

    book = wizard.find_nearest("book")
    book.reveal()
    wizard.move_up(2)
    wizard.move_left(5)
    wizard.pick_up()
    wizard.move_right(9)
    wizard.move_up(4)
    wizard.move_left(7)
    wizard.give(book)

- `intro`, by Wenna: Eldra lost a book long ago; it must be in one of the
  piles on the floor by the left wall; find it with `find_nearest`, make
  it glow, and bring it to her.
- `goals`: two, in this order: give Eldra her book; and the bonus, make
  the book glow with `reveal`.
- `starting_code`: one comment: Eldra's book is somewhere by the piles
  near the left wall; find it and bring it to her.
- `hints`: 1, use `find_nearest` with "book", keep it under a name, and
  `reveal` it; 2, walk to where it glows, two steps up through the door
  and then left along the bookcases, and `pick_up`; 3, go back to Eldra by
  the passage on the right, and use `give` with your variable's name.
- `outro`: as now. `learned`: as now, adding that a revealed thing shows
  where to go.

### content/levels/the-hidden-key ("The hidden key")

The wizard starts beside Eldra's armchair, where the lost book left them.
The locked door to the top aisle is at the top of the room, in the
middle. Its key lies under the big front bookcase, where no one can see
it; the wizard picks it up from the aisle between the two bookcases, right
beside it. The solution:

    key = wizard.find_nearest("key")
    key.reveal()
    wizard.move_down(2)
    wizard.move_left()
    wizard.pick_up()
    wizard.move_right(4)
    wizard.move_up(4)
    door.open()
    wizard.move_up(3)

- `intro`, by Wenna: the way goes on through that locked door; its key
  fell under the big bookcase long ago, where no one can see it; find it,
  show where it is, pick it up, open the door and go through.
- `starting_code`: one comment: the door's key is under the big bookcase.
- `hints`: 1, find the key with `find_nearest` and `reveal` it; 2, walk
  to where it glows, down into the aisle beside the bookcase, and
  `pick_up` from beside it; 3, walk to the locked door, use its `open`
  method, and go through.
- `goals`, `outro`, `learned`: as now.
