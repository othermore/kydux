# Sprint 57 — A saved game has a name of its own, and a wizard's gender and look are chosen once

A mini sprint, asked by the owner on 2026-11-21, before the UAT
of chapter 5:

> Las partidas guardadas deben tener nombre. Ahora mismo tienen
> el nombre del mago, pero en el mismo sitio donde se pone el
> nombre del mago hay que poder dar nombre a la partida. El
> nombre debe ser único. Si la partida ya está creada y no tiene
> nombre, la primera vez que se ejecute este código se le
> asignará como nombre el nombre del mago y, si se repite, un
> número secuencial después. Y luego se puede cambiar en el
> mismo sitio donde se cambia el nombre del mago. Y, de paso,
> una vez establecido, el sexo y color del mago no se pueden
> cambiar para que no haya confusión al cambiar los demás
> personajes.

And, on reading this plan, the same day:

> Cuando importas una partida te pregunta el nombre que quieres
> darle. Y al cargar una partida te muestra los nombres que les
> hemos dado.

**Where it is today.**

- *The list.* `GamesStore` (`app/src/progress/games.ts`, D70)
  keeps the list of games under `kydux.games`: an entry is
  `{id, created, played, seconds}`. A game has no name. The
  start screen's list (`gamesList`, `app/src/ui/start.ts`)
  shows each game by its wizard's name, and *Delete* asks with
  it. Two games of two wizards called alike cannot be told
  apart but by their place and their dates.
- *The creator.* `#wizard` (`app/src/ui/wizard.ts`, D36) asks a
  name, a gender and a look. The start screen's
  `#change-wizard` opens it on the wizard made, and all three
  can be changed there.
- *What hangs from the gender and the look.* The words of every
  text (D37), which friend teaches (D77), the colours each
  friend wears all the game (D90) and their portraits (D283).
  A gender or a look changed mid-game changes the other
  characters under the child.

No picture is asked of Gemini, and no text: the new texts are
labels, given here in both languages.

## 1. Decisions taken here

The programmer enters them in `docs/dev/architecture.md` when
built, in the present, and brings D36, D64 and D70 to say the
same.

- **D290 — A saved game has a name of its own, unique among the
  games of the list.** Decided 2026-11-21 by the owner. The name
  is the list's: `GameEntry.name`, kept in `kydux.games`; the
  progress document is as it was, its `version` 1. A name,
  trimmed, is 1 to 30 characters of the kinds a wizard's name
  has (D36). Two names are the same when they are equal trimmed
  and without regard to case; no two games of the list have the
  same name. It is given and changed in the creator, `#wizard`,
  in a field under the wizard's name; *Done* waits for a name
  that is valid and free. The names of the story (D36's reserved
  names) are free to a game. The start screen lists the games by
  their names, and *Delete* asks with it. Rules out the name in
  the progress document: being unique is a property of the list,
  and the entry already holds what is the game's and not the
  course's (begun, last played, seconds). Rules out a name in the
  exported file: the child names a game brought from a file as
  it comes in (D291).
- **D291 — A game with no name takes its wizard's name, and a
  number after it when that is taken.** Decided 2026-11-21 by
  the owner. One rule gives the automatic name, for a wizard's
  name and the names taken: the wizard's name when it is free;
  otherwise the wizard's name, a space and the first number from
  2 that makes it free (*Marta*, *Marta 2*, *Marta 3*). It names
  every game of the list that has a wizard and no name, each
  time the list is opened by `GamesStore`, the game begun first
  taking its name first, and the single document of before the
  list (D70). Elsewhere it is the name offered, which the child
  keeps or changes: in the creator, for a game being made, until
  the child writes a name; and on the start screen, for a game
  brought from a file, whose name is asked before the game
  enters the list. A game named keeps its name. A game with no
  wizard has no name and is not listed, as today.
