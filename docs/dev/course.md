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
  grid's cells are taught with the naughty child's map, whose spell opens
  the scene's plan with every cell numbered (D134); the child counts the
  cells between two named ones before any program asks `position`, then
  reads the wizard's own cell, then a thing's. Rule given by the owner on
  2026-10-29.
- **A question a program asks is one the world answers before the harm.**
  `dask.facing` says which way he looks while there is still time to wait;
  when `dask.can_see(wizard)` is true the wizard is already caught, so no
  level is won by asking it, and it is taught in none (D139). Rule given by
  the owner on 2026-11-05.
- **A loop that waits is forced by ways no fixed number wins.** A level
  that teaches waiting with `while` is played in ways that start the world
  apart, so that no number of waits written in the code wins them all, and
  a test holds it (D137). Rule given by the owner on 2026-11-05.
- **One idea a level, where the ideas come close together.** The crossing
  teaches `wait` alone, then `if` alone, and the two doors `if` and `else`, each
  with its lesson right before it (D146). What a level asks follows from what
  the child sees, never from how many starts a teacher happens to have. Rule
  given by the owner on 2026-11-07.
- **The words speak as a friend does (D141).** The thing first, then the word
  for it, then an example with numbers. A program looks at an attribute and sees
  where it stands; it never asks. A metaphor stands only where its idea is first
  explained, with its programming word beside it; after that the programming word,
  recalled once in parentheses at most. The game's doing is shown, not told. An outro
  tells what the three see next. Every page that shows code lets the child run it
  (D142). Rule given by the owner on 2026-11-07.

- **A function is taught where a loop cannot serve.** The same lines come
  again with something different between them, so that a `for` cannot repeat
  them and the function is called from several places; its arguments are
  taught where the same move comes in different lengths, so that a function
  without them cannot serve either. A `def` whose only reason is a lines goal a
  `for` would meet is never the way a function is introduced (D190). Rule given
  by the owner on 2026-11-10.
