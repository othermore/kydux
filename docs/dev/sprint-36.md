# Sprint 36 — The barriers that speak, Ilda's good night, the sleep try gone, the mark in the open gate

The owner played the game with their child and read the seventh walkthrough
of chapter 3 (2026-11-09): chapter 3 is accepted as it is, and four things
of chapters 1 and 2 remain before the owner plays the whole game and makes
the release of chapter 3. In chapter 1's last level a walk longer than the
mark goes through the opened castle door and bumps on the wall inside, and
the card says the wizard bumped into something, which the child read as
bumping into the open door; at the end of the gate's level the goal's mark
on the gate's cell looks wrong once the gate opens; in chapter 2 Ilda says
good night to three when two stand before her; and the *Pruébalo* of *Cada
cosa en su sitio*, sleeping where no bed is, is forced. This sprint answers
the four with no Gemini image and no new scene.

The pieces, in this order: 36.1 to 36.5. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, never a timer; every word for the player through
`t()` or a content file, in English and Spanish; Gemini writes every text
the child reads from a brief, the owner's own words fixed, D141 and the
metaphor rule holding; documents and comments in the present; no content
edited while a browser run is going. Section 3 is the owner's acceptance
test, section 4 the hand-over, section 5 the prompt. After this sprint the
owner plays the game whole and releases it (`ci/push.sh`, `ci/deploy.sh`,
the owner's alone).

## 1. Decisions taken here

- **D171 — Where the child must not go on yet, the wizard says so.** Decided
  2026-11-09 by the owner (*pasarse de la marca, cuando hay sitio, no es
  problema; pero hay que pensar bien las barreras cuando no queremos que
  pasen a la siguiente parte aún*). Walking past the goal's mark is allowed
  wherever the scene has room. Where the tale does not let the child go on,
  into the castle before chapter 2, the cells beyond are the scene's
  `forbidden` cells with a reason of their own (D84), so that the wizard
  stops before them and says why in the child's words, and never a wall it
  bumps into with the card saying it bumped into something. In the field,
  the cells beyond the castle's sealed door, (8, 7), the steps before it,
  and (8, 6), the door's own cell, are forbidden with the reason `not_inside_yet`: *No entres
  todavía: quédate en el umbral, pasada la puerta* / *Do not go in yet: stay
  on the threshold, past the door* (the owner's words). Rules out a bump
  where a barrier is meant.
- **D172 — The goal's mark on a door's cell is whole once the door opens.**
  Decided 2026-11-09 by the owner (*al estar abierta la puerta el círculo
  debe cambiar para verse entero, la máscara ya no debe afectarle*). While a
  door is shut, the mark on its cell lies under the door's picture and shows
  its thin silhouette (D160, D168); the tick the door opens, the mark is
  drawn whole on the doorway's floor, and no mask of the shut leaf cuts it
  any more; only what the open state really draws over the cell (a leaf
  swung over it) may cover it. Rules out a mark cut by a door that is no
  longer there.
- **D173 — A lesson with nothing worth trying has no block.** Decided
  2026-11-09 by the owner (*probar `wizard.sleep()` donde no hay cama no
  tiene sentido, es forzado*). A lesson's *Pruébalo* exists only where
  running something teaches something; *Cada cosa en su sitio* keeps its
  words and its last button leads to the level, as *Notas* does. Rules out
  a block written to have one.

## 2. The pieces

### 36.1 The barrier at the castle's door

`content/scenes/the-field/scene.json`: `forbidden` with reason
`not_inside_yet` and cells (8, 7) and (8, 6); the reason's words in
`i18n/es.json` and `i18n/en.json` under `not_inside_yet`, the owner's
Spanish word for word, the English alike (texts the owner wrote, no brief).
`world/tests`: `the-sealed-door` played with `move_up(5)` after the seal is
broken holds the refusal, the reason and the wizard on (8, 8); the field's
other levels (`the-gate`, `the-password`) unchanged, their tests green. The
designer looked for other barriers of this kind in chapters 1 and 2: the
rooms' doors end on walls inside a room the child may enter, and the exits
of chapter 3's scenes are the map's edge, where the walk past the mark has
no room and no tale forbids it; none other is needed.

### 36.2 Ilda's good night

Brief `chapter-2-first-night-two.md`: step 3 of `the-first-night`, Ilda's
line, in the owner's sense: *Quizás conozcáis a algún otro compañero.
Buenas noches a los dos, nos vemos por la mañana* (the friend and the
wizard stand before her; the mate waits in the dormitory), English alike;
every other step word for word; the draft read and corrected; the course
book regenerated.

### 36.3 The sleep try gone

`content/lessons/the-right-place/es.md` and `en.md`: the page *Pruébalo*
and its block removed; the words of page 2 stand; the last button leads to
the level (`lesson.go_on`); `lesson.spec.ts` and the content tests that count
a lesson's blocks follow; `course.md`'s row of the lesson says it has no try.

### 36.4 The mark in the open gate

`engine/scene.ts` and `silhouette.ts` (D172): when a door on the mark's
cell opens, the mark's covering is computed again from the open state's
picture, the shut leaf's mask dropped; `data-marks-covered` follows. A
browser test on `the-password`: the mark covered while the gate is shut,
whole (not covered) once `ambrel` opens it, in both languages' runs; a
Vitest test on the covering's recomputation.

### 36.5 The documents, the walkthroughs and the hand-over

`architecture.md` D171 to D173 (D84 and D160 say where they take over);
`course.md`; `plan.md` 5.5. The walkthroughs of the three chapters played
again for the owner's final pass: `npm run walkthrough -- 01-arrival`,
`-- 02-the-library` and `-- 03-passages` (the first two chapters' documents
are new: the tool takes any chapter). `ci/check.sh --e2e` green. The report
in Spanish with pictures of the final commit (the wizard stopped at the
sealed door with its words, the mark in the open gate, Ilda's step, the
lesson's last page), the commits, the differences from the plan with their
reasons, the walkthroughs' paths, what is left open, and the prompt for the
designer's review in English, in a code block.

## 3. What the owner tries

1. *La puerta sellada*: after *zelim*, `move_up(5)`: the wizard stops on
   (8, 8) and says *No entres todavía: quédate en el umbral, pasada la
   puerta*; no bump.
2. *La contraseña*: the mark on the gate's cell, covered while shut, whole
   once the gate opens.
3. *La primera noche*, step 3: Ilda's new line.
4. *Cada cosa en su sitio*: two pages, no block, the button leads to the
   level.
5. Then the whole game, chapter by chapter, on `https://localhost:5173/`
   (or the walkthrough documents), before the release.

## 4. What the implementer hands over

As 36.5 says.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-36.md (this plan, whole), docs/dev/course.md,
tools/write/README.md and rules.md, D84, D141, D142, D160, D168 and
D171 to D173 in docs/dev/architecture.md, and the memory notes
kydux-two-agents, kydux-sprint-35-state, kydux-designer-review-35 and
kydux-metaphors-once. Build sprint 36 whole: pieces 36.1 to 36.5 in
order, one local commit each, ci/check.sh --e2e green before each,
never a push, never a timer (the owner pushes with ci/push.sh and
releases). Never stop or build into the servers on ports 443 and
5173, and never kill a vite, node or nginx process of the owner's
(CLAUDE.md); the owner's own preview on 4174 is theirs: use another
port for yours and stop it when you are done. No Gemini image in this
sprint. The owner's words in the plan are used word for word; Ilda's
line comes from the brief the plan names, read and corrected. The plan
decides everything; where it does not, take the smallest choice that
keeps its intent and say it in the commit; a choice that changes what
the owner sees is asked first, through the owner. Every document and
comment in the present. Before git add, read git diff of each file and
stage only your own hunks; commit promptly. Hand over as section 4
asks, as a report in Spanish, and end with the prompt for the
designer's review in English, in a code block.
```