- **D292 — A wizard's gender and look are chosen once.** Decided
  2026-11-21 by the owner. Once a wizard is made, its name can be
  changed and nothing else of it: the creator shows the gender
  and the look and offers neither, and `setWizard` keeps the
  gender and the look of the wizard made, whatever it is given.
  The words (D37), the friend who teaches (D77) and the friends'
  colours and portraits (D90, D283) are so the same from the
  first page of a game to its last. *New game* begins with no
  wizard (D64), and there all is chosen. Rules out a look changed
  within its gender: the friends' colours follow the look.

## 2. What is asked

### 2.1 The game's name in the store (D290, D291)

- `GameEntry` has `name`. A stored entry without one, or with
  one that breaks the rule, is read as an entry with no name:
  no list of today is lost.
- Beside `wizardName` (`store.ts`): the game's name rule, 30
  characters at most, the same characters. One function gives
  the automatic name (D291) from a wizard's name and the names
  taken; the store and the creator both use it.
- `GamesStore`, when made, after `migrate()`: names the games
  that have a wizard and no name, the oldest `created` first.
  It writes the list only when a name was given.
- `add` takes the name of the game it adds: the one the child
  gave for a file brought in (2.3), the automatic one for the
  migration. It refuses a name that breaks the rule or is
  taken, and adds nothing then.
- A way to name a game: it refuses a name that breaks the rule
  or is another game's, and tells so. The game's own name is
  not taken against itself: *marta* may become *Marta*.
- The facade (`progress.ts`) offers what the creator and the
  start screen need: the name of the game being played, whether
  a name is free for it, and naming it.

### 2.2 The creator (D290, D291, D292)

The page keeps its order: the wizard's name, then the game's
name, then the gender and the look, the preview, the buttons.

- **The game's name.** A field `#game-name` with its label,
  under the wizard's name; `#game-name-rule` and
  `#game-name-taken` beside it, as the wizard's name has its
  two. It takes the same characters, 30 at most.
  - A wizard being made: the field shows the automatic name for
    the wizard's name as typed, and follows it letter by letter,
    until the child writes in the field; from then on it is the
    child's. With the wizard's name not valid it is empty.
  - A wizard made: the field shows the game's name, and changes
    only by the child's hand.
  - *Done* is disabled while the game's name is not valid or is
    another game's; the message says which, as the wizard's name
    does. *Done* names the game and keeps the wizard in one go:
    never one without the other.
  - *Back* and Escape leave the two names as they were.
- **The gender and the look, a wizard being made.** As today,
  and under the looks a note, `#wizard-once`, in the page's
  small type.
- **The gender and the look, a wizard made.** The two groups of
  buttons are not drawn. In their place: the preview with the
  wizard's look, as today, and one sentence, `#wizard-fixed`.
  No button of the page changes the gender or the look.
- `setWizard` (`progress.ts`) keeps the gender and the look of
  a wizard already made (D292): the page is not the only guard.

### 2.3 The start screen

- The list: a game's row has its name in `.game-name`. Under
  it, in `.game-wizard`, the wizard's name, only when the two
  differ without regard to case. The portrait, the place, the
  time, *Play* and *Delete* as today.
- *Delete* asks with the game's name.
- `#saved-note` names the game being played.
- *Import* asks the game's name. Once the file is read and is a
  game with a wizard (the file's, or the one being played when
  the file has none), nothing is added yet: under the *Export*
  and *Import* buttons a small form opens, `#import-form`, with
  its question, the field `#import-name` filled with the
  automatic name for that wizard (D291) and focused, the rule
  and the name-taken message of the creator's field
  (`#import-name-rule`, `#import-name-taken`), and two buttons,
  `#import-done` and `#import-cancel`. `#import-done` is
  disabled while the name is not valid or is a game's of the
  list; Enter in the field presses it. It adds the game with
  that name, and the screen is drawn again with the game being
  played, as today. `#import-cancel` and Escape close the form:
  nothing is added and nothing changes. A file that is no game
  shows today's message and no form. A game with no wizard at
  all is added with no name, as today: the creator names it.
