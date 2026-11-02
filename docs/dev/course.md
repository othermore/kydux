# Kydux — the course

The whole course, lesson by lesson, from the first instruction to the
challenges. It follows the owner's rules (plan, phase 5) and D41: one idea
per lesson; the idea's theory first, in a page or two a child of eight
understands, then how the game says it, then *Try it* into the first level
that practises it; each level needs only what the course has taught up to
it (D40); conditions come before loops, each alone, and a loop with a
condition only once both are known. The story is `story.md`'s.

Chapters 1 to 3 are given in full and are built, each in its scene (D65):
its levels are parts of one place, each starting where the one before it
ended, with the friend who teaches standing by (D66). Chapters 4 and 5 are
given at the level of lessons and level titles, each with the world
features it needs, its scene, its stories (D62, D74) and its fix and
improve levels (D56) in outline; each is built in its own sprint. Every
text the child reads is drafted by Gemini from a brief (D55).

An id is a slug (D44). In chapters 4 and 5, *T* numbers a lesson and *L*
a level, across the course, only to refer to them here.

## How a level earns its idea

An idea is taught where the level cannot be solved without it, and the
level shows why. Rule given by the owner on 2026-10-26, from chapter 2's
design:

- **A variable holds a value the program cannot know when it is written,
  or uses more than once.** A key that lies in a different place each
  time the level is played (D51) asks for `steps = key.distance_to(wizard)`,
  and the same `steps` walks there and back. Giving a name to a number
  the child could simply type, as in `steps = 3` for `move_right(3)`, is
  forced, and is never the way a variable is introduced.
- **A method that gives something back is taught on something the wizard
  cannot see.** `find_nearest` earns its place when the key lies hidden
  behind a bookcase and `reveal` shows its outline; on a thing in plain
  sight the child would walk to it and never see why the method exists.
- **A method with a precondition is taught by a level that breaks it,
  or by the hint of the level that needs it.** A door opened from across
  the room is refused, and the hint says a door listens only to who
  stands beside it.
- **The level's story is the reason.** The key is hidden because it fell
  years ago; it moves because someone moves it; the door is far because
  the program is old. The idea and the story agree, so the child remembers
  both.
- **A lesson teaches one idea, and its practice needs that idea alone.**
  A lesson that would teach two ideas is two lessons, each with its
  practice: finding a thing and revealing it, then giving it. Rule given
  by the owner on 2026-10-29, when the lost book's practice asked for
  three ideas at once.
- **A practice's starting code guides the child in comments**, one a
  step, in the child's words, naming the method of each step and never
  writing the program; the child writes the line under each comment
  (the owner, 2026-10-29).
- **Two things are never hidden in the same place**, and a figure that
  appears in a story has a reason to be there that the story says (the
  owner, 2026-10-29).
- **A number the child cannot see is taught with a way to see it.** The
  grid's cells are taught with the naughty child's map, whose spell shows
  their numbers on the scene (D112); the child counts the cells between
  two named ones before any program asks `position`, then reads the
  wizard's own cell, then a thing's. Rule given by the owner on
  2026-10-29.

Each later chapter's design is checked against this before its texts are
briefed: every lesson names the level that needs it, and what in that
level would fail without the idea.

## Chapter 1 — Arrival (`01-arrival`)

It opens with the game's opening, `story:the-letter`: the letter of
admission, the journey, the shut gate at dusk (D61, D78). The chapter is
the game's tutorial, taught at the gate and on the road up by the friend
of the other gender, Nuri for a boy wizard and Teku for a girl wizard
(D77), in the friend's voice; the friend lends the wizard a spare wand. The ideas: a program, an action or
method of an object, a comment, an argument, a string, a thing to carry,
a spell, each named by the easy word and the proper one together (D59).

