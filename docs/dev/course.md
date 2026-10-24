# Kydux — the course

The whole course, lesson by lesson, from the first instruction to the
challenges. It follows the owner's rules (plan, phase 5) and D41: one idea
per lesson; the idea's theory first, in a page or two a child of eight
understands, then how the game says it, then *Try it* into the first level
that practises it; each level needs only what the course has taught up to
it (D40); conditions come before loops, each alone, and a loop with a
condition only once both are known. The story is `story.md`'s.

Chapter 1 is given in full and is built; chapters 2 to 5 are given at the
level of lessons and level titles, and each is built in its own sprint,
where its levels get their maps and goals. Each chapter ends with the
world features it needs that the world does not have yet, and with its
rewrite: the opening and closing story pages it gains (D62) and its fix
and improve levels (D56), in outline. Chapters 2 and 3 are rewritten in
sprint 11, chapters 4 and 5 as they are built. Every text of a rewrite is
drafted by Gemini from a brief (D55).

An id is a slug (D44). *T* numbers a lesson, *L* a level, across the
course, only to refer to them here.

## Chapter 1 — Arrival (`01-arrival`)

Before it, the game's opening, `story:the-letter`: the letter of admission,
the journey, the shut gate at dusk (D61). The chapter is the game's
tutorial, taught by Nuri at the gate and on the road up, in Nuri's voice;
Nuri lends the wizard a spare wand. The ideas: a program, an action or
method of an object, a comment, an argument, a string, a thing to carry,
a spell, each named by the easy word and the proper one together (D59).

| Item | Kind | The idea, or what it practises | API or concept it unlocks |
| --- | --- | --- | --- |
| `story:at-the-gate` | story | The shut gate; Nuri arrives and offers to teach; the method: try, watch, try again. | |
| `lesson:what-a-program-is` | Lesson 1 | A program is a list of instructions, run from the top down; your program tells your wizard, you, what to do. | `wizard.move_right` |
| `level:the-gate` | Practice 1 | One instruction, to the gate. No comment in its code: comments are not taught yet. | |
| `lesson:objects-and-actions` | Lesson 2 | An instruction can be an action; an action needs someone to do it; characters and things are objects; an action is a method; the dot and the brackets; the notebook. | `wizard.move_left`, `move_up`, `move_down` |
| `level:the-corridor` | Practice 2 | A sequence, round a corner. | |
| `lesson:notes` | Lesson 3 | A note in a program, a comment, is for a person, and the computer skips it; programs may come with notes saying what to do. | `concept:comments` |
| `level:the-dark-note` | Fix 1 | A program with one wrong move, to find and fix. | |
| `lesson:how-much` | Lesson 4 | How much: the number in the brackets, an argument. | `concept:arguments` |
| `level:the-long-corridor` | Practice 3 | One line with a number. Bonus: fewer than 2 lines. | |
| `level:the-stairs` | Improve 1 | A program that reaches the top but bumps twice, to make clean (`no_bumps`). Bonus: fewer than 5 lines. | |
| `lesson:words` | Lesson 5 | Words in quotes, a string; `say` takes what to say as its argument, as a move takes how much. | `wizard.say`, `concept:strings` |
| `level:the-password` | Practice 4 | The gate's word, said beside it; the code's comment gives the word. | |
| `lesson:things-to-carry` | Lesson 6 | Things are objects with names; the wizard picks up what is on its tile or beside it, and says which when there are several (D58). | `wizard.pick_up` |
| `level:the-pedestal` | Practice 5 | Nuri's spare wand, lent. | |
| `lesson:your-first-spell` | Lesson 7 | A spell's effect depends on where the wizard stands and what is near, and may be nothing; `cast` is the wand's action; `zelim`. | `wizard.cast` |
| `level:the-sealed-door` | Practice 6 | The wand set down, picked up, and the seal broken. | |
| `level:the-way-in` | Practice 7 | The chapter together, the lent wand in hand from the start: the gate that listens, two seals. Bonus: fewer than 9 lines. | |
| `story:up-to-the-castle` | story | Through the gate, up to the castle; Nuri sums up what was learned; the wand is only lent; Ilda waits inside. | |

## Chapter 2 — The library (`02-the-library`)

Wenna keeps the library; Eldra has lost a book. The ideas: a variable, an
attribute, finding a thing, a key, a spell that brings things.

