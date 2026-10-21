# Kydux — the story

What the lessons and levels are written from: the school, its people, its
spells and the wizard's way through it. For whoever writes a lesson, a
level's intro or a hint. Everything here is Kydux's own; nothing recalls a
famous wizard, a famous school of magic or the game that inspired Kydux.

## The names

A name that reaches the player is the same in English and Spanish and is
never translated: a character, a place, a spell, a password. It is a word
of neither language, so that no translation would be wanted, easy to say
in both, and short enough for a child to type. A title or a common noun
beside a name is translated: *the head, Orla* / *la directora, Orla*.

## The school

**Arvelia** is a school of magic in an old castle on a hill above a lake,
with a village at the hill's foot. Children come at the start of autumn,
the wizard among them, to learn magic; and magic, in Arvelia, is done by
writing instructions, because the castle and everything in it listens to
them. A wand lets the wizard cast spells; a broom, once earned, lets them
fly; a book from the library teaches a new spell.

Its parts, in the order the chapters visit them:

| Place | Chapter | What it is |
| --- | --- | --- |
| The gate and the courtyard | 1 | Where the new pupils arrive. The gate opens to a word. |
| The first corridors | 1 | Stone corridors with sealed doors, the wand's pedestal. |
| The library | 2 | Tall shelves, locked rooms, books that give spells. |
| The passages | 3 | Moving stairs, dark rooms, the corridor where Dask patrols. |
| The broom field | 4 | A lawn behind the castle, rings to fly through, a race. |
| The tower | 5 | Where a pupil is given a familiar, and the course ends. |

## The characters

Each with the id a level's `speaker` uses (D45), the name the player reads,
who they are and how they speak.

| id | Name | Who | How they speak |
| --- | --- | --- | --- |
| `ilda` | Ilda | The first teacher, a woman; she meets the new pupils and teaches chapter 1. The lessons are in her voice: *your teacher* / *tu profesora*. | Warm, patient, a little funny. Short sentences. She explains why before how, and never makes a pupil feel slow. |
| `orla` | Orla | The head of the school, a woman. She welcomes the pupils at the start and gives the familiar at the end. | Calm and kind, a few words at a time. |
| `dask` | Dask | A strict teacher, a man, who patrols the passages and does not want pupils there after dark: chapter 3's teacher. | Gruff and brief; never cruel. He is fair, and in the end impressed. |
| `wenna` | Wenna | The librarian, a woman, keeper of the books and of their rules: chapter 2's teacher. | Precise and quiet; she loves order and a good question. |
| `nuri` | Nuri | A pupil who arrives on the same day as the wizard and becomes their friend. A girl or a boy as the writer needs; Nuri is a name for either. | Eager, curious, says what the child may be thinking: *What does that do?* |
| `zarek` | Zarek | A pupil a year older, the rival: quick, proud, sometimes right. | Boastful but not mean; he races the wizard in chapter 4 and is a good loser. |
| `bimo` | Bimo | The school's cat, who wanders into levels. | He does not speak: he meows, and the texts say what he seems to mean. |
| `eldra` | Eldra | A ghost in the library, once a pupil, who lost a book long ago. | Whispers, speaks in old-fashioned ways, is never frightening. |

Bimo and Eldra are actors a level may hold; the teachers and pupils speak
in intros and outros, and Dask patrols as today's `teacher` kind.

## The spells

A spell is a word cast with the wand, `wizard.cast("<spell>")` (D42). Each
chapter teaches the spells its levels need; a level names the spells it
has in `level.json`.

| Spell | What it does | Chapter |
| --- | --- | --- |
| `zelim` | Breaks the seal of a door the wizard stands next to. | 1 |
| `fendra` | Draws a thing on a shelf or across a gap to the wizard's tile. | 2 |
| `kirra` | Lights the room the wizard is in, so that what is in the dark shows. | 3 |
| `osto` | Holds a moving stair still for a few ticks. | 3 |
| `drevo` | Lifts the broom into the air, so the wizard can fly. | 4 |
| `minka` | Calls the wizard's familiar to their side. | 5 |

The gate's password, the first word the wizard says in chapter 1, is
**`ambrel`**. Another door's password, when a level needs one, is a word of
the same kind, written in `story.md` first.

## The wizard's way

**Chapter 1, Arrival.** The wizard comes to Arvelia with the other new
pupils and meets Ilda at the gate. To get in, they learn what an
instruction is and make the wizard walk; they learn that an action can be
told how much, and that words can be said, which opens the gate. Inside,
they find their wand on its pedestal and learn the first spell, `zelim`,
which breaks seals; the chapter ends with the way into the castle opened
by everything learned. Nuri arrives with them; Zarek watches.

**Chapter 2, The library.** Wenna keeps the library, and the wizard learns
to keep things in mind: a name for a thing found (a variable), what a
thing knows about itself (an attribute), and how to find a thing by its
kind. Locked rooms need their keys; `fendra` brings a book down from a
high shelf. Eldra asks for help finding her lost book, which the chapter
ends by returning.

**Chapter 3, The passages.** Night passages, where Dask patrols. The
wizard learns that a question can be true or false, then to choose by it
(`if`, then `else`), then to repeat (`for`), and last to repeat while
something is true (`while`), waiting for Dask to turn away. `kirra`
lights the dark rooms, `osto` holds the moving stairs. Dask catches the
wizard once, in the story, and lets them go, impressed.

**Chapter 4, The broom.** On the broom field the wizard earns a broom and
learns `drevo`. Carrying several things at once brings lists; doing the
same thing in many places brings an action of one's own, a function. The
chapter ends with the race against Zarek, which the wizard can win.

**Chapter 5, The familiar.** In the tower, Orla gives each pupil a
familiar, and the wizard describes their own: what kind of creature it is,
what it knows and what it can do, as a class. They send it through a
passage too small for a wizard; `minka` calls it back. The course ends
with the wizard a proper pupil of Arvelia, and the challenges begin.

## The tone

Warm, funny and never scary. The castle is old and full of surprises, not
of dangers: a teacher who catches the wizard sends them back to try again,
a dark room is only dark until it is lit, a ghost is only lonely. The
child is never mocked, and a failure is always the code's, never the
child's: *the wizard walked into the wall* rather than *you made a
mistake*. Jokes are gentle and come from the characters: Bimo's opinions,
Nuri's questions, Zarek's boasts.
