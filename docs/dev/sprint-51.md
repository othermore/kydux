# Sprint 51 — The letter held before the castle

On 2026-11-16, reading the opening as sprint 49 left it, the owner
asked for one more thing, in their words:

> En la carta, estaría guay si en la primera imagen se viese la
> imagen del castillo pero por delante tapando el castillo se
> viese la carta con el castillo dibujado a trazos/lineas (y
> debajo unas letras de admitido a la escuela de magia de
> Arvelia), y en la segunda imagen se viese el castillo, con la
> carta ya apartada para que se vea detrás el castillo "de verdad"
> (es también un dibujo, pero los normales que tenemos nosotros,
> no de lineas). El texto tendría que cambiar: Primero lo de "Hace
> unas semanas te llegó una carta [...]. Un enorme castillo salía
> dibujado en ella". Luego: Es este mismo castillo, el castillo de
> Arvelia, la escuela para magos y magas. Se alza [...], y al
> verlo sientes una gran emoción. Y el último sería: Desde que
> hiciste las maletas has recorrido un largo camino. Finalmente,
> tras pasar el pueblo al pié de la colina y la empinada subida al
> anochecer, has llegado.

What is there today. The opening, `story:the-letter`, tells its
first two steps over the welcome's painting of the castle (`still`,
D251) and the rest on the scene of the field. The first step names
the castle, the second tells of a letter that *came with this very
drawing*: the child is told of a letter and never sees one, and the
painting has to stand for both the drawing and the castle.

What the owner asks is the story's own order made visible: first
the letter, with the castle drawn on it; then the letter taken away
and the same castle there, for real; then the way to its gate.

**What this sprint holds:**

1. One picture by Gemini: the letter alone, a sheet of parchment
   with the castle of the painting drawn in ink lines (2.1).
2. The letter on the story's page: before the painted castle at
   the first step, its words of admission drawn by the game, and
   lowered away at the second (2.2, D257).
3. The opening's first three steps in the owner's words, and their
   English by Gemini (2.3).

It is built after sprint 50, on its last commit.

## 1. Decisions taken here

D257, to be entered in `docs/dev/architecture.md` by the programmer
as it is built, with these words or closer ones to what is built:

