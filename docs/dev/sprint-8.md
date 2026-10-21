# Sprint 8 — The library

The second chapter of the course (`plan.md`, phase 5; `course.md`, chapter
2). At the end the wizard walks into Wenna's library, learns to keep a
value under a name, to read what things know about themselves, to ask the
world for a thing and get it back, to open a locked door with its key, and
to draw a book down from a shelf with `fendra`; and gives Eldra her lost
book back. The world gains shelves, a spell that pulls, actors who stand
and speak, giving, and a wizard who starts a level with the wand in hand.

The pieces, in this order: 2.14, 5.4a, 5.4b. The rules of the earlier
sprints hold: pieces in order, `ci/check.sh --e2e` green and one local
commit per piece, never a push, every word for the player through `t()` or
a content file, nothing forbidden and nothing secret, documents and
comments in the present (CLAUDE.md). Section 7 is the owner's acceptance
test.

Phase 4, the art, still waits on the owner's OpenAI key and autosprite.io
account (plan 4.0); the chapter 1 review by the owner is pending too, and
its notes become fixes at the start of sprint 9.

## 1. Decisions taken here

- **D46 — A shelf is a tile that stops feet, not eyes.** The map character
  `=` is a shelf (a low bookcase, a table, a gap): the wizard and the
  actors cannot walk onto it, a thing can lie on it, and sight passes
  over it, for a teacher's cone and for `fendra`. A thing is placed on a
  shelf with `"at": [x, y]`, since a marker letter makes its tile floor.
  `pick_up` takes only what lies on the wizard's own tile, so a thing on a
  shelf can only be brought down by a spell. The sight rule is one in the
  world (`actors.sight_tiles`) and in the page (`sight.ts`), both tested
  on `tests/fixtures/sight.json`, which gains shelves.
- **D47 — `fendra` pulls the nearest thing the wizard can see.** Cast with
  the wand, `fendra` looks along the four directions from the wizard's
  tile, up to three tiles each way, through shelves and not through walls
  or closed doors, and moves the nearest thing that can be carried onto
  the wizard's tile; the nearest by distance, then by reading order, as
  `find_nearest` chooses. The thing moves in a `pull` event (`id`, `from`,
  `to`), the thing's own, in the wizard's tick, as a door's `open` is
  (D43). With nothing to pull, the cast is refused with `nothing_near`,
  tried. The wizard then picks the thing up, as any thing on its tile: a
  spell moves the world, and the hands do the carrying.
- **D48 — Actors who stand and speak, and giving.** An actor of kind
  `ghost` (Eldra) or `cat` (Bimo) stands where it is put, faces one way
  and catches no one; a level may give it a `patrol` later, as the
  teacher has, with no change to the kinds. `wizard.give(thing)` hands a
  thing the wizard carries to the actor on a tile beside the wizard: a
  `give` event (`id`, `to`, `at`); refused with `far` when no actor is
  beside, with `not_carried` when the wizard does not carry the thing.
  The goal `give` (`{"kind": "give", "id": "book", "to": "eldra"}`) is met
  once that thing has been given to that actor. `give` takes the thing as
  an object, so that a variable holding what `find_nearest` gave back is
  what is given: the chapter's idea, used.
- **D49 — A level may hand the wizard things from the start.**
  `"carrying": ["wand"]` in `level.json` lists kinds of things the wizard
  holds at tick 0, each a thing with an id of its kind and no position;
  the start card says so in the goals' words (*You carry your wand*,
  `level.carrying`). The wand earned in chapter 1 is carried into every
  later level that needs it, without a pedestal in each. The world keeps
  no item between levels: each level says what is carried, so that any
  level can be played on its own.

Each goes in `architecture.md`'s log, dated by `date -I`, with its
rationale and what it rules out; the events table gains `pull` and `give`,
and the map characters gain `=`.

## 2. The content, after this sprint