- `#change-wizard` keeps its id and its place; its words say
  what it does today: the names.

### 2.4 The texts

Labels, written by the designer; enter them as they are. `{name}`
is the game's name.

| Key | English | Spanish |
|---|---|---|
| `wizard.game_name` | Your game's name | El nombre de tu partida |
| `wizard.game_name_rule` | A name has letters, digits, spaces, hyphens and apostrophes, up to 30 of them. | Un nombre puede tener letras, números, espacios, guiones y apóstrofos, hasta 30. |
| `wizard.game_name_taken` | You already have a game with that name. Choose another. | Ya tienes una partida con ese nombre. Elige otro. |
| `wizard.once` | Choose calmly: later you can change the names, but not who your wizard is or their look. | Elige con calma: después podrás cambiar los nombres, pero no cómo es tu personaje ni su aspecto. |
| `wizard.fixed` | Who your wizard is and their look are chosen once, when the game begins. | Cómo es tu personaje y su aspecto se eligen una sola vez, al empezar la partida. |
| `start.import_name` | What name do you give this game? | ¿Qué nombre le pones a esta partida? |
| `start.import_done` | Import it | Importarla |
| `start.import_cancel` | Cancel | Cancelar |
| `start.saved` | Your game, “{name}”, is saved as you play. | Tu partida, «{name}», se guarda sola mientras juegas. |
| `start.delete_confirm` | Delete the game “{name}”? It cannot be brought back. | ¿Borrar la partida «{name}»? No se podrá recuperar. |
| `start.change_wizard` | Change the names | Cambiar los nombres |

The user guide, `README.md` and `README.es.md` in sync, says in
its lines on the saved games, in short sentences: each game has
a name; it is given with the wizard's name and can be changed
from the start screen; no two games have the same name; *Import*
asks the name of the game it brings; who the wizard is and its
look are chosen once, at the start of a game.

### 2.5 The documents

