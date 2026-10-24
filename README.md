# Kydux

[Versión en español](README.es.md)

**Kydux is a game for learning to program in Python.** A young wizard, just
arrived at a school of magic, has to find a wand, learn spells, earn a broom and
find a way through the castle's corridors and secret passages, and every step
needs a little real Python to take. Each lesson explains one idea of programming,
and the level after it asks the player to use it.

It is part of the [Kidux](https://kidux.org) family, and like Kidux it is free
software under the GNU General Public License, version 3 or later.

## Playing

Kydux runs in a web browser. There is nothing to install yet: for now it
runs only from this repository, as `docs/dev/dev-environment.md` explains.

The first time, the game opens on a story. A letter invites you to
Arvelia, a school of magic, and you travel to its gate. Then you make your
wizard. You give it a name, say whether it is a girl or a boy, and choose
how it looks. The game then calls you by that name.

After that, the game opens on its start screen. *Continue* takes you to
where you left off. The first time, that is the gate, where a friend
called Nuri meets you and teaches you the first steps.

A chapter opens and closes with pages of story. Between them come lessons
and levels, each numbered in the chapter: *Lesson 1*, *Practice 1*, and
so on. A lesson is a few short pages. Each one explains one idea, with an
example. On the last page, *Try it* opens the level that comes next, where
you write your own program. Most levels are practices, a screen to
solve. A *fix* level gives you a program that does not work, to repair. An
*improve* level gives you one that works, to make better.

In a level, you write Python in the editor, on the right. *Run* makes the
wizard do what your code says, on the left. The goals, in the corner,
tick themselves off as you reach them. If a run goes wrong, the game says
why, and *Hint* gives you a clue.

Win the level, and the game gives you up to three stars, and says why.
You keep all three if you need no hint, never bump into a wall, and meet
the bonus goal, or win at the first try when there is none. *Next* takes
you on. The map shows the whole course:
what you have done, what is open, and what is still locked.

The game remembers your progress in the browser. *Export*, on the start
screen, saves it as a file, and *Import* brings it back on another
computer.

## Lessons

The course is told as a story. The wizard arrives at Arvelia, a school of
magic in an old castle, and learns its magic, which is done by writing
Python.

Each lesson explains one idea, starting from what it is and why it exists.
The levels after it practise that idea, and nothing that has not been
explained yet.

Three chapters are ready. The first, *Arrival*, goes from what a program
is to actions, numbers, words, things to carry and the first spell. The
second, *The library*, brings names for values, what things know, finding
things, keys and a spell that reaches. The third, *The passages*, brings
true and false, choosing with `if` and `else`, and repeating with `for`
and `while`. The next chapters bring lists, actions of your own and, last,
objects of your own. They come one chapter at a time.

## Licence

Kydux's code, levels, texts and art are free software: you can redistribute them
and change them under the terms of the GNU General Public License, version 3 or
later (`LICENSE`).