Its scene, `the-field`, painted (D76): the open countryside before the
school at dusk, with trees, rocks, a little fence pen and a grassy rise
with steps; the school's great gate in the middle of its wall; past it, a
path between trees and rocks, the wand on a flat stone beside it, a gate
sealed by a rune, and at the top the castle, whose great door is sealed
and also listens for the school's word. The gate stays shut until the
password opens it and stays open after; the wand is picked up once, in
*The wand*, and carried from then on.

| Item | Kind | The idea, or what it practises | API or concept it unlocks |
| --- | --- | --- | --- |
| `story:the-letter` | Story 1 | The letter of admission, told in the past at the gate; the journey; the shut gate; then the creator. | |
| `story:at-the-gate` | Story 2 | The shut gate; the friend arrives and offers to teach; the method: try, watch, try again. | |
| `lesson:what-a-program-is` | Lesson 1 | A program is a list of instructions, run from the top down; your program tells your wizard, you, what to do; the round mark is where the wizard must get to. | `wizard.move_right` |
| `level:the-gate` | Practice 1 | One instruction, to the mark before the gate. Its code starts empty. | |
| `lesson:objects-and-actions` | Lesson 2 | An instruction can be an action; an action needs someone to do it; characters and things are objects; an action is a method; the dot and the brackets; the notebook. | `wizard.move_left`, `move_up`, `move_down` |
| `level:the-corridor` | Practice 2 | A sequence, down the path and left onto the meadow's grass. Its code starts empty: comments are taught after it. | |
| `lesson:notes` | Lesson 3 | A note in a program, a comment, is for a person, and the computer skips it; programs may come with notes saying what to do. | `concept:comments` |
| `level:the-dark-note` | Fix 1 | *Fixing the program*: the friend's program with one wrong move, its first, which walks into the grassy bank; its note says one move is wrong. | |
| `lesson:how-much` | Lesson 4 | *How far we move*: the number in the brackets, an argument, says how many steps to take. | `concept:arguments` |
| `level:the-long-corridor` | Practice 3 | Across the meadow to the fence pen: one line with a number. Bonus: fewer than 2 lines. | |
| `level:the-stairs` | Improve 1 | *Back to the gate*: the friend's program walks back to the gate but bumps into it, to make clean (`no_bumps`). Bonus: fewer than 3 lines. | |
| `lesson:words` | Lesson 5 | Words in quotes, a string; `say` takes what to say as its argument, as a move takes how much. | `wizard.say`, `concept:strings` |
| `level:the-password` | Practice 4 | Back at the gate: its word, said beside it, and through, up the path; the code's comment gives the word. | |
| `lesson:things-to-carry` | Lesson 6 | Things are objects with names; the wizard picks up what is on its tile or beside it, and says which when there are several (D58). | `wizard.pick_up` |
| `level:the-wand` | Practice 5 | Past the gate: the friend's spare wand on the flat stone off the path, lent, picked up from beside the stone. | |
| `lesson:your-first-spell` | Lesson 7 | A spell's effect depends on where the wizard stands and what is near, and may be nothing; `cast` is the wand's action; `zelim`. | `wizard.cast` |
| `level:the-sealed-door` | Practice 6 | The wand carried, the sealed gate's rune broken from beside it. | |
| `level:the-way-in` | Practice 7 | The chapter together: the castle's door, sealed and keyed by the school's word, opened with both. Bonus: fewer than 5 lines. | |
| `story:up-to-the-castle` | Story 3 | At the castle's open door; the friend sums up what was learned; the wand is only lent, and a school wand waits at the wand bank; Ilda waits inside. | |

## Chapter 2 — The library (`02-the-library`)

Inside the castle at night, Ilda receives the first-years in the entrance
hall and takes them to their dormitory; there the wizard meets the
dormitory mate, the friend of their own gender, and sleeps. In the
morning both go to the library for a school wand, the mate having none
and the wizard only the friend's spare; Wenna, the librarian, opens her
door to them and teaches on the way, and Eldra, a ghost, has lost her
books. The ideas, each where its level needs it (*How a level earns its
idea*, above): what a thing knows, an attribute; an action that gives
something back, kept under a name, a variable, on a thing the wizard
cannot see; a door and its key; a number the program cannot know when it
is written, the steps to a key that is never twice in the same place,
kept under a name and used twice; a spell that reaches. The wizard
carries the friend's lent wand throughout.