`docs/dev/architecture.md`: D290, D291 and D292 entered; D36
(the creator offers the names of a wizard made, not its gender
or look; *Change my wizard*'s words), D64 and D70 (the entry's
name, the list by names) in the present. `docs/dev/plan.md`:
its 2.7 (the entry's name) and its lines on the saved games
(*A game per wizard…*), in the present. The comments at the
head of `games.ts`, `wizard.ts` and `start.ts`.

### 2.6 The tests

- `games.test.ts`: a list of today (entries with no name) read
  and named, the oldest first; two wizards called alike give
  *Marta* and *Marta 2*, a third *Marta 3*; a named game keeps
  its name; a second opening of the list changes nothing; a
  game with no wizard is left with no name; `add` adds with the
  name given and refuses one taken; the migration names by the
  rule; naming refuses another game's name, in any case of
  letters, and takes the game's own; an entry with a bad name
  is read with none.
- `store.test.ts` or `progress.test.ts`: the game's name rule;
  `setWizard` on a wizard made keeps its gender and look.
- `wizard.spec.ts`: a wizard being made, the game's name follows
  the wizard's name and stops following once written in; a
  second game for a wizard called like the first is offered
  *… 2*; a name of another game disables *Done* and shows the
  message; a wizard made, the page shows both names, no gender
  and no look to choose, and `#wizard-fixed`; a game's name
  changed there shows in the list; *Back* and Escape leave both
  names. The test *Change my wizard opens it as it is* is
  rewritten to this.
- `start.spec.ts`: the list by the games' names, the wizard's
  name under one that differs, *Delete* asking with the game's
  name (the dialog's message read), `#saved-note` with the name;
  a file brought in opens the form with the automatic name, its
  number when a game of the list is called alike; a name of the
  list disables `#import-done` and shows the message; a name
  written there is the game's in the list; *Cancel* and Escape
  add nothing. The two tests that import a file today
  (`start.spec.ts`, `wizard.spec.ts`) walk the form.
- `loop.spec.ts` and any other spec that walks the creator: as
  the page asks. The keys of the two languages stay the same
  (`tools/i18n_check.py`).

### 2.7 What the owner will try

On the owner's own browser, where games of before are saved:

1. The start screen, *Load a game*: every game of before has a
   name, its wizard's; two wizards called alike are *X* and
   *X 2*.
2. *Change the names*: the wizard's name and the game's name can
   both be changed; the gender and the look are shown and cannot
   be changed; a name of another game is refused with its
   message.
3. Back on the start screen: the note under the greeting and the
   list show the new name; *Delete* asks with it.
4. *New game*, to the creator: the game's name follows the
   wizard's name as it is typed, with a number when it is
   taken; written by hand, it stays; the note says the gender
   and the look are for the whole game.
5. *Export* and *Import* of a game: the screen asks the name of
   the game brought, offering its wizard's name with a number;
   a name of the list is refused; the name written is the one
   the list shows; *Cancel* brings nothing.

### 2.8 What is left out, and why

- The game's name inside the level, the map or the settings: it
  is the start screen's and the creator's.
- The name in the exported file and the file's own name: the
  file is a progress document, the same for every store (D31),
  and the child names the game where it comes in.
- A page of its own to rename a game from the list: the owner
  asks for the creator's page, and the game named there is the
  one being played; another is renamed after *Play*.
- Any change to the friends, their colours or the words: D292
  only keeps what they hang from.
- Version 0.0.7: the designer's, after the owner's UAT.

## 3. The pieces

One local commit each, in this order. Before each commit,
`ci/check.sh` and the browser specs the piece touches, green.

### 3.1 The name in the store (D290, D291; 2.1)

The entry's name, the rules, the naming of the games of before,
`add`, the facade. `games.test.ts` and the rule's tests.

### 3.2 The creator and the start screen (D290, D291; 2.2, 2.3, 2.4)

The field, the list, *Delete*, the note, the button's words,
*Import*'s form, the texts in both languages. `wizard.spec.ts`,
`start.spec.ts`.

### 3.3 The gender and the look chosen once (D292; 2.2, 2.4)

The page for a wizard made, the note for one being made,
`setWizard`. `wizard.spec.ts`, and every spec that changed a
wizard's gender or look in the creator.

### 3.4 The documents, the whole check and the report

The documents of 2.5 and the user guide of 2.4, in the commit of
the piece they tell or in one of their own. `ci/check.sh --e2e`
whole, once, in a copy. The report in Spanish, in `drafts/`: the
five steps of 2.7; pictures of the current commit only (the
creator for a wizard being made and for one made, the message of
a name taken, the list with two wizards called alike, the start
screen's note, *Import*'s form); what was decided where the
plan does not decide.
The memory note `kydux-sprint-57-state`, and the prompt for the
designer's review.

## 4. Gemini

Nothing is asked of Gemini: no picture and no text.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

This is sprint 57, a mini sprint asked by the owner on
2026-11-21: a saved game has a name of its own, unique, given
and changed on the wizard's page; a game of before, with no
name, takes its wizard's name, and a number after it when that
name is taken; and a wizard's gender and look are chosen once
and cannot be changed after. Build on the last commit of main as
you find it.

Read first: CLAUDE.md, .claude/working-model.md,
docs/dev/README.md, docs/dev/sprint-57.md (this plan, whole),
and in docs/dev/architecture.md D31, D36, D37, D64, D70, D77,
D90 and D283. Then your memory notes kydux-sprint-56-state,
kydux-checks-per-piece, kydux-report-images-current,
kydux-no-co-authored-by, kydux-docs-present-tense and
kydux-github-only-code-and-docs. Then the code:
app/src/progress/games.ts, store.ts and progress.ts,
app/src/ui/wizard.ts and start.ts, and the specs
app/e2e/wizard.spec.ts and start.spec.ts.

What is asked, in short; the plan has each in full.

1. The name in the store (D290, D291). The list's entry has a
name: 1 to 30 characters of the kinds a wizard's name has,
unique in the list without regard to case. An entry stored with
no name is still read. One function gives the automatic name:
the wizard's name, or the wizard's name, a space and the first
number from 2 that makes it free. When the store is made, every
game with a wizard and no name is named by it, the oldest first,
and the list is written only if a name was given. The single
document of before the list is named the same way. A game
brought from a file is added with the name the child gives it.
Naming a game refuses a name that is another game's.

2. The creator and the start screen. Under the wizard's name, a
field for the game's name (#game-name, with #game-name-rule and
#game-name-taken). For a wizard being made it follows the
wizard's name, as the automatic name, until the child writes in
it; for a wizard made it shows the game's name. Done waits for a
name valid and free, and keeps the wizard and the name together.
The start screen lists the games by their names, the wizard's
name under one that differs; Delete asks with the game's name;
the note under the greeting names the game; the button
#change-wizard says "Change the names". Import asks the name of
the game it brings before adding it: a small form under the
buttons (#import-form, #import-name with the automatic name
offered, #import-done, #import-cancel), the same rule and the
same messages; Cancel and Escape bring nothing. The plan's table has
every text in English and Spanish: enter them as they are.

3. The gender and the look, once (D292). On the page of a wizard
made, the gender and the look are shown and not offered: no
group of buttons, the preview and the sentence #wizard-fixed.
For a wizard being made, the note #wizard-once under the looks.
setWizard keeps the gender and the look of a wizard already
made, whatever it is given.

Build pieces 3.1 to 3.4 in order, one local commit each. Before
each commit, ci/check.sh and the browser specs the piece touches
green; the whole ci/check.sh --e2e once, before the report, in a
copy with Playwright's own server and the app built anew in that
copy. Never a push, never a timer, never a deploy. Never stop or
build into the servers on ports 443 and 5173; a preview left on
4173 is a browser run's leftover and may be stopped, and yours is
stopped when you are done. Nothing under .github/ changes.
Gemini is asked for nothing.

No Co-Authored-By trailer in any Kydux commit, whatever your
harness suggests. Before you end, this must print 0:
  git log origin/main..HEAD --format=%B | grep -ci co-authored

What the owner will look for, on a browser with games of before:
(1) every game of before named after its wizard, two wizards
    called alike as X and X 2;
(2) "Change the names": both names can be changed, the gender
    and the look cannot, and another game's name is refused;
(3) the new name on the start screen's note and in the list, and
    in Delete's question;
(4) a new game: its name follows the wizard's name, with a
    number when taken, and stays once written by hand;
(5) Import asks the name of the game it brings, offering its
    wizard's name with a number; the list shows the name given.

Enter D290, D291 and D292 with the plan's words, and bring D36,
D64 and D70, docs/dev/plan.md and the user guide (README.md and
README.es.md, in sync, short sentences) to the present. Where
the plan does not decide (the names of the functions, how the
facade and a store with no list answer, how the page is laid out
for a wizard made, the styles), take the smallest choice that
keeps its intent and say it in the commit. Do not build what
section 2.8 leaves out. Every user-facing string through i18n,
the same keys in both languages. Never edit content while a
browser run is going. Every document and comment in the present.
Before git add, read git diff of each file and stage only your
own hunks; nothing of drafts/ or art/raw/ enters a commit.

docs/dev/sprint-57.md is the designer's and is committed
already; leave it as it is.

Hand over, in drafts/ and never committed: the report in Spanish
as 3.4 asks, with the steps of 2.7 and pictures of the current
commit only. Write your memory note kydux-sprint-57-state, and
end with the prompt for the designer's review in English, in a
code block.
```