- **D257 — The opening's first step is told over the letter, held
  before the castle.** Decided 2026-11-16 by the owner (*en la
  primera imagen se viese la imagen del castillo pero por delante
  tapando el castillo se viese la carta con el castillo dibujado a
  trazos/lineas (y debajo unas letras de admitido a la escuela de
  magia de Arvelia), y en la segunda imagen se viese el castillo,
  con la carta ya apartada para que se vea detrás el castillo "de
  verdad"*). A step told over a story's still may hold the story's
  letter before it (`"letter": true` in `story.json`): the first
  steps over the still, in a row. The letter is one picture with
  nothing around it, a sheet of parchment with the castle of the
  painting drawn in ink lines, the same castle seen from the same
  side, and under the drawing the words of admission, drawn by the
  game from a translated string (`story.letter_words`) and never
  painted. While the step shown holds it, the letter lies over the
  painted castle and covers it whole, the lake and the village in
  sight around it; at the first step without it the letter is
  lowered out of the picture, over its lower edge, and the painted
  castle is there; *Back* raises it again. With motion reduced it
  is there or gone at once. `story:the-letter` holds it at its
  first step, which tells of the letter that came and the great
  castle drawn on it; the second step, over the painting alone,
  says it is this very castle. Rules out a letter the child is only
  told of, a drawing and a castle that do not match, and words
  painted into the art.

D251 and D74 are brought to it in the same piece: what the
opening's first two steps tell, and over what.

## 2. What is asked

### 2.1 The letter's picture

One picture, asked of Gemini with the castle's painting as its
reference (`art/raw/welcome-castle/welcome-castle.png`, the picture
`about/welcome-castle.webp` is made from), by a prompt file of its
own in `tools/art/prompts/`. What the prompt asks, in the
programmer's words:

- **One thing alone on a flat ground of pure magenta**, to every
  edge, with no shadow on the ground, no gradient, no frame: the
  ground is keyed out, as for the game's other cut things.
- **A letter: one sheet of old parchment**, seen flat from the
  front, wider than tall, about 4 to 3, upright. Warm cream paper,
  a little aged, its edges slightly uneven, one soft fold across
  it. In the game's painted style: a bold dark outline round the
  sheet, soft painted shading on the paper.
- **On its upper three quarters, the castle of the reference
  drawn in ink.** The same castle, from the same side, its towers
  in the same places and of the same heights, the hall with its
  tall windows, the gate, the top of the hill and the path that
  comes up to the gate. Drawn with a pen, in dark brown lines
  only: outlines and a little hatching for shade. No colour, no
  painted fill, no sky, no lake, no village. A margin of bare
  parchment round the drawing.
- **Its lower quarter bare parchment.** Nothing drawn and nothing
  written there: the game writes its words there. One thing may
  sit at its right end: a small round seal of dark red wax with a
  plain tower pressed into it, no letters.
- **No writing anywhere**: no letters, no numbers, no signature,
  no lines of scribble that stand for writing. No hand, no
  envelope, no ribbon across the drawing.

What is accepted, looked at by the programmer on the painting and
not alone:

- the drawn castle is known at once as the painted one: towers
  counted and placed alike, the hall on the same side;
- lines only, on parchment that reads as paper against the dusk
  of the painting;
- the lower quarter clear enough for two lines of words in both
  languages;
- nothing that reads as writing;
- an edge with no magenta left on it, on the dark of the painting's
  trees and on the light of its sky.

Up to five tries; the best is kept, and the report says how many
were made and what the others lacked. If none holds all five
points, the best is shown in the report and the sprint stops
there, with nothing of 2.2 shipped on a letter that fails: a letter
with painted writing, or with another castle, is worse than none.

The picture is kept with alpha, about 1000 pixels wide, beside the
other pictures the page serves, with its origin, model, prompt
file and licence recorded as `app/public/about/SOURCE.md` does for
the painting. The prompt file is committed, as the prompt of a
used picture; `art/raw/` is not.

### 2.2 The letter on the page (D257)

**The story's file.** A step of `story.json` may carry
`"letter": true`. The stories' check (`world/kydux_world/level.py`)
holds it: true or not given; only on a step told over the still;
the steps with it are the first, in a row. `story:the-letter`
carries it on its first step alone:

| Step | `still` | `letter` | Shown |
|---|---|---|---|
| 1 | true | true | the painting, the letter before the castle |
| 2 | true | | the painting alone |
| 3 to 5 | | | the scene of the field |

**The page.** `main.ts` gives the opening's page its letter as it
gives it its still: the picture, its words (`story.letter_words`)
and its description for one who does not see it
(`story.letter_alt`). `story.ts` puts it in the scene's frame,
over the still and under the scene, and the frame says where it
is in `data-letter`: `front` while the step shown holds it,
`aside` at any other step. A story with no letter has no such
element and no such attribute.

**Where it lies.** The letter is placed on the painting, not on
the frame: the frame shows more or less of the painting as the
window changes (`object-fit: cover`), and the castle is not at
the same place of the frame in each. Whatever the frame shows:

- the sheet covers the painted castle whole, from the tip of its
  tallest tower to the foot of its walls and from its left tower
  to its right one (in the painting, about 0.51 to 0.85 of its
  width and 0.05 to 0.51 of its height; the programmer measures
  it);
- the sheet's drawing and its words are whole in sight; the
  sheet's own upper margin may pass the frame's upper edge, where
  the frame cuts the painting at the tower's tip; no other edge
  of the sheet passes the frame;
- the lake, the village and the path are in sight round it;
- it is turned a little, three or four degrees, as a sheet held
  in a hand is.

**Its words.** One line or two, centred in the sheet's bare lower
quarter, in the story's own type (`--font-story`), in the ink's
dark brown, of a size that follows the sheet's, so that the sheet
reads the same in a wide window and a narrow one. They are text
of the page, read by a screen reader with the letter, and are
hidden from it with the letter once it is aside.

- Spanish: *Admisión en la escuela de magia de Arvelia*.
- English: from the brief of 2.3; close to *Admission to the
  school of magic of Arvelia*.

The words name no *admitido* nor *admitida*: the letter is read
before the child has said who their wizard is.

**How it goes and comes.** At the page's first draw on a step
that holds it, the letter is there, with no move, and not a
moment after the painting: the page does not show the bare castle
first. At *Next* to the second step it is lowered: it goes down
and a little to the left, turning a little more, out over the
frame's lower edge, in about 0.6 s, and is then hidden. *Back* to
the first step raises it by the same way. *Skip* from the first
step lowers it under the scene that comes in. With motion reduced
(`prefers-reduced-motion`) it is there or gone at once.

**Tests.**

- The stories' check: `letter` anything but true; on a step not
  over the still; after a step over the still without it. Each
  refused, with its words.
- `story.spec.ts`, in Spanish and in English, at a wide window
  and a narrow one of those the specs already use: at step 1 the
  frame says `front`, the letter's box covers the castle's box
  (the castle's fractions of the painting, brought to the page),
  the words are the language's own, lie inside the sheet, and are
  cut nowhere; at step 2 the frame says `aside` and, the move
  done, nothing of the letter is in the frame, the still in
  sight; *Back* says `front` again; at step 3 the scene has come
  and the letter is hidden; *Skip* from step 1 ends on the scene
  with the letter hidden. With motion reduced, the letter's move
  takes no time. A chapter's story has no letter.
- The test of D251 keeps holding the still at steps 1 and 2.

### 2.3 The texts

The first three steps of `content/stories/the-letter/text.es.json`
are the owner's words (D141), the two gaps they left (`[...]`)
filled with the words the opening has today, and *pie* without
its accent:

1. *Hace unas semanas te llegó una carta: la invitación para tu
   primer año en Arvelia, firmada por la directora, Orla. Un
   enorme castillo salía dibujado en ella.*
2. *Es este mismo castillo, el castillo de Arvelia, la escuela
   para magos y magas. Se alza en lo alto de una colina, sobre un
   lago profundo, y al verlo sientes una gran emoción.*
3. *Desde que hiciste las maletas has recorrido un largo camino.
   Finalmente, tras pasar el pueblo al pie de la colina y la
   empinada subida al anochecer, has llegado.*

Steps 4 and 5 and the title stay as they are, in both languages.
The third step is told as the wizard walks up to the gate, as
today: *has llegado* is said as they arrive.

The Spanish is entered as it stands here, letter for letter, and
is not given to Gemini to write again. Their English is Gemini's
(section 4), with the letter's words.

### 2.4 What the owner will try

1. *New game*. The story *La carta* opens on the painting with
   the letter before the castle: the castle drawn in lines, and
   under it *Admisión en la escuela de magia de Arvelia*. The
   words under the picture tell of the letter that came.
2. *Siguiente*. The letter is lowered out of the picture and the
   painted castle is there. The words say it is this very castle.
3. *Siguiente*. The field at dusk; the wizard walks up to the
   gate while the words tell the journey.
4. *Atrás* twice. The painting again, and then the letter raised
   before it.
5. The language set to English, the same three steps.

### 2.5 What is left out, and why

- **Orla's signature on the sheet.** A name in handwriting is
  writing in the art; drawn by the game it needs a hand's type
  the game does not carry. The seal stands for it.
- **The letter anywhere else** (the welcome page, the creator, a
  thing the wizard carries). The owner asks for it in the
  opening.
- **A second painting.** The letter is a thing over the one
  painting, so that the castle behind it is the same to the
  pixel, and its words can be the game's.

## 3. The pieces

One local commit each, in order.

### 3.1 The picture (2.1)

The prompt file, the tries, the one kept, keyed and made small;
its record beside it. Looked at on the painting in a scratch page
or a scratch script, before any code of the page. `ci/check.sh`
green.

### 3.2 The letter on the page (D257, 2.2)

`letter` in the stories' check with its tests and its words in
the check's own description; `story.json`; the page's parts in
`main.ts`; the element, the attribute and the move in `story.ts`
and the styles; `story.letter_words` and `story.letter_alt` in
both languages, the Spanish of 2.2 and an English of the
programmer's until 3.3 brings Gemini's; the tests of 2.2; D257
entered, and D251, D74, `docs/dev/course.md`'s lines on the
opening, `docs/dev/plan.md`'s line of the sprints and the header
of `story.ts` brought to it.
`ci/check.sh` and `story.spec.ts`, with every spec that opens the
opening (`start`, `wizard`, `waiting`, `about`, `map`), green.

### 3.3 The texts (2.3)

The three Spanish steps entered; the brief written and run, its
English read and corrected; the letter's English words in
`i18n/`. `ci/check.sh` and `story.spec.ts` green.

### 3.4 The whole check and the report

`ci/check.sh --e2e` whole, once, in a copy. The report in
Spanish, in `drafts/`, with the five steps of 2.4 and pictures of
the current commit: steps 1, 2 and 3 in Spanish, step 1 in
English, step 1 in the narrow window, and the letter alone on a
dark ground and on a light one. With them the prompt of the
picture, the number of tries, and the three steps and the
letter's words in both languages as a table. The memory note
`kydux-sprint-51-state`, and the prompt for the designer's
review.

## 4. Gemini

One image, the letter of 2.1, with the model and the settings of
the castle's painting (`tools/art/prompts/welcome-castle.md`) but
for its shape, the nearest to 4 to 3 the service gives.

One brief, `tools/write/briefs/sprint-51-the-letter.md`, written
by the programmer from this plan and run with
`tools/write/write.py`. It writes the English of the opening's
first three steps and of the letter's words, and nothing else.
It carries the bible, the opening whole in both languages as it
is today, the owner's words whole, and the three Spanish steps
and the letter's Spanish words of this plan, given as fixed. And
the rules: each English step says what its Spanish says, in the
same order and with nothing added; it keeps the opening's own
English for what does not change (*the school for young wizards,
boys and girls*, *the head of the school, Orla*); the first step
is told in the past and the second and third bring the reader to
now, as the Spanish does; no mark of the wizard's gender; the
letter's words are a heading of a few words, with no *admitted*
said of a boy or a girl.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

This is sprint 51, a small one, planned while you were ending
sprint 50. Build it on sprint 50's last commit, without waiting
for that sprint's review.

Read: docs/dev/sprint-51.md (this plan, whole), D251, D74 and D214
in docs/dev/architecture.md, app/src/ui/story.ts with
app/e2e/story.spec.ts, the stories' check in
world/kydux_world/level.py with its tests, content/stories/the-letter/,
tools/art/prompts/welcome-castle.md with tools/art/generate.py,
tools/write/briefs/sprint-49-the-letter.md, and the memory notes
kydux-checks-per-piece and kydux-report-images-current.

The owner wants to see the letter the opening tells of. At the
story's first step the painting of the castle is there, and before
it, covering the castle, the letter: a sheet with that same castle
drawn in ink lines and, under the drawing, words of admission to
the school. At the second step the letter is taken away and the
painted castle is there. The first three steps are told in the
owner's own words. It is D257; its words are in the plan's section
1 and are yours to enter in architecture.md as you build it.

Build pieces 3.1 to 3.4 in order, one local commit each; before
each commit ci/check.sh and the browser specs the piece touches
green, and the whole ci/check.sh --e2e once before the last, in a
copy with Playwright's own server on 4173 and the app built anew
in that copy; never a push, never a timer, never a deploy. Never
stop or build into the servers on ports 443 and 5173, and stop
your own preview when you are done. Nothing under .github/
changes.

Gemini is asked for one image and one text. The key stays in
~/.config/kydux/secrets.env and never enters a file of the tree, a
commit, a log or the report. The image is the letter of 2.1: at
most five tries, each looked at on the painting; if none holds the
five points of 2.1, stop after 3.1 and report with the best one.
The text is the brief of section 4: the English only. The three
Spanish steps of 2.3 and the letter's Spanish words of 2.2 are the
owner's and go in letter for letter.

What the owner will look for:
(1) at the first step, the painting with the letter before it: the
    castle covered whole by the sheet, the lake and the village in
    sight round it;
(2) on the sheet the same castle in ink lines, and under it the
    words of admission, drawn by the game in the page's language,
    nothing written in the picture itself;
(3) at Next the letter lowered out of the picture and the painted
    castle there; Back raises it again;
(4) the three steps in their words, and an English that says the
    same;
(5) the third step on the scene, as today.

The plan gives the format's word (letter), the attribute
(data-letter, front and aside), the keys and the Spanish letter
for letter: change none. Where it does not decide (the folder and
name of the picture, the numbers that place the sheet, the way the
sheet is tied to the painting under object-fit: cover, the size of
the words), take the smallest choice that keeps its intent and say
it in the commit. Never edit content while a browser run is going.
Every document and comment in the present. Before git add, read
git diff of each file and stage only your own hunks.

docs/dev/sprint-51.md is the designer's and is committed already;
leave it as it is.

Hand over, in drafts/ and never committed: the report in Spanish
as 3.4 asks, with the owner's five steps of 2.4, the pictures and
the table of the texts. Write your memory note
kydux-sprint-51-state, and end with the prompt for the designer's
review in English, in a code block.
```
