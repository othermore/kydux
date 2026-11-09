# Sprint 35 — The hole that opens, the mark's thin silhouette, the key on the plan, and two lessons that run plain Python

The owner read the sixth walkthrough of chapter 3
(`drafts/recorrido-capitulo-3-2026-11-08-4.es-comments.md`, 5 comments)
and answered the designer's proposal for the lessons of chapter 2
(2026-11-08). What changes: the slab that comes and goes is, in words and
in code, a hole that opens in the floor, a magic trap, and the way down's
hole takes the two cells it is painted on; the goal's mark, where
something covers it, shows a silhouette as thin and faint as a figure's,
and only behind the scene's cut-outs, never behind a figure; the plan
shows the key in the dark room; the way down's figures are drawn only 0.2
toward the half-open door; and two lessons of chapter 2 gain pages where
the child runs plain Python without the wizard: `print` with numbers, a
sum and a string, and variables holding a number or a string and added
into a third. No Gemini image.

The pieces, in this order: 35.1 to 35.6. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, never a timer; every word for the player through
`t()` or a content file, in English and Spanish; Gemini writes every text
the child reads from a brief, the owner's own words fixed, D141 and the
metaphor rule holding; D148 holds; documents and comments in the present;
no content edited while a browser run is going. Section 4 is the Gemini
budget (none), section 5 the owner's acceptance test, section 6 the
hand-over, section 7 the prompt.

## 1. Decisions taken here