Its scenes (D84): `the-entrance`, the hall at night, for a story;
`the-dormitory`, the common room between the girls' dormitory on the left
and the boys' on the right, the wizard's always the right-hand one, the
other's arch refusing the wizard; and `the-library`: the reading room
and Wenna's door, the bookcases, the wide hall with Eldra's nook and the
door to the top aisle, the top aisle under the high shelves with Eldra's
little room at its left end and the wand bank at its right, and a vault
that stays locked.

| Item | Kind | The idea, or what it practises | API or concept it unlocks |
| --- | --- | --- | --- |
| `story:the-entrance` | Story 1 | Ilda welcomes the first-years in the entrance hall and takes them to their dormitory. | |
| `story:the-first-night` | Story 2 | The common room; Ilda goes out by the door as the friend goes to the other dormitory; the mate, waiting in the wizard's, says their name and asks the wizard's, and goes to bed. | |
| `lesson:the-right-place` | Lesson 1 | Taught by the mate: an action may need the right place; `wizard.sleep()` only beside the trunk at a free bed's foot, its *Try it* refused between the beds. | `wizard.sleep` |
| `level:your-bed` | Practice 1 | In one's own dormitory, between the first two beds: a step to the free bed's trunk, and asleep; the other dormitory's doorway refuses the wizard. Bonus: no bumps. | |
| `story:the-morning` | Story 3 | The mate needs a wand, and the wizard's is lent: out of the door to the library, together. | |
| `story:at-the-library` | Story 4 | Wenna receives them, walks to the shut door into the main library and opens it for them: the other doors on their way they open themselves. | |
| `lesson:what-things-know` | Lesson 2 | An attribute: what an object knows about itself, read without brackets; `print` shows it. | `wizard.items`, `door.locked`, `concept:print` |
| `lesson:finding-things` | Lesson 3 | An action can give something back: `find_nearest` gives the nearest thing of a kind, kept under a name, a variable; `reveal` makes it glow where it lies, through whatever hides it (D110). | `wizard.find_nearest`, `thing.reveal` (and Python's `=`) |
| `level:the-lost-book` | Practice 2 | Eldra's book, by the pile of books in the corner, half behind it (1,13): found, made to glow, picked up from the hall's end just above it; the starting code guides each step in comments. Bonus: made to glow with `reveal`. | |
| `lesson:giving-things` | Lesson 4 | Each level is a new program, so a name kept in the last one is gone: `find_item` gives the thing of a kind the wizard carries, as `find_nearest` gives the nearest on the map; a thing kept under a name is given to whoever stands beside the wizard with `give`. | `wizard.find_item`, `wizard.give` |
| `level:the-book-returned` | Practice 3 | The book in hand from the start, at the hall's left end above the pile: asked for with `find_item`, carried along the hall to its other end and given to Eldra; the starting code guides each step in comments. Bonus: in fewer than 5 lines. | |
| `lesson:keys-and-doors` | Lesson 5 | A locked door opens with `door.open()` beside it, once its key is carried; a thing the wizard cannot see is found all the same, and `reveal` shows it. | `door.open` |
| `level:the-hidden-key` | Practice 4 | The centre door's key lies under the front bookcase, out of sight: found, revealed, picked up from the aisle beside it, the door opened; the starting code guides each step in comments. Bonus: found with `find_nearest`. | |
| `lesson:the-distance` | Lesson 6 | `key.distance_to(wizard)` is a number the program cannot know when it is written: kept under a name and used twice; a level played in several ways, which one program must win (D51). | `thing.distance_to` |
| `level:the-moving-key` | Fix 1 | Eldra's room key lies two to five cells away, in four ways; Wenna's program from yesterday walks four: repaired with `distance_to` kept under a name, it ends with the key in hand. Bonus: no number written. | |
| `lesson:counting-with-names` | Lesson 7 | A number made from a name: `5 - steps`, `steps + 2`, kept under a name or written in the brackets; `print` shows it (D133). | |
| `level:eldras-door` | Improve 1 | The level played again from the start, the repaired program given whole: the key, then the rest of the five cells to the door, `rest = 5 - steps`, open it, and stand before it. The key lies two to five cells away. Bonus: in fewer than 8 ticks, which only the subtraction earns. | |
| `lesson:fendra` | Lesson 8 | A spell that reaches: `wizard.cast("fendra", book)` draws the thing it is told, in a straight line three tiles away at most, to the wizard's tile. | (the spell `fendra`) |
| `level:eldras-room` | Practice 5 | The chapter together: Eldra's other lost book on the bookcase in her little room, among many standing like it, too high for hands: found, revealed, drawn down with *fendra* from the room's doorway, which the spell's line does not pass (D129), picked up, given to her in the aisle; the starting code guides each step in comments. Bonus: revealed with `reveal`. | |
| `story:the-wand-bank` | Story 5 | Eldra's thanks; the school wands; the friend comes out from behind the shelves, there for a book, having known the wizard's voice; the wizard introduces the mate; the spare wand given back; the chapter summed up; at dusk, the rumour of the passages. | |

The world features chapter 2 needs: shelves and bookcases, tiles the
wizard cannot walk on but can see across (D46); `fendra`, which pulls the
thing it is told, in sight, to the wizard's tile (D47); Eldra as an actor who
stands, and `wizard.give` with a `give` goal (D48); the wand carried from
a level's start (D49); a level in several ways (D51); scenes and a friend
(D65, D66); a bed and `wizard.sleep`, and the tiles the wizard may not
step on (D84); a thing drawn where the level says, hidden and revealed
(D85); `distance_to` (D86).

## Chapter 3 — The passages (`03-passages`)

At night, with the friend, through the passages where Dask patrols. The
chapter opens with the naughty child's map: an old map of the castle, drawn
years ago by a pupil who slipped out at night, with every floor in numbered
cells and a spell word in its corner, `orvim`, which with the map carried
shows the cells' numbers on the scene for a moment and every thing and
person with its name and its cell (D112). With it the child learns the
grid: a cell's two numbers, x from the left and y from the top, both from 0;
then reads the wizard's own cell, `wizard.position`, and a thing's,
`key.position`, `dask.position`. The ideas after it: a question with a
true or false answer, an expression; choosing with `if` and `else`, a
condition; repeating with `for` and `while`, a loop; two spells. The walks
are short and straight, with little in the way: the levels' difficulty is
in the counting, the conditions and the waits (owner, 2026-10-29). The
wizard carries the school wand and the map throughout.

Its scenes: `the-passages`, the watchtower's gallery, Dask's round, two
rooms of two doors and the long stairs; and, after a story at the
top, `the-night-passages`, Dask's long corridor, the moving stair, the dark
room and the night walk down to the dormitory. Both are laid out on the
grid before they are painted (D102).

| Item | Kind | The idea, or what it practises | API or concept it unlocks |
| --- | --- | --- | --- |
| `story:after-dark` | Story 1 | Night; the friend at the door with the naughty child's map: the passages, Dask, a map that shows the castle's cells; look before you step. | |
| `lesson:the-cells` | Lesson 1 | The castle's floor is a grid of cells; a cell is named by two numbers, x counted from the left and y from the top, both from 0; a step right adds one to x, a step down adds one to y; with the map, `wizard.cast("orvim")` shows the numbers on the scene for a moment. | `concept:cells` (and the spell `orvim`) |
| `level:the-loose-stone` | Practice 1 | The friend reads the map: we stand at one cell, the loose stone with the hiding place is at another; no mark is shown; count the cells and walk there in two straight moves. Bonus: the map's spell cast. | |
| `lesson:where-i-am` | Lesson 2 | The wizard knows its own cell: `wizard.position`, x and y, an attribute; `print` shows it. | `wizard.position` |
| `level:the-dark-corner` | Practice 2 | The way out of a dark corner is at a cell the friend names; where the wizard stands is not said: print the position, count, walk. | |
| `lesson:where-things-are` | Lesson 3 | Every thing and person knows its cell too: `key.position`, `dask.position`; a thing found with `find_nearest` says with its cell where to walk; the map's spell shows the same names and numbers. | `thing.position`, `teacher.position` |
| `level:the-keys-cell` | Practice 3 | The gallery's door is locked and its key lies somewhere in the room, out of sight: find it, print its cell and the wizard's, count, walk, pick it up, open the door. Bonus: `position` asked. | |
| `lesson:true-or-false` | Lesson 4 | An expression is a question answered `True` or `False`: `3 > 2`, `door.locked`, `dask.facing == "left"`; `not`; a method can answer, `dask.can_see(wizard)` (D54). | `teacher.facing`, `teacher.can_see` |
| `level:the-watchtower` | Practice 4 | Dask stares at the wall: print what he faces and whether he sees the wizard, then walk past. Bonus: the code asks `can_see`. | |
| `lesson:if` | Lesson 5 | A condition: `if` runs its lines, moved in by four spaces, only when its expression is true; `wizard.wait()`; a level played two ways. | `wizard.wait` (and Python's `if`) |
| `level:the-watch` | Practice 5 | Played two ways (D51): Dask looks away, or this way. `if` he looks this way, wait; then cross. | |
| `lesson:else` | Lesson 6 | `else`: the lines to run when the condition is false. | (Python's `else`) |
| `level:left-or-right` | Practice 6 | Played two ways: one of two doors is locked. `if` and `else`. | |
| `level:the-wrong-door` | Fix 1 | Played two ways: the friend's program has its `if` and `else` lines the wrong way round. | |
| `lesson:repeat` | Lesson 7 | A loop: `for step in range(8):` repeats its lines. | (Python's `for`) |
| `level:the-long-stairs` | Improve 1 | The friend's program climbs in sixteen lines; a `for` in fewer than 4. | |
| `story:the-top-of-the-stairs` | Story 2 | The night passages begin; a stair that comes and goes; Dask below. | |
| `lesson:while` | Lesson 8 | `while` repeats its lines as long as its expression is true; a `while` that never ends is stopped by the tick limit. | |
| `level:past-the-teacher` | Practice 7 | Wait while Dask looks this way, then cross his corridor. | |
| `lesson:kirra-and-osto` | Lesson 9 | `kirra` lights a dark room; `osto` holds a moving stair; `stair.in_place` asks whether a step would land. | `stair.in_place` (and the spells `kirra`, `osto`) |
| `level:the-moving-stairs` | Practice 8 | Wait `while not stair.in_place`, then cross (D53). Bonus: the code asks `in_place`. | |
| `level:the-dark-room` | Practice 9 | A dark room (D52): `kirra`, the key found, the door opened. Bonus: the key found with `find_nearest`. | |
| `level:the-night-walk` | Practice 10 | The chapter together: dark, a key and its door, a stair, and Dask on his round below. | |
| `story:caught` | Story 3 | Dask steps out of the dark, and lets them go; the chapter's ideas summed up. | |

The world features chapter 3 needs: the naughty child's map, a thing
carried, and `orvim`, cast only with it, which for a few ticks shows every
cell's numbers and every thing's and person's name and cell on the scene
(D112); a `reach` goal whose mark is not shown; a level played in several
ways, which the same program must win in all of them (D51); dark rooms
whose things are hidden until lit (D52); stairs that come and go, held by
`osto` (D53); scenes and a friend (D65, D66).

## Chapter 4 — The broom (`04-the-broom`)

On the broom field, against Zarek. The ideas: lists, a loop over a list,
an action of one's own, with and without arguments; flying.

| # | Item | The idea, or what it practises | API it unlocks |
| --- | --- | --- | --- |
| T18 | `lesson:lists` | A list keeps several values in order, in square brackets: `wizard.items`, `wizard.find_all("ring")`. | `wizard.find_all`, `wizard.has` |
| L24 | `level:the-shed` | Find every broom part on the floor. | |
| T19 | `lesson:for-each` | `for ring in rings:` does its lines once for each value of a list. | |
| L25 | `level:the-rings` | Fly through every ring, in order. | |
| T20 | `lesson:drevo` | The spell `drevo` lifts the broom; flying crosses what walking cannot. | `wizard.fly` |
| L26 | `level:the-first-flight` | Over the lake's edge. | |
| T21 | `lesson:an-action-of-your-own` | A function: `def` gives a name to some lines, to use them again. | (Python's `def`) |
| L27 | `level:the-loop-the-loop` | The same figure flown four times, as one function. | |
| T22 | `lesson:arguments-of-your-own` | A function can take arguments, as the wizard's actions do. | |
| L28 | `level:the-race` | The race against Zarek, which a clear program wins. | |

The world features chapter 4 needs: the broom and `wizard.fly`; tiles to
fly over and not walk on; a goal of reaching several tiles in order
(`reach_in_order`); an actor with a fixed path to race (Zarek), and a
goal of arriving before it.

Its scene: the broom field behind the castle, its rings and its race
course, and the village's street to the wand shop. Its rewrite: an
opening story, the broom field and the village's wand shop; a closing one, the race won, Zarek a friendly rival, and a wand of
the wizard's own. A fix level follows `for-each`: a loop whose line is not
moved in, so it runs once. `the-loop-the-loop` is an improve level:
the program given writes the figure four times, and the child makes it
one function.

## Chapter 5 — The familiar (`05-the-familiar`)

In the tower, Orla gives the familiars. The ideas: a class, its
attributes, its methods.

| # | Item | The idea, or what it practises | API it unlocks |
| --- | --- | --- | --- |
| T23 | `lesson:a-kind-of-thing` | A class describes a kind of object; the wizard, a door and a key are each of a class. `class Familiar:` describes the child's own. | (Python's `class`) |
| L29 | `level:the-tower-door` | Make a familiar and give it to Orla. | |
| T24 | `lesson:what-it-knows` | `__init__` and `self`: the attributes each familiar has from the start. | |
| L30 | `level:the-name-and-the-kind` | A familiar with a name and a kind, which the tower's door reads. | |
| T25 | `lesson:what-it-does` | A method: an action of the class's own, `def move(self, ...)`. | `wizard.send`, the spell `minka` |
| L31 | `level:the-small-passage` | Send the familiar through a passage too small for a wizard; call it back with `minka`. | |
| L32 | `level:the-end-of-the-year` | The course together. | |

The world features chapter 5 needs: an object of the child's class taken
into the world and its methods called by it, safely (the sandbox's rules
hold for it); tiles only a familiar passes; `wizard.send`.

Its scene: the tower, its stair and its rooms, and the small passages
only a familiar passes. Its rewrite: an opening story, the tower and
the familiars; a closing
one, the end of the first year and the challenges ahead. A fix level
follows `what-it-knows`: an `__init__` that forgets `self`, so the
familiar knows nothing. An improve level follows `what-it-does`: two
familiars made with the same lines twice, made one class.

## The challenges

Ten levels with no lesson, after the course, each combining more of it,
each with a bonus goal: *The maze* (loops and conditions), *Every book*
(lists), *Dask's round* (`while` and `teacher.can_see`), *The seven
seals* (spells in a loop), *The flood* (flying and timing), *The relay*
(two familiars), *The night library* (light and finding), *The broken
stairs* (moving tiles and functions), *Zarek's revenge* (the race again),
*The last door* (everything). More can be added at any time.

## The count

Thirty lessons and thirty-seven levels, thirty-nine with the fix
levels of chapters 4 and 5, then ten challenges. The draft
asked for 10 to 20 lessons; one idea per lesson, each with its theory,
asks for more, and each is short: a few pages.
