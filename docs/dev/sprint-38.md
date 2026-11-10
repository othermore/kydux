# Sprint 38 — A lesson's walk told in steps, and the mark whole in the top arch of the three doors

The owner played the game again after sprint 37 (2026-11-10) and found
two things of the page, and five texts. The texts the designer fixed on
the spot (the owner's words word for word, English alike): *A qué
distancia*'s last page, *Buscar la solución que funciona siempre*; Story 5
of chapter 2, how the wizard presents the friend to the mate; Story 3 of
chapter 3, where the crack is found, what the cold voice whispers, and what
the other voice sounded like; and Story 4, two lines more, the friend's
question to Dask and Dask's nervous deal, which is why the three say nothing
of the brooms even once caught. The two things of the page are this sprint:
the words under a lesson's block that walked, and the goal's mark of *El
pasillo de las tres puertas*. No Gemini image, no new scene.

The pieces, in this order: 38.1 to 38.3. The rules hold: pieces in order,
one local commit per piece with `ci/check.sh` and the browser specs the
piece touches green, the whole `ci/check.sh --e2e` once before the last
commit (the owner, 2026-11-09), never a push, never a timer, never a tag;
every word for the player through `t()` or a content file, in English and
Spanish; documents and comments in the present; no content edited while a
browser run is going. Section 3 is the owner's acceptance test, section 4
the hand-over, section 5 the prompt.

## 1. Decisions taken here

- **D180 — A lesson's block that walked says the walk, not the cell.**
  Decided 2026-11-10 by the owner (*no tiene sentido poner coordenadas si no
  sabes dónde empieza el mago; debería tomarse la posición inicial, ejecutar
  los movimientos y tomar la posición final, y mostrar "el mago se movió tres
  pasos a la derecha" o "dos pasos hacia abajo y uno a la izquierda"*). Under
  a block's editor, when the wizard's cell at the end differs from its cell at
  the start, the page says how far it moved, by the difference of the two
  cells, each axis in its direction: *{El mago|La maga} se ha movido 3 pasos
  a la derecha*, *... 2 pasos hacia abajo y 1 a la izquierda*, the sideways
  steps first; one step is *1 paso*; a walk that ends where it began, after
  moving, says *{El mago|La maga} ha vuelto a donde empezó*. The numbers are
  digits. The cell's numbers are never said: a child who has not met the grid
  (chapter 3) has no use for them, and one who has prints `wizard.position`.
  Everything else under the editor stays: what was printed, the reason a
  step was refused, the quiet end. Rules out *ha terminado en la casilla (4,
  5)* under *Qué es un programa*.
- **D181 — A mark is covered only by what is painted over it.** Decided
  2026-11-10 from the owner's finding (*la máscara donde está el círculo de
  destino no está ajustada al borde de la puerta, y hace que el círculo
  cambie a silueta lejos del arco de piedra*). The goal's mark's ring (D160,
  D168) shows only where a cut-out's opaque paint lies over the mark, never
  under a cut-out's soft or stray pixels, nor under its box; in *El pasillo
  de las tres puertas* the mark on (10, 0), in the top arch's opening, is
  whole from the start to the end, nothing being painted over that cell.
  Rules out a silhouette where the eye sees floor.

## 2. The pieces

### 38.1 The walk told in steps (D180)

`app/src/ui/lessonrun.ts`: `runSaid` gives `moved: {right, down}` (negative
for left and up) from the wizard's cell at the start of the world the block
ran in (the first way's start, D51) to its cell at the end, `null` when it
did not move; `ended` goes. `lesson.ts`'s lines: the walk's sentence from
`lesson.moved` with its parts (`lesson.steps_right`, `_left`, `_down`, `_up`,
each with `{n}` and the one-step form, joined by `lesson.steps_and`), or
`lesson.returned`, in `i18n/es.json` and `en.json`, D180's words; the gender
through `forWizard` as now; `lesson.ended_at` removed from both files.
Tests: `lessonrun.test.ts` (three steps right; two down and one left; back
where it began; printed with no move; a refused step with its reason and
no sentence of steps when nothing moved); `lesson.spec.ts`: the typed walk
says its steps, never a cell, in both languages; `what-a-program-is`,
`objects-and-actions` and `how-much` in the walkthrough of chapter 1 (the
lesson pages' captures) read right.

### 38.2 The mark whole in the top arch (D181)

First the cause, with `?debug` on `#level/the-three-doors` and
`data-marks-covered`: which cut-out the page counts over (10, 0), and on
which pixels (the cut-out's picture under `art/scenes/the-three-doors/`,
its `diff` thresholds in `cut.json`, or its box). Then the fix at the cause:
soft or stray pixels of a cut-out's mask cut away (`trace.py diff` again
with a firmer threshold, the untouched copy kept, D148), or the covering
in `silhouette.ts` counting only pixels above an alpha of a half, whichever
the cause asks; the scene's other cut-outs checked the same way
(`sweep.py`, `data-marks-covered` empty in every level of chapter 3 at its
start where no door stands on the mark). A browser test: *El pasillo de las
tres puertas* at its start and at the end of its solution with
`data-marks-covered` empty; the doors' sheet of the scene exported again if
a picture changed.

### 38.3 The documents and the hand-over

`architecture.md` D180 and D181 (D142 and D160 say where they take over);
`course.md` where it names the end cell under a block; `plan.md` 5.5. The
walkthrough of chapter 1 played again (`npm run walkthrough -- 01-arrival`)
for the three lessons' pages. The whole `ci/check.sh --e2e` once before
this commit. The report in Spanish with pictures of the final commit (a
lesson's block with its steps said, the mark in the top arch at the start
and at the end), the commits, the differences from the plan with their
reasons, what is left open, and the prompt for the designer's review in
English, in a code block.

## 3. What the owner tries

1. *Qué es un programa*, *Objetos y acciones*, *Cuánto nos movemos*: under
   the block, *se ha movido 1 paso a la derecha*, *2 pasos hacia abajo*,
   *3 pasos a la derecha*; a block changed to walk right and back says *ha
   vuelto a donde empezó*; no cell anywhere.
2. *El pasillo de las tres puertas*: the mark in the top arch whole at the
   start, through the three doors, and at the end.
3. The texts of 2026-11-10: *A qué distancia*'s last page, the wand bank's
   presentation, *Voces en el muro* and *Atrapados* with Dask's deal.

## 4. What the implementer hands over

As 38.3 says.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-38.md (this plan, whole), D51, D142, D148, D160, D168,
D172, D180 and D181 in docs/dev/architecture.md, and the memory notes
kydux-two-agents, kydux-checks-per-piece, kydux-sprint-37-state and
kydux-designer-review-37. Build sprint 38 whole: pieces 38.1 to 38.3
in order, one local commit each, ci/check.sh and the browser specs the
piece touches green before each, the whole ci/check.sh --e2e once
before the last commit, never a push, never a timer, never a tag (the
owner tags, pushes with ci/push.sh and releases). Never stop or build
into the servers on ports 443 and 5173, and never kill a vite, node or
nginx process of the owner's (CLAUDE.md); a port of your own for any
preview, stopped when you are done. No Gemini image. The words under
a block are D180's, word for word, in both languages. The plan decides
everything; where it does not, take the smallest choice that keeps its
intent and say it in the commit; a choice that changes what the owner
sees is asked first, through the owner. Every document and comment in
the present. Before git add, read git diff of each file and stage only
your own hunks; commit promptly. Hand over as section 4 asks, as a
report in Spanish, and end with the prompt for the designer's review
in English, in a code block.
```