- **D167 — The slab is a hole that opens in the floor.** Decided 2026-11-08
  by the owner (*el dibujo muestra un agujero redondo que aparece y
  desaparece; cambiemos los textos; en el código `hole.closed` o
  `hole.open`*). The thing's kind is `hole`, in `level.json` and in the
  child's code: `hole.open` is true while the hole is open, `hole.closed`
  while the floor covers it; a step onto an open hole is a bump
  (`by: "hole"`); `osto`, cast beside it, holds it closed from the next
  tick it is closed; its rule of time is D53's unchanged (closed for
  `period` ticks and open for as many, from tick 0 closed). A hole may take
  two cells (`cells`, as a door's, D150), both open and closed together,
  bumping on either; the way down's hole lies on (9, 7) and (10, 7), as it
  is painted, so that no one walks round it. The lesson teaches the two
  ways of waiting as one thing: `while hole.open:` and
  `while not hole.closed:`; the levels' solutions use the second, and a
  program that uses the first wins all the same; the bonus asks `closed`.
  In the words the child reads the hole is *un agujero que se abre en el
  suelo*, called *una trampa mágica, o un portal oscuro* where it is first
  told, and *otro de esos agujeros* afterwards; no text says *losa*, nor
  that anything goes and comes. The lesson is *Luz y trampas*, the level
  `the-opening-hole`, *El agujero que se abre*, its ways *Se abre cada
  tres ticks*, *... cuatro*, *... cinco*, *... siete*. Supersedes D138 and
  D53's names; the hole's picture (D148) stays. Rules out a slab in any text
  and `in_place` in any code.
- **D168 — The mark's silhouette is a figure's.** Decided 2026-11-08 by the
  owner (*el círculo que se ve por encima debería ser muy fino y latente,
  como la silueta de los personajes, y solo sobre los objetos del
  escenario, no sobre los personajes*). Where a cut-out of the scene covers
  the mark, the covered part is drawn as the same thin latent outline a
  figure gets behind that cut-out (D107), no thicker and no brighter; where
  a figure stands on the mark, the figure covers it and nothing is drawn
  over the figure. Amends D160. Rules out a ring over the wizard's feet.
- **D169 — The plan shows the things of a dark room.** Decided 2026-11-08
  by the owner (*la llave debería salir en el mapa del niño travieso*). The
  plan draws a dark room's picture and the things lying in it, the key
  among them, since the map knows the castle; only the dark tunnel's region
  hides its figures (D135). Amends D163. The dark room's level still asks
  the steps to be counted from `position`, since the key lies on another
  cell in each way.
- **D170 — A lesson that teaches a principle runs plain Python.** Decided
  2026-11-08 by the owner (*son lecciones teóricas; no nos hace falta el
  mago*). A page that teaches `print`, a variable or a sum carries a block
  without the wizard, run in the level's world as any block (D142), its
  printed lines the answer: in chapter 2, *Lo que saben las cosas* for
  `print` and *Encontrar cosas* for the variable. Chapter 1's lessons keep
  their blocks as they are. Rules out a theory page with no code to run.

## 2. The owner's comments and answers, and what answers each

| # | Where | The owner (summary) | Piece |
| --- | --- | --- | --- |
| 1, 2 | P3 tick 9, P6 tick 9 | The mark's silhouette over the wizard and over the arch too thick: thin and latent as a figure's, only over the scene's objects. | 35.3 (D168) |
| 3 | P7 card | The picture shows a hole that appears and disappears: every text speaks of a hole, a magic trap or dark portal the first time; `hole.closed` / `hole.open` in the code. | 35.1, 35.2, 35.4 (D167) |
| 4 | P8 plan | The key should show on the map. | 35.3 (D169) |
| 5 | Way down contact | (9, 7) walked: the hole takes (9, 7) and (10, 7) as painted; the figures less toward the middle at (9, 4) to (10, 6). | 35.1, 35.2 (D167) |
| 6 | The lessons (owner's answer) | `print`: several prints, sums, numbers and strings. The variable: a number or a string in a variable, printed; two variables added into a third, printed. No wizard. | 35.4 (D170) |

## 3. What changes, in detail

### 3.1 The world and the API

- `things.py`: `Slab` is `Hole`, role `hole`, members `open` and `closed`
  (both read-only, the one the other's opposite), `_k_closed_at(tick)` as
  `_k_in_place_at` was; `osto` holds a hole closed (`hold` event unchanged,
  `by: "hole"` on the bump); `level.py`: kind `hole`, `period`, `cells` (one
  or two cells side by side, both floor; `at` the first), the loader
  refusing a hole whose cells are not adjacent; `world.py`: `is_free` reads
  every cell of a hole; `api.py`: `"hole": (*THING_MEMBERS, "open",
  "closed")`; the API table, the events table and the notebook's words
  (`hole.open`, `hole.closed`, *osto* holds a hole closed). `slab` and
  `in_place` exist nowhere after this sprint: a test holds the API has no
  `slab` role.
- Tests: the hole's rule of time, the two-cell hole bumping on either cell
  and held closed by `osto` from beside either, `open` and `closed`
  opposite at every tick.

### 3.2 The scenes and the levels

- `the-storeroom`: the hole thing `hole` at (3, 7), one cell; the art's
  `slab` state `hole` renamed `hole`/`open` (the picture unchanged).
- `the-way-down`: the hole at `cells` (9, 7) and (10, 7); (9, 7) floor on
  the map; the hole's picture, already painted across both, drawn as
  painted; the nudges round the door (rows 4 to 6 of columns 9 and 10) 0.2
  as D149 b, not 0.3.
- `content/levels/the-opening-hole/` (was `the-moving-slab`): the same
  level with `hole` and its four ways; solution
  `wizard.move_right(2)` / `while not hole.closed:` / `    wizard.wait()`
  / `wizard.move_right(3)`; the bonus `uses` `closed`; a test that
  `while hole.open:` wins the four ways too; the wrong programs as they are
  with the new names. `chapter.json` names the new id.
- `the-night-walk`: `hole` with its two cells, period 5; the solution with
  `while not hole.closed:`; the wrong programs renamed; the test that a
  program walking down column 9 bumps on the open hole.
- `the-dark-room`, the plan: nothing to change in the level; D169 in 35.3.

### 3.3 The page

- D168: the mark's covered part drawn by the figures' silhouette code
  (`silhouette.ts`), the same width, alpha and beat, masked by the scene's
  cut-outs only; a figure on the mark covers it; `MarkSilhouette`'s own
  ring goes; the Vitest tests follow; the browser test of the three doors'
  top arch holds a silhouette, and P3's end holds none over the wizard.
- D169: `planShapes` keeps a dark room's things; a Vitest test holds the
  key drawn on P8's plan.
- The slab's words in the page (`data-slabs`, the placeholder's `slab`
  frame, `t()` keys naming a slab) renamed `hole`.

### 3.4 The lessons

- **`what-things-know`, *Lo que saben las cosas*,** page 3 (*Mostrar el
  valor*): its words say `print` shows anything: a number, a sum, a string;
  the block, without the wizard, invites the child to change it:

  ```python try
  print(7)
  print(2 + 3)
  print("Hola")
  ```

  The last page keeps `print(door.locked)` as its *Pruébalo*.
- **`finding-things`, *Encontrar cosas*,** six pages: 1 as it is (a method
  that returns a value); 2, new, *Una variable*: a variable is a name that
  holds a value, a number or a string, written `edad = 9`, `nombre =
  "Marta"`, and `print` shows what it holds; the block
  `edad = 9` / `nombre = "Marta"` / `print(edad)` / `print(nombre)`
  (the child changes the number and the word); 3, new, *Sumar variables*:
  two variables added into a third, `total = a + b`, and printed; the
  block `a = 4` / `b = 3` / `total = a + b` / `print(total)` (change `a`
  and `b`, and try `a - b`); 4, *Guardar lo que devuelve un método*, the
  former page 2 (`book = wizard.find_nearest("book")`, `None`); 5, *Hacer
  que brille*; 6, *Pruébalo*, as they are. The variables' names in the
  blocks are Spanish words in the Spanish lesson and English in the
  English one, since they are the child's own, not the game's API.

The texts: a brief `chapter-2-plain-python.md` for the two lessons' new
pages and `chapter-3-the-hole.md` for every text that named the slab
(the lesson *Luz y trampas*, the two levels' words and ways, the story
*Atrapados* and *Al otro lado de las puertas* where they name it), with
D167's words fixed; Gemini's drafts read and corrected; the course book
regenerated and read in Spanish; a content test holds *losa* out of the
course.

## 4. The pieces

### 35.1 The world
3.1, with its tests. `ci/check.sh`.

### 35.2 The scenes and the levels
3.2, the sweep green in the storeroom and the way down, `test_passages.py`
brought to the hole and the two cells.

### 35.3 The page
3.3 and D169; Vitest; the browser tests of the hole (`data-holes`), the
mark and P8's plan.

### 35.4 The lessons and the words
3.4 and the two briefs; `lesson.json` of `finding-things` and
`what-things-know` unchanged in what they teach; `kirra-and-osto` teaches
`hole.open` and `hole.closed`; the notebook; the course book.

### 35.5 The walkthrough and the tests
`npm run walkthrough -- 03-passages` to a new document; chapter 2's
browser tests on the two lessons' new pages (each block runs and prints);
`ci/check.sh --e2e` green.

### 35.6 The documents
`architecture.md` D167 to D170 (D53, D138, D160, D163 say where they take
over; the API, goal and events tables; the module map); `course.md`
(chapter 2's two lessons, chapter 3's hole, the vocabulary); `art/README.md`
(the hole's picture by its name); `plan.md` 5.5; the report in Spanish and
the prompt for the review.

## 5. Gemini images

None. The chapter stays at 95 of 100.

## 6. What the owner tries

1. *Lo que saben las cosas*, page 3: the three prints run on the page and
   change when edited; *Encontrar cosas*, pages 2 and 3: a number and a
   string in variables, printed; two variables added into a third.
2. *Luz y trampas* and *El agujero que se abre*: the words speak of a hole,
   a magic trap the first time; `while not hole.closed:` and `while
   hole.open:` both win; the bonus asks `closed`.
3. *El paseo nocturno*: the hole on (9, 7) and (10, 7), both bumping when
   open; the figures only a little toward the door's middle.
4. Any level: a mark covered by an arch shows a thin latent outline like a
   figure's; a mark under the wizard shows nothing over her.
5. *La sala oscura*'s plan shows the key.

## 7. What the implementer hands over

A report in Spanish with only pictures of the final commit (the two
lessons' new pages run, the hole's level card and a frame with the hole
open, the way down's hole across two cells, a covered mark's silhouette,
P8's plan), the commits, the differences from the plan with their
reasons, the walkthrough document's path, what is left open, and the
prompt for the designer's review in English, in a code block.

## 8. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-35.md (this plan, whole), docs/dev/sprint-34.md, the
owner's comments in drafts/recorrido-capitulo-3-2026-11-08-4.es-comments.md
(under each picture, in Spanish), docs/dev/course.md, tools/write/
README.md and rules.md, D53, D107, D138, D141, D142, D148 to D150 and
D160 to D170 in docs/dev/architecture.md with its API, goal and events
tables, and the memory notes kydux-two-agents, kydux-sprint-34-state,
kydux-designer-review-34 and kydux-metaphors-once. Build sprint 35
whole: pieces 35.1 to 35.6 in order, one local commit each,
ci/check.sh --e2e green before each, never a push, never a timer (the
owner pushes with ci/push.sh). Never stop or build into the servers on
ports 443 and 5173, and never kill a vite, node or nginx process of the
owner's (CLAUDE.md); your own preview on 4174 is stopped when you are
done. No Gemini image in this sprint. Every text the child reads comes
from the briefs the plan names, the owner's own words word for word,
by D141 and the metaphor rule; you read and correct every draft before
it enters content/. The plan decides everything; where it does not,
take the smallest choice that keeps its intent and say it in the
commit; a choice that changes what the owner sees is asked first,
through the owner. Every document and comment in the present. Before
git add, read git diff of each file and stage only your own hunks;
commit promptly. Hand over as section 7 asks, as a report in Spanish,
and end with the prompt for the designer's review in English, in a
code block.
```
