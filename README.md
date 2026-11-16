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

The first time, the game opens on its welcome page. It tells what the game
is, who it is for and how it is played, with pictures of the game. Its big
*Start playing* button begins the game. The *About* link, at the top of
every screen, opens the welcome page again later.

The game begins with a story. A letter invites you to
Arvelia, a school of magic, and you travel to its gate. Then you make your
wizard. You give it a name, say whether it is a girl or a boy, and choose
how it looks. The game then calls you by that name.

After that, the game opens on its start screen. *Continue* takes you to
where you left off. The first time, that is the gate, where a friend
meets you and teaches you the first steps. The friend is Nuri, a girl, if
your wizard is a boy, and Teku, a boy, if your wizard is a girl.

A chapter opens and closes with a story, told on the scene itself: the
characters walk and talk in speech bubbles, and a narrator speaks under
the picture. *Next*, or the Enter key, goes on. Between the stories come
lessons and levels. Every story, lesson and level is numbered in its
chapter: *Chapter 1 · Story 1*, *Chapter 1 · Lesson 1*, and so on. A lesson is a few short pages, taught
by a character of the story, who stands beside the words. Each page
explains one idea, with an example. On the last page, *Try it* opens the level that comes next, where
you write your own program. Most levels are practices, a screen to
solve. A *fix* level gives you a program that does not work, to repair. An
*improve* level gives you one that works, to make better.

A chapter's levels all happen in one place, a scene: where one level ends,
the next one begins, and the friend who teaches you stands beside you. The
scene is painted, and a thin pencil grid over it helps you count steps.
The scene follows your wizard as it walks. The *+* and *−* buttons, or the
mouse wheel, zoom it, and you can drag it to look around; *Find my wizard*
brings it back.

In a level, you write Python in the editor, on the right. *Run* starts the
level again and makes the wizard do what your code says, on the left. A
round mark that beats on the ground shows where your wizard must get to.
The goals, in the corner, tick themselves off as you reach them. If a run goes wrong, the game says
why, and *Hint* gives you a clue. The first level shows you each part of
the screen, one at a time; the *?* button shows it again. *Notebook*
lists what your wizard can do, each with an example to click. Once you
know a spell or a password, its second tab, *Spells and words*, lists
them too, with what each one does. *Lesson* reads
the level's lesson again, and *Map* opens the map over the level.

Win the level, and the game gives you up to three stars, and says why.
You keep all three if you need no hint, never bump into a wall, and meet
the bonus goal, or win at the first try when there is none. Playing a
level again never takes stars away. *Next* takes you on. The map shows the whole course:
what you have done, what is open, and what is still locked.

The game saves your game in the browser as you play. It keeps several
games, one for each wizard: *Load a game*, on the start screen, lists them,
with where each one is and how long it has been played. *New game* begins
the story again for a new wizard. *Export* saves the game you are playing
as a file, and *Import* brings it back on another computer.

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