- **A race is won by a count the child sees.** Ilda reads each program before
  the start, a tick a line, and every ring missed costs five ticks before the
  finish, so that a shorter program takes off sooner and the child sees why it
  won or lost: the start band shows the lines read, and the card the count
  (D189). Rule given by the owner on 2026-11-10.

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
| `lesson:words` | Lesson 5 | Words in quotes, a string; `say` takes what to say as its argument, as a move takes how much. Two pages and no *Try it* (D174). | `wizard.say`, `concept:strings` |
| `level:the-password` | Practice 4 | Back at the gate: its word, said beside it, and through, up the path; the code's comment gives the word. | |
| `lesson:things-to-carry` | Lesson 6 | Things are objects with names; the wizard picks up what is on its tile or beside it, and says which when there are several (D58). Two pages and no *Try it* (D174). | `wizard.pick_up` |
| `level:the-wand` | Practice 5 | Past the gate: the friend's spare wand on the flat stone off the path, lent, picked up from beside the stone. | |
| `lesson:your-first-spell` | Lesson 7 | A spell's effect depends on where the wizard stands and what is near, and may be nothing; `cast` is the wand's action; `zelim`. Two pages and no *Try it* (D174). | `wizard.cast` |
| `level:the-sealed-door` | Practice 6 | The wand carried, the sealed gate's rune broken from beside it. | |
| `level:the-way-in` | Practice 7 | The chapter together: the castle's door, sealed and keyed by the school's word, opened with both, and the mark on its threshold, whole once the door is open (D172). The hall's cell beyond is forbidden: a longer walk stops on the threshold and the wizard says why, *No entres todavía: quédate en el umbral, pasada la puerta* (D171). Bonus: fewer than 5 lines. | |
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
| `story:the-first-night` | Story 2 | The common room; Ilda says good night to the two before her, who may meet another classmate, and goes out by the door as the friend goes to the other dormitory; the mate, waiting in the wizard's, says their name and asks the wizard's, and goes to bed. | |
| `lesson:the-right-place` | Lesson 1 | Taught by the mate: an action may need the right place; `wizard.sleep()` only beside the trunk at a free bed's foot. Two pages and no *Try it*: sleeping where no bed is teaches nothing, and its last button goes on to the level (D173). | `wizard.sleep` |
| `level:your-bed` | Practice 1 | In one's own dormitory, between the first two beds: a step to the free bed's trunk, and asleep; the other dormitory's doorway refuses the wizard. Bonus: no bumps. | |
| `story:the-morning` | Story 3 | The mate needs a wand, and the wizard's is lent: out of the door to the library, together. | |
| `story:at-the-library` | Story 4 | Wenna receives them, walks to the shut door into the main library and opens it for them: the other doors on their way they open themselves. | |
| `lesson:what-things-know` | Lesson 2 | Eight pages before the lost book. An attribute: what an object knows about itself, read without brackets; `print` shows any value, a number, a sum or a string, run on the page in plain Python, with no wizard (D170). An action can give something back: `find_nearest` gives the nearest thing of a kind. A variable, a name that holds a value, a number or a string, printed; two variables added into a third, printed: both run on the page in plain Python (D170). The thing `find_nearest` gives back kept in a variable, `None` when there is none; `reveal` makes it glow where it lies, through whatever hides it (D110). Its last block keeps the nearest door, the one Wenna opened, and prints its attribute `locked`: `False` (D174). | `wizard.items`, `door.locked`, `concept:print`, `wizard.find_nearest`, `thing.reveal` (and Python's `=`) |
| `level:the-lost-book` | Practice 2 | Eldra's book, by the pile of books in the corner, half behind it (1,13): found, made to glow, picked up from the hall's end just above it; the starting code guides each step in comments. Bonus: made to glow with `reveal`. | |
| `lesson:giving-things` | Lesson 3 | Each level is a new program, so a name kept in the last one is gone: `find_item` gives the thing of a kind the wizard carries, as `find_nearest` gives the nearest on the map; a thing kept under a name is given to whoever stands beside the wizard with `give`. Three pages and no *Try it* (D174). | `wizard.find_item`, `wizard.give` |
| `level:the-book-returned` | Practice 3 | The book in hand from the start, at the hall's left end above the pile: asked for with `find_item`, carried along the hall to its other end and given to Eldra; the starting code guides each step in comments. Bonus: in fewer than 5 lines. | |
| `lesson:keys-and-doors` | Lesson 4 | A locked door opens with `door.open()` beside it, once its key is carried; a thing the wizard cannot see is found all the same, and `reveal` shows it. Two pages and no *Try it* (D174). | `door.open` |
| `level:the-hidden-key` | Practice 4 | The centre door's key lies under the front bookcase, out of sight: found, revealed, picked up from the aisle beside it, the door opened; the starting code guides each step in comments. Bonus: found with `find_nearest`. | |
| `lesson:the-distance` | Lesson 5 | `key.distance_to(wizard)` is a number the program cannot know when it is written: kept under a name and used twice; a level played in several ways, which one program must win (D51). | `thing.distance_to` |
| `level:the-moving-key` | Fix 1 | Eldra's room key lies two to five cells away, in four ways; Wenna's program from yesterday walks four: repaired with `distance_to` kept under a name, it ends with the key in hand. Bonus: no number written. | |
| `lesson:counting-with-names` | Lesson 6 | A number made from a variable: `5 - steps`, `steps + 2`, kept in a variable or written in the brackets; `print` shows it (D133). | |
| `level:eldras-door` | Improve 1 | The level played again from the start, the repaired program given whole: the key, then the rest of the five cells to the door, `rest = 5 - steps`, open it, and stand before it. The key lies two to five cells away. Bonus: in fewer than 8 ticks, which only the subtraction earns. | |
| `lesson:fendra` | Lesson 7 | A spell that reaches: `wizard.cast("fendra", book)` draws the thing it is told, in a straight line three tiles away at most, to the wizard's tile; a spell moves things, and the hands carry them: the thing is picked up once it has come down. Two pages and no *Try it* (D174). | (the spell `fendra`) |
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

At night, with the friend and the mate, through the passages where Dask
patrols. The chapter opens with the naughty child's map, found folded in the
library book: an old map of the castle, drawn years ago by a pupil who
slipped out at night, with every floor in numbered cells and a spell word in
its corner, `orvim`, which with the map carried opens a window over the scene
with the scene's plan, the scene itself drawn in ink with its people as themselves
and every cell's numbers under the pointer, and pauses the run until it is closed
(D134, D143). With it the child learns the grid: a system of coordinates, a cell's
two numbers, x from the left and y from the top, both from 0; then, in a dark tunnel
where nothing is seen, reads the wizard's own cell, `wizard.position`, and hears
that a thing knows its cell too. The ideas after it, one a level: waiting;
attributes that hold a word, comparing, an expression; choosing with `if`, then with
`else`, a condition; repeating with `for` and `while`, a loop; two spells. The walks are short and straight, with little in the way: the levels'
difficulty is in the counting, the conditions and the waits (owner,
2026-10-29). The wizard carries the school wand and the map throughout.

Its scenes (D136) are seven, each one part of the castle's inside at night
with its roof lifted off, twenty by fifteen cells, one a level or a pair of
levels: `the-tunnel`, a corridor of closed doors that turns up to the arch of
a dark tunnel (D135, D145); `the-crossing`, where the tunnel comes out, a corridor
three cells high with its statues, the corridor Dask walks across it, and the
corridor three cells wide that goes down beside the statues; `the-two-doors`, a room with two doors in its bottom wall;
`the-three-doors`, a straight corridor closed by three doors alike;
`the-long-round`, Dask's long corridor crossed by the way down;
`the-storeroom`, a corridor with a hole that opens in its floor, the dark storeroom and
the crack in its wall; and `the-way-down`, laid out on the grid before it is
painted (D102). The next scene starts where the last ended, the arch out of
one being the arch into the next.

| Item | Kind | The idea, or what it practises | API or concept it unlocks |
| --- | --- | --- | --- |
| `story:after-dark` | Story 1 | Night in the dormitory: a knock; the friend at the common room's door with the naughty child's map, found in a book about the castle, handed to the wizard; why the friend was looking; the passages, Dask, the rumours; consult the map at every step; the three go out. | |
| `lesson:the-cells` | Lesson 1 | The map works with a system of coordinates: a cell is named by two numbers, x from the left and y from the top, both from 0; those numbers say how many steps lie between two cells; the map's word, `orvim`, cast with the wand, opens the plan of the place. Three pages and no *Try it*: the spell is cast in the level (D174). | (the spell `orvim`) |
| `level:the-doors-corridor` | Practice 1 | No mark on the floor: the plan names the tunnel's mouth, and two straight moves walk there; the figures fade as they enter. Bonus: the map opened with its spell. | |
| `lesson:where-i-am` | Lesson 2 | Nothing is seen in the dark tunnel, and the wizard still knows its own cell: `wizard.position`, x and y, an attribute; `print` shows it, in the block of its first page; a thing knows its cell too, `key.position`; the program sees what the map does not show. Two pages. | `wizard.position`, `thing.position` |
| `level:the-dark-tunnel` | Practice 2 | Played unseen, from a cell the child has not seen (D152): open the map to find the exit, print the position, count the steps and walk there; nothing is seen to move. Bonus: `position` looked at. | |
| `lesson:waiting` | Lesson 3 | Waiting: `wizard.wait()` lets a tick go by while everything else moves, `wizard.wait(2)` two. One page and no *Try it* (D174). | `wizard.wait` |
| `level:the-tunnel-exit` | Practice 3 | `wait` alone (D146): Dask comes up the crossing from the same place every time, looking up; wait two ticks for him to go by, then walk to the first statue. | |
| `lesson:true-or-false` | Lesson 4 | Five pages, each with code to run: attributes that hold a word, `dask.facing`, `wizard.facing`; comparing with `==`, `True` and `False`; comparing attributes, and an attribute with a literal; `not` says the opposite; a program to change (D139). | `teacher.facing`, `wizard.facing` |
| `lesson:if` | Lesson 5 | A condition: `if` runs its lines, moved in by four spaces, only when its expression is true; its block prints *Looking up* only while Dask looks up, and the wizard's cell always, `print` given two values (D174). Two pages. | (Python's `if`) |
| `level:by-the-statues` | Practice 4 | `if` alone (D146), played two ways: Dask stands in the middle of the gallery, between the first two statues, looking up or down; from the row above him, go down two to pass below him, behind the low wall, when he looks up, or cross straight along the top row, behind him and the statues; then down to the mark at the top of the corridor that goes down. Bonus: ending right on the mark, with a second `if`. | |
| `lesson:else` | Lesson 6 | `else`: the lines to run when the condition is false; its block prints which door we take. | (Python's `else`) |
| `level:left-or-right` | Practice 5 | Played two ways: one of two doors is locked, and no key is anywhere. `if` and `else` with `locked`. | |
| `level:the-wrong-door` | Fix 1 | The same room another night, played two ways: the friend's program has its `if` and `else` lines the wrong way round. | |
| `lesson:repeat` | Lesson 7 | A loop: `for step in range(3):` repeats its lines; the same three lines three times are a loop. | (Python's `for`) |
| `level:the-three-doors` | Improve 1 | Three doors alike across a corridor: the friend's program opens them in nine lines; a `for` in fewer than 5. | |
| `story:beyond-the-doors` | Story 2 | Through the three doors; the stones older here; the friend proud of the loop; Dask's steps below, looking this way a long while; how do we cross if we do not know how long he looks? | |
| `lesson:while` | Lesson 8 | `while` repeats its lines as long as its expression is true; a `while` that never ends is stopped by the tick limit. Two pages and no *Try it* (D174). | (Python's `while`) |
| `level:past-the-teacher` | Practice 6 | Played three ways, Dask a third of his round apart (D137): wait while he faces right, then cross his corridor; no fixed number of waits wins all three. | |
| `lesson:kirra-and-osto` | Lesson 9 | *Light and traps*: `kirra` lights a dark room; a hole that opens in the floor, a magic trap or a dark portal, is open and closed in turn: `hole.open` and `hole.closed` say which, the one the other's opposite, so `while hole.open:` and `while not hole.closed:` are one wait (D167). No spell for the hole: `osto` comes once the `while` is practised (D178). Two pages and no *Try it* (D174). | `hole.open`, `hole.closed` (and the spell `kirra`) |
| `level:the-opening-hole` | Practice 7 | *The hole that opens*, played four ways, the hole opening every three, four, five and seven ticks, so that no fixed wait a child finds by trial crosses in all of them (the first is 29): wait `while not hole.closed` (or `while hole.open`), then cross, into the storeroom still dark (D162). It knows no spell for the hole: `osto` is refused as unknown, and the `while` is the only way (D178). Bonus: the code looks at `closed`. | |
| `lesson:the-two-coordinates` | Lesson 10 | A position's two numbers are its attributes, `position.x` and `position.y`; the steps between two cells are their differences, kept in two variables (D153); its block keeps the wizard's position in a variable and prints its two numbers (D174). | `position.x`, `position.y` |
| `level:the-dark-room` | Practice 8 | A dark room (D52), played three ways with the key on three cells, right of and not above the wizard (D153): `kirra`, the key found, the steps computed from the two numbers, walked, picked up, the door opened from the cell above it, counted the same way. Bonus: `x` used. | |
| `story:the-voices` | Story 3 | The room lit; the crack in its right wall; a cold voice from the stone and an older pupil's: tomorrow's brooms; we stop it ourselves, and first, back to bed unseen. | |
| `lesson:the-portal` | Lesson 11 | *The portal that never closes*: the hole on the way home is a dark portal that never closes on its own, so no wait ends it; *osto*, cast with the wand from a cell beside it, holds the floor shut over it for a while, its crack of light showing it held, and the steps across land. Two pages and no *Try it* (D174, D178). | (the spell `osto`) |
| `level:the-night-walk` | Practice 9 | The chapter together, played three ways: a key and its door, a hole across the corridor's two cells that never closes on its own (`"period": 0`), held shut with *osto* from the cell above it, a goal of its own (D167, D178), and Dask on his last corridor. Bonus: no bumps. | |
| `story:caught` | Story 4 | Dask steps out of the dark, and lets them go, this once; the chapter's ideas summed up; the secret the three share. | |

The world features chapter 3 needs: the naughty child's map, a thing carried,
and `orvim`, which works in any level where the map is carried, needed or not,
opens the plan window and pauses the run (D134, D143, D151); a `reach` goal whose mark is not shown, and one met on the way (D146);
a dark tunnel that hides every figure in it, on the scene and on the plan, and
changes nothing in the world (D135, D145); a lesson's page that runs its code in the
level after it and tells how far the wizard walked, never its cell (D142, D180); doors of two cells (D150), each state of them Gemini's (D148); the cells where the figures walk (D149); a position's two numbers (D153); a teacher who may start anywhere on its patrol, and a level
played in several ways, which the same program must win in all of them (D51,
D137); dark rooms whose things are hidden until lit (D52); a hole that opens in the floor, on one cell or two,
held closed by `osto` (D53, D167), and one that never closes on its own, crossed only with `osto`
(D178); a goal met by a spell cast, not by the word `cast` (D176); lesson blocks that try an idea
of the language, never the wizard (D174); `find_nearest("door")`; scenes and a friend (D65,
D66); and `teacher.can_see` taught in no level of chapters 1 to 3 (D139).

## Chapter 4 — The broom (`04-the-broom`)

By morning, outdoors, the first chapter in daylight since the arrival: the shed where
the class's brooms are kept, the lake's edge, the long ring field and the race
course behind the castle. The three go down before breakfast to undo what the voice
in the walls asked an older pupil to do to the brooms; then Ilda gives the flying
lesson, Zarek boasts, the wizard races him twice, and an older pupil is seen
muttering by the gate. The ideas, one a lesson, each where its level cannot be won
without it: a list, because the brooms are many, some hung on the wall and some
lying in the straw, and their number changes from one way to another; a loop over a
list, because the same is done to each broom and no fixed number of turns wins
every way; an `if` inside the loop,
because untying a broom with no knot is an error; flying, because water is not
walked on; an action of the child's own, a function, because the same two rings
come three times with a different manoeuvre between them, which a loop cannot
repeat; and its arguments, because in the race the move is the same and each
stretch is of another length. The wizard carries the school wand throughout, and
the broom from the first flight on.

Its scenes are four, each by morning with its margins the grounds (lawn, hedges,
trees, the lake, the castle's wall), never sky: `the-broom-shed`, the shed with
its roof lifted off, its inside three rows of boards between the bench and the
hay; `the-lake-edge`, an arm of the lake from top to bottom, a jetty, and the white
stone on the far bank; and two wide ones, forty-two cells by eighteen, which the
camera follows: `the-ring-field`, the long training lawn with a clump of trees and a
pond, and `the-race-course`, the chalk course between its start and its finish.
The brooms and the rings are drawn by the game from a sprite of their kind, where
each level says (D182).

| Item | Kind | The idea, or what it practises | API or concept it unlocks |
| --- | --- | --- | --- |
| `story:the-morning-after` | Story 1 | The dormitory by morning: what the three heard through the crack, and why they tell no one; down to the shed before breakfast, the camera framing the whole shed as they walk in (D199); the shed in disorder, four brooms hung on the rack's pegs and three lying on the bare boards, in sight (D202); the black knotted thread found on a broom by the door; the friend sends the wizard to take the knot off the broom at their feet. The story changes scene, from the dormitory to the shed. | |
| `lesson:the-broom` | Lesson 1 | *The broom and its knot*: a broom is an object; `broom.knotted` says whether the black thread is tied in it, `broom.untie()` takes it off, standing on the broom or under it where it hangs (D195); `find_nearest("broom")` finds it, as it found a key. Page 2: what you find depends on where you stand, by the wall the hung brooms, in the straw the fallen ones (D196). No block (D174). | `broom.untie` |
| `level:the-broom-at-your-feet` | Practice 1 | One broom at the wizard's feet, by the door: find it with `find_nearest`, untie it (D197); two more lie in sight on the boards, not asked for (D202). Bonus: `find_nearest` used. | |
| `lesson:lists` | Lesson 2 | The friend's question, how many are there and how to find them; a list in square brackets, `print` shows it whole, `len` says how many it holds; `wizard.find_all("broom")` gives every broom found from where you stand, nearest first. Page 3, *One of the list*: `nombres[0]` the first, counting from 0 as the cells do, and asking past its end an error the game tells, *the list hasn't that many* (D198). Two blocks: a list and its length; its first and its last. | `wizard.find_all`, `concept:len` |
| `level:the-shed` | Practice 2 | How many brooms lie on the floor? From where the wizard stands, `find_all` finds the brooms lying on the floor, those in sight on the boards and those it uncovers under the straw, on other cells and in other numbers each time (D202); the hung ones are seen at once and are not counted, and a step up to the row under the pegs is stopped with the owner's words (D205). The list printed, its length said. A number typed wins one arrangement; a list said is refused; a walk to the wall is stopped and its count is wrong. Bonus: `print` used. | |
| `lesson:for-each` | Lesson 3 | `for broom in brooms:` runs its lines once for each element of a list, `broom` the next each turn; page 2, `for i in range(len(brooms)):` with `brooms[i]`, the index counting the turns, and when each way is handy (D198). Two pages, each with its block. | (Python's `for` over a list) |
| `level:the-brooms-on-the-wall` | Practice 3 | Three, four or five knotted brooms hung on pegs with gaps between them, on other pegs each time, and two knotted lying on the boards, left for later: up to the row under the pegs and to its right end, then for each broom of the list, nearest first, its `distance_to` (a hung broom as far as the cell under it, D206), that many steps left, and the broom untied. Its goal counts the hung brooms only (`untied` with `zone`, D202); no cell to end on. A step for each broom stops at a gap; a list made in the middle comes from both sides; a list made at the door holds the two on the boards; the steps written out win one arrangement. Bonus: `for` used. | |
| `lesson:checking-each` | Lesson 4 | *An if inside the loop*: an `if` inside a `for`, its lines moved in by eight spaces, so that each turn does one thing or another by the value of that turn. One page; its block prints which name of a list is a cat. It comes right after the wall's brooms, before the comparisons (D217). | `broom.knotted` |
| `level:the-check` | Fix 1 | The wall's own brooms, on the pegs the wall's level hangs in the same arrangement, and still a knot on some of them (D217): the wall's program, given whole, walks from the row's right end by the distance and stops at the first broom with no knot, *this broom has no knot*; untie only `if broom.knotted:`. The two brooms on the boards lie where they lay, for later. Goals: no hung broom knotted, and the run ends with no error; no cell to end on. The card opens with the owner's words. Bonus: `knotted` used. | |
| `lesson:less-or-greater` | Lesson 5 | *Smaller or greater*: `<` and `>` answer `True` or `False`, the sign open towards the greater number, `4 < 4` `False`; `x` grows to the right and `y` downwards, so a smaller `x` is to the left and a smaller `y` higher up; a move takes 0 steps or more, so the program compares first and takes the smaller from the greater, with `if` and `else` (D212). Three pages, each with its block. No `<=`, `>=`, `!=` or `abs`. | (Python's `<` and `>`) |
| `level:the-nearest-broom` | Practice 4 | One broom of the floor, the nearest, found with `find_nearest` from the floor's middle, on the bare boards and on any side, the others farther under the straw (D217): two `if` and `else` with `<`, one for the `x` and one for the `y`, choose the side to walk to, the greater number less the smaller for the steps, and the broom untied; no loop. The starting code is the owner's comments, one for each instruction, the indentation of each block left ready (D218). A walk always left and up wins one arrangement; one that decides the side and always walks up is refused a negative move; the comparison turned round is refused the same; untied before the walk, too far. Bonus: `x` used. | |
| `level:the-brooms-in-the-straw` | Practice 5 | From the floor's first row, three, four or five brooms on the floor, some in sight on the boards and some under the straw (D202), nearest first and each on any side of the one before, at distances all different: in the loop, `x` compared with `<` to walk left or right, `y` to walk up or down, each time the smaller number taken from the greater for the steps, walked, and the broom untied (D212). A walk only left and down is refused a negative move; the comparison turned round and a walk always down are refused the same; the steps written out win one arrangement. The starting code is the owner's comments, one for each instruction, the loop's and the `if`s' indentation left ready (D218); the card opens with the owner's words. No cell to end on. Bonus: `x` used. | |
| `story:the-flying-lesson` | Story 2 | In the shed, every broom untied and back on its peg: the class's voices outside, the friend pockets the black threads; Ilda comes in by the door, the class outside on the path, and sends everyone to the training field with a broom. Then by the lake: Ilda tells the second years to help the first years; Zarek flies in, circles and lands, boasting; Ilda names the word and the first exercise. The story changes scene. | |
| `lesson:drevo` | Lesson 6 | Ilda's: the word `drevo`, cast with the wand and a broom carried, lifts the broom; from then on the moves fly, over water, hedges and fences, three times as fast, never through a wall or a tree; cast again in the air, it sets the broom down where the ground can be stood on, and over the water the program stops; at the program's end the broom sets down by itself (D215). One page and no *Try it*: the spell is cast in the level (D174). | (the spell `drevo`) |
| `level:the-first-flight` | Practice 6 | Walk to the jetty's end, the word, and fly over the water to the white stone; a walk into the water is refused, *water is not walked on*, and `drevo` cast again over the water is refused, the program stopped and the wizard still in the air (D215). Goal: reach the stone. Bonus: land on it with `drevo` before the program ends (`land`). | |
| `lesson:an-action-of-your-own` | Lesson 7 | `def` gives some lines a name, and the programmers call it a function; the name with brackets runs them, wherever it is written and as often, and the lines of the `def` run only when it is called. Its example, shown and not run, is `quick_fly()`: it takes off, flies round a square and lands where it took off. A loop repeats what is the same and follows on, a function serves wherever it is wanted, with other lines between, and reads as what it does: one line says *vuelo rápido* where six stood. No ring is named. Two pages; the second's block defines a greeting and calls it twice with another line between. The notebook's `def` gives `def quick_fly():`, and its arguments `def two_rings(to_second, to_next):`. | `concept:def` |
| `level:the-rings` | Improve 1 | Ilda tells the rule of broom races first (D219): the first ring of a pair flown from below upward, the second from above downward, and a ring flown the other way does not count; every goal with rings repeats it. Three pairs on row 8, red, blue and yellow, from the start (4,9) under the first: the trees between the first two pairs are gone round by above, the pond between the last two flown over, to the white stone (37,9). The given program writes the pair out three times, 19 lines and 58 ticks; with the pair as a function, `def two_rings():` called in the three places, 15 lines, fewer than 16 (D190). A `for` round the pair flies into the trees; a function defined and never called misses the rings; a pair flown down and then up from the row over the rings misses all six, each ring shaking as it is flown against its way. | |
| `lesson:arguments-of-your-own` | Lesson 8 | Names between the `def`'s brackets are the function's arguments; a call gives them values, in the same order, as `move_right(3)` is given its 3, and inside the function the names are worth them. One page; its block greets two names with one function. | `concept:def_arguments` |
| `level:the-race` | Practice 7 | The race in two lanes (D220): the wizard from (6,8) through its eight rings on row 7, columns 7 and 9 (red), 13 and 16 (blue), 21 and 23 (yellow), 27 and 30 (purple), each pair flown up then down (D219), to the finish (31,8), its lane on top so that the finish is clear of the lower flag's pole, which rises to row 10; Zarek from (6,12) through his own on row 11, at the same columns and colours, landing beside that pole, his 18 lines, his lift and 41 cells: tick 60. Ilda's count: a tick a line before the take-off, the flight, five ticks a ring missed (D189); a walked step three ticks (D225). The owner's card says the penalties and that a tie is flown again. `def two_rings(to_second, to_next)` called four times, 11 lines, crosses at 53; the same flight written out, 18 lines, ties at 60, and a tie is not a win; straight to the finish past every ring, 68 flown and 116 walked. The starting code is comments, one for each instruction (D218). Bonus: fewer than 12 lines. | |
| `level:the-rematch` | Improve 2 | The rings moved and Zarek sharper: the race's program flies into a ring's side; the same function with new numbers wins by one tick, and a line more ties, which is Zarek's. | |
| `story:the-finish` | Story 3 | Zarek lands and concedes; Ilda, who found a black thread in the shed's straw, gives the wizard the broom; an older pupil by the gate muttering what gives him away, the one from the crack, unnamed; the voice still a mystery; what the chapter taught. | |

The world features chapter 4 needs: things of a kind drawn from a sprite of their
own on any scene, the broom lying and the ring standing (D182); the broom, a thing
carried from the first flight on, knotted and untied (`broom.knotted`,
`broom.untie()`, `no_knot`), and the goal of no broom knotted (D183); `find_all`
over hidden things, `len`, a number said, and a goal that the number said is the
count of a kind in the way played (D184); flying, `drevo`, every move flown, a flown
step played three times as fast with the wind's sound (D185); cells that a flight
crosses and a walk does not, `low`, and cells neither does, `high` (D186); rings,
flown through vertically and in order, with the rings missed counted (D187); the
wizard's flying rows and the figures of Zarek and Rinlo (D188); a racer with a
fixed path and the race scored by Ilda's count, its start delayed a tick a line and
five ticks a ring missed, and the goal of crossing the finish first (D189); a goal
that the run ends with no error; a landing by `drevo` cast in the air, and the goal of
landing on a cell (D215); a story that
changes scene; and the wide scenes, forty-two cells by eighteen, which the camera
follows.

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

Thirty-five lessons and forty levels, forty-two with the fix and
improve levels of chapter 5, then ten challenges. The draft
asked for 10 to 20 lessons; one idea per lesson, each with its theory,
asks for more, and each is short: a few pages.