```
content/
  chapters/02-the-library/chapter.json    the items below, in order
  lessons/
    a-name-for-a-value/   T7  a variable: a name for a value, to use it again
    what-things-know/     T8  an attribute: wizard.position, wizard.items, door.locked, print
    finding-things/       T9  an action gives something back: find_nearest; give
    keys-and-doors/       T10 a locked door, its key, door.open()
    fendra/               T11 a spell that acts at a distance
  levels/
    the-reading-room/     L9  the same number three times, as one variable
    which-door/           L10 print which of two doors is locked; go through the other
    the-lost-book/        L11 find Eldra's book, bring it, give it
    the-locked-door/      L12 today's, with Wenna's intro and its slug
    the-archive/          L13 a key found with find_nearest, two doors, one locked
    the-high-shelf/       L14 a book on a shelf, pulled down with fendra
    eldras-book/          L15 the chapter together
```

The chapter's items, in order: `lesson:a-name-for-a-value`,
`level:the-reading-room`, `lesson:what-things-know`, `level:which-door`,
`lesson:finding-things`, `level:the-lost-book`, `lesson:keys-and-doors`,
`level:the-locked-door`, `level:the-archive`, `lesson:fendra`,
`level:the-high-shelf`, `level:eldras-book`.

What each level teaches (`api`), beyond chapter 1's: L9 nothing new (a
variable is Python's); L10 `wizard.position`, `wizard.items`,
`door.locked`, `thing.position`; L11 `wizard.find_nearest`,
`wizard.give`; L12 and L13 `door.open`; L14 and L15 nothing new (`fendra`
is a spell; `wizard.cast` is chapter 1's). Speakers: Wenna for the
library's levels, Eldra for L11 and L15. The wand is carried from the
start in L14 and L15 (D49). L9 has a goal of its own (`goals.py`,
`own_goals`): the number of steps is written once in the code, as a
variable, which `lines_under` cannot say.

## 3. The pieces

### 2.14 The world for chapter 2: shelves, fendra, giving, carrying

**`kydux_world`.** The map character `=` (D46): `Level.shelves`, not free
to walk, clear for sight; `_thing` accepts `at` on a shelf. `ACTOR_KINDS`
gains `ghost` and `cat`, `Actor` subclasses that stand and do not catch;
`api.py` gives them `kind`, `name`, `position`, `facing`. `Wizard.give`
(D48) and the `give` goal (`goals.py`). `fendra` (D47) in `cast`: the
spell's effect looked up by name, so that a later spell is one more entry
and not another branch (`SPELLS` in `world.py`: name to effect, `zelim`
and `fendra` for now). `Level.carrying` (D49): things made with no
position and `carried=True` at tick 0. `explain.py` and the words:
`nothing_near`, `not_carried`, and `far` for `give`. `api.py`'s table
grows with `wizard.give`; the notebook's words in both languages.

**The scene.** A shelf tile drawn (a bookcase seen from above); the
`pull` event: the thing slides to the wizard's tile; the `give` event:
the thing rises from the wizard and vanishes at the actor, who faces the
wizard; the ghost and the cat drawn as placeholders (a pale figure, a
small cat); the start card lists what is carried. `layout.ts` and
`sight.ts` follow the world: shelves in the layout, see-through in
sight; `data-carried` already says what is carried from tick 0.

**Tests.** pytest: a shelf stops a step and not a look; `fendra` pulls
the nearest, through a shelf, not through a wall, nothing near; `give`
beside Eldra, far from her, of a thing not carried; the `give` goal; the
ghost catches no one; `carrying` at tick 0 and in `wizard.items`;
`check_consistency` with pull and give events. Vitest: `sight.ts` on the
new fixture; `words.ts`' new reasons; `layout.ts` with shelves. The
browser: in L14, `fendra` brings the book down and the thought for
nothing near.

### 5.4a The library, to the locked door

**Content.** Lessons T7 to T10 and levels L9 to L13, in both languages,
each level with `level.json`, `text.<lang>.json` (intro from its speaker,
hints, starting code), `solution.py`, three `wrong/`; L12 keeps its map
and gains Wenna's intro and `door.locked` among what it teaches only if
L10 has not (it has: L12 teaches `door.open`). The lessons as D41 says:
the idea's theory first, in a child's words (what a variable is and why a
name is better than the same number three times; what an attribute is
and that it is read, not done; that an action can hand something back,
and that a name keeps it), then the game's way, then Try it. `course.md`
is followed; where a level's map or goals must differ from it to be
playable, `course.md` is updated to say what was built.

**Tests.** The content tests hold as they are (a chapter with lessons
teaches only what its lessons explained, D41; intro and speaker, D45; the
solution within the level's api; three wrong answers; hints never the
solution). `levels.spec.ts` wins each new level with its solution.

### 5.4b The library, the shelf and Eldra's book

**Content.** Lessons T11, levels L14 and L15; L15 brings the chapter
together: a locked door and its key, a shelf with the book, `fendra`, the
book given to Eldra, with an `outro` from Eldra. The wrong answers hold
the mistakes a child makes: `fendra` cast from too far, the book not
picked up after the pull, the book given from across the room.

**Tests.** As 5.4a's; the loop suite needs nothing new. The map test
(`map.spec.ts`) finds chapter 2's stops by item.

## 4. Documents

- `architecture.md`: D46–D49; the events table (`pull`, `give`); the
  child's Python (`wizard.give`, `=` shelves, `carrying`); the actor
  kinds.
- `course.md`: chapter 2's rows say what was built, and its world
  features paragraph is gone, since they are built.
- `plan.md`: phase 5 says sprint 8 has 5.4 and 2.14; phase 2 lists 2.14.
- `README.md` and `README.es.md`: *Lessons* says chapter 2 is ready.
- `dev-environment.md`: nothing new, unless a map character needs a
  word there (it does not: the map's characters are `architecture.md`'s).

## 5. What this sprint leaves out

Chapters 3 to 5 and the challenges. A spell that needs a target
(`cast("fendra", book)`): `fendra` chooses the nearest, so that chapter 2
needs no second argument; a spell with a target comes if a later chapter
asks for one. The art and sound.

## 6. What the owner brings

- The reading of chapter 1 and of `story.md` and `course.md` (sprint 7,
  section 7), with notes; they become fixes at the start of sprint 9.
- For phase 4: `OPENAI_API_KEY` in `~/.config/kydux/secrets.env` and an
  autosprite.io account.

## 7. Acceptance test (for when the owner tries it)

1. On the map, chapter 2, *The library*, has twelve stops and opens once
   chapter 1 is done.
2. Its first lesson explains what a variable is before any code. In *The
   reading room*, the same number written three times wins but misses the
   bonus; written once, as a variable, earns it.
3. In *Which door*, `print(left_door.locked)` shows `True` or `False` on
   the card; the other door leads out.
4. In *The lost book*, `book = wizard.find_nearest("book")` and
   `book.position` say where the book is; given to Eldra beside her, she
   thanks the wizard on the win card.
5. In *The high shelf*, the wizard starts with the wand; `fendra` from
   three tiles away brings the book down to the wizard's tile, through
   the shelf; from farther, the wizard thinks there is nothing near.
6. *Eldra's book* needs everything of the chapter, and nothing of
   chapter 3.
7. The texts in Spanish read naturally for a child of eight; every name
   is `story.md`'s.

## 8. How the implementer works

As in the earlier sprints (sprint-1.md, section 7): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`2.14: shelves, fendra, giving and carrying`), never a push; what this
document leaves open decided the simplest way and said in the commit;
what turns out wrong done the working way and logged in
`architecture.md`; a short report to the owner in Spanish at the end,
with what differs.