| # | Item | The idea, or what it practises | API it unlocks |
| --- | --- | --- | --- |
| T7 | `lesson:a-name-for-a-value` | A variable: a name the program gives a value, to use it again. `steps = 4`, then `wizard.move_right(steps)`. | (Python's `=`) |
| L9 | `level:the-reading-room` | The same number of steps three times, kept in a variable. Bonus: the number written once (`numbers_under`). | |
| T8 | `lesson:what-things-know` | An attribute: what an object knows about itself, read without brackets: `wizard.position`, `door.locked`, `wizard.items`, what the wizard carries. `print` shows it. | `wizard.position`, `wizard.items`, `door.locked`, `thing.position` |
| L10 | `level:which-way` | The short way goes through a door, locked with no key in the room: print `door.locked`, then take the long way. Bonus: the code asks the door (`uses`). | |
| T9 | `lesson:finding-things` | An action can give something back: `wizard.find_nearest("book")` gives the nearest book, kept in a variable; and the wizard can give a thing it carries to whoever stands beside it, `wizard.give(book)`. | `wizard.find_nearest`, `wizard.give` |
| L11 | `level:the-lost-book` | Find Eldra's book, bring it, give it to her beside her. Bonus: found with `find_nearest`. | |
| T10 | `lesson:keys-and-doors` | A locked door needs its key, carried, and `door.open()` beside it. | `door.open` |
| L12 | `level:the-locked-door` | Today's level, kept. | |
| L13 | `level:the-archive` | Two doors in a row, one opened by hand, one locked, its key between them. Bonus: the key found with `find_nearest`. | |
| T11 | `lesson:fendra` | A spell can act at a distance: `fendra` draws a thing to the wizard. | (the spell `fendra`) |
| L14 | `level:the-high-shelf` | A book on the top of three shelves, three tiles above the aisle; the wand carried from the start. Stand in line with it and cast. | |
| L15 | `level:eldras-book` | The chapter together: a key and its locked door, the book on a shelf, `fendra`, the book given to Eldra. Bonus: the book kept under a name with `find_nearest` before the spell moves it. | |

The world features chapter 2 needs: shelves, tiles the wizard cannot walk
on but can see across (D46); `fendra`, which pulls the nearest thing in
sight to the wizard's tile (D47); Eldra as an actor who stands and
speaks, and `wizard.give` with a `give` goal (D48); the wand carried from
a level's start (D49). Built in sprint 8 (2.14).

Its rewrite: an opening story page, the way through the castle to the wand
bank, with Nuri's spare wand to give back and the library on the way; a
closing one, Eldra's book returned, a school wand borrowed, and the
chapter's ideas summed up. `the-reading-room` is an improve level:
the program given writes its number three times, and the child keeps it
in a variable. A fix level follows `keys-and-doors`: a program that walks
to the door and opens it before picking up the key.

## Chapter 3 — The passages (`03-passages`)

Night passages, where Dask patrols. The ideas: true and false, `if`,
`else`, `for`, `while`; two spells.

| # | Item | The idea, or what it practises | API it unlocks |
| --- | --- | --- | --- |
| T12 | `lesson:true-or-false` | An expression is a question the computer answers with `True` or `False`: `3 > 2`, `door.locked`, `teacher.facing == "left"`; `not` turns the answer round; an action can answer, `teacher.can_see(wizard)` (D54). | `teacher.facing`, `teacher.position`, `teacher.can_see` |
| L16 | `level:the-watchtower` | Dask stands facing the wall: print what he faces and whether he can see the wizard, then walk past. Bonus: the code asks `can_see`. | |
| T13 | `lesson:if` | A condition: `if` runs its lines only when its expression is true. The lines inside are moved in by four spaces. Its example waits, `wizard.wait()`, the one tick the wizard stands still; and the level after it is played two ways. | `wizard.wait` (and Python's `if`) |
| L17 | `level:the-watch` | Played two ways (D51): Dask walks his short round looking away, or looking this way. `if` he looks this way, wait one tick; then cross. Walking at once is caught in one way, waiting always in the other. | |
| T14 | `lesson:else` | `else`: the lines to run when the condition is false. | (Python's `else`) |
| L18 | `level:left-or-right` | Played two ways: one of two doors is locked, the other open. `if` one is locked go through the other, `else` through it. | |
| T15 | `lesson:repeat` | A loop: `for step in range(4):` repeats its lines a number of times. | (Python's `for`) |
| L19 | `level:the-long-stairs` | The same two moves, up and right, eight times: `for`. Bonus: fewer than 4 lines. | |
| T16 | `lesson:while` | `while` repeats its lines as long as its expression is true: a loop and a condition together; a `while` whose answer never changes is stopped by the tick limit. | |
| L20 | `level:past-the-teacher` | Wait while Dask looks this way, then cross. | |
| T17 | `lesson:kirra-and-osto` | Two spells: `kirra` lights a dark room; `osto` holds a moving stair. A stair is in place for a while and away for as long, and `stair.in_place` asks whether a step now would land. | `stair.in_place` (and the spells `kirra`, `osto`) |
| L21 | `level:the-moving-stairs` | A stair that comes and goes (D53): wait `while not stair.in_place`, then step; `osto` holds it too. Bonus: the code asks `in_place`. | |
| L22 | `level:the-dark-room` | A dark room (D52): the key lies somewhere in it; `kirra` lights it, then `find_nearest` finds the key, and the key opens the door. Bonus: the key found with `find_nearest`. | |
| L23 | `level:the-night-walk` | The chapter together: a dark room, a key and its door, a stair, and Dask on his round below; Dask lets the wizard go on the win card. | |

The world features chapter 3 needs: a level played in several ways,
which the same program must win in all of them, so that a condition has
something to decide (D51); dark rooms whose things are hidden until lit
(D52); stairs that come and go, held by `osto` (D53). Built in sprint 9
(2.15, 2.16).

Its rewrite: an opening story page, the passages at night and Dask on his
round; a closing one, Dask catching the wizard and letting them go, and the
chapter's ideas summed up. A fix level follows `else`: a program whose
`if` and `else` lines are the wrong way round. `the-long-stairs` is an
improve level: the program given climbs in sixteen lines, and the child
makes it a `for`.

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

Its rewrite: an opening story page, the broom field and the village's wand
shop; a closing one, the race won, Zarek a friendly rival, and a wand of
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

Its rewrite: an opening story page, the tower and the familiars; a closing
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

Twenty-six lessons and thirty-three levels, thirty-seven with the fix
levels of the rewrites, then ten challenges. The draft
asked for 10 to 20 lessons; one idea per lesson, each with its theory,
asks for more, and each is short: a few pages.
