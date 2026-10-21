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
world features it needs that the world does not have yet.

An id is a slug (D44). *T* numbers a lesson, *L* a level, across the
course, only to refer to them here.

## Chapter 1 — Arrival (`01-arrival`)

Ilda meets the new pupils at the gate. The ideas: a program, an action,
an argument, a string, a thing, a spell.

| # | Item | The idea, or what it practises | API it unlocks |
| --- | --- | --- | --- |
| T1 | `lesson:what-a-program-is` | A program is a list of instructions for a computer, done one after the other, from the top down. The wizard does what the program says, exactly. | `wizard.move_right` |
| L1 | `level:the-gate` | One instruction: walk one tile to the gate. Goal: reach it. | |
| T2 | `lesson:your-first-action` | The wizard is an object: a thing in the program that can do things. What it can do are its actions, written with a dot and brackets. Each line is one instruction; more lines, more steps. | `wizard.move_up`, `wizard.move_down`, `wizard.move_left` |
| L2 | `level:the-corridor` | A sequence: three or four instructions, around a corner. Goal: reach the door. | |
| T3 | `lesson:how-much` | An argument: a number in the brackets tells an action how much to do. One line instead of six. | (the moves with a number) |
| L3 | `level:the-long-corridor` | An argument: `move_right(6)`. Goals: reach the end; bonus, in fewer than 2 lines. | |
| L4 | `level:the-stairs` | Arguments in two directions: up, right, up, right. Goal: reach the top. | |
| T4 | `lesson:words` | A string: words in quotes are text, not instructions; the computer keeps them as they are. The wizard can say them. | `wizard.say` |
| L5 | `level:the-password` | Say the gate's word beside the gate: `wizard.say("ambrel")`. Goals: open the gate, walk through. | |
| T5 | `lesson:things-to-carry` | A thing lies on the floor; the wizard stands on its tile and picks it up with an action, and carries it. | `wizard.pick_up` |
| L6 | `level:the-pedestal` | Walk to the wand on its pedestal and pick it up. Goals: carry the wand; reach the end of the room. | |
| T6 | `lesson:your-first-spell` | A spell is a word of magic, cast with the wand. Without the wand the wizard does not know the action; with it, the spell does what its word means where the wizard stands. `zelim` breaks seals. | `wizard.cast` |
| L7 | `level:the-sealed-door` | Pick up the wand, walk to the sealed door, cast `zelim`. Goals: open the door; reach the room. | |
| L8 | `level:the-way-in` | The chapter together: a password door, the wand on the way, two sealed doors. Ten instructions, one per stretch or door. Goals: reach the hall; bonus, in fewer than 11 lines, so with no line to spare. | |

The world features chapter 1 needs: the wand and `wizard.cast`; sealed
doors and password doors (D42, D43); a level's intro on its start card
(D45). Built in sprint 7 (2.13).

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

## Chapter 3 — The passages (`03-passages`)

Night passages, where Dask patrols. The ideas: true and false, `if`,
`else`, `for`, `while`; two spells.

| # | Item | The idea, or what it practises | API it unlocks |
| --- | --- | --- | --- |
| T12 | `lesson:true-or-false` | An expression is a question the computer answers: `3 > 2`, `door.locked`, `teacher.facing == "left"`. The answer is `True` or `False`. | `teacher.facing`, `teacher.position` |
| L16 | `level:the-watchtower` | Print what Dask faces, and whether a door is locked. | |
| T13 | `lesson:if` | A condition: `if` runs its lines only when its expression is true. The lines inside are moved in by four spaces. | (Python's `if`) |
| L17 | `level:the-two-stairs` | The level is played twice, with the door locked once and open once: the same code must win both. | |
| T14 | `lesson:else` | `else`: the lines to run when the condition is false. | (Python's `else`) |
| L18 | `level:left-or-right` | Two ways, one open; the same code wins whichever it is. | |
| T15 | `lesson:repeat` | A loop: `for step in range(4):` repeats its lines a number of times. | (Python's `for`) |
| L19 | `level:the-long-stairs` | The same three moves eight times. | |
| T16 | `lesson:while` | `while` repeats its lines as long as its expression is true: a loop and a condition together. | `wizard.wait` |
| L20 | `level:past-the-teacher` | Today's level, kept: wait while Dask looks this way. | |
| T17 | `lesson:kirra-and-osto` | Two spells: `kirra` lights a dark room; `osto` holds a moving stair. | (the spells `kirra`, `osto`) |
| L21 | `level:the-dark-room` | A dark room to light before its things show. | |
| L22 | `level:the-moving-stairs` | Stairs that move each tick, held with `osto` at the right moment. | |
| L23 | `level:the-night-walk` | The chapter together, past Dask. | |

The world features chapter 3 needs: a level played in several variants
(the same map with things changed), which must all be won, so that a
condition has something to decide; dark rooms whose things are hidden
until lit; tiles that move on a cycle; `teacher.can_see`.

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

## The challenges

Ten levels with no lesson, after the course, each combining more of it,
each with a bonus goal: *The maze* (loops and conditions), *Every book*
(lists), *Dask's round* (`while` and `teacher.can_see`), *The seven
seals* (spells in a loop), *The flood* (flying and timing), *The relay*
(two familiars), *The night library* (light and finding), *The broken
stairs* (moving tiles and functions), *Zarek's revenge* (the race again),
*The last door* (everything). More can be added at any time.

## The count

Twenty-five lessons and thirty-two levels, then ten challenges. The draft
asked for 10 to 20 lessons; one idea per lesson, each with its theory,
asks for more, and each is short: a few pages.
