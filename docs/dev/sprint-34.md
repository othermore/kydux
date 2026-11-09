# Sprint 34 — The mark on the floor, the dark room kept dark, the doors asked whole, the storeroom's cells

The owner read the fifth walkthrough of chapter 3
(`drafts/recorrido-capitulo-3-2026-11-08-3.es-comments.md`, 12 comments)
and the designer's review left two debts on the plan's labels. What the
owner found: the goal's mark floats over arches and figures instead of
lying on the floor; the storeroom is seen lit in the slab's level, before
the dark room's; the plan shows the dark room as a white patch; the way
down's key is too big and over the torch, and its double door opens too
little and still mismatches its arch; the dormitory's door shows a floor
that does not run through, and the friend stands under its arch; the
storeroom has figures over its arch and cells that should be walls; the
long round's figures still brush its arches. This sprint answers each,
with three Gemini images at most and their retries.

The pieces, in this order: 34.1 to 34.6. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, never a timer; every word for the player through
`t()` or a content file, in English and Spanish; D148 holds (Gemini
paints every state, nothing the child sees is painted, moved or pasted by
a tool); documents and comments in the present; no content edited while a
browser run is going. Section 4 is the Gemini budget, section 5 the
owner's acceptance test, section 6 the hand-over, section 7 the prompt.

## 1. Decisions taken here

- **D160 — The goal's mark lies on the floor.** Decided 2026-11-08 by the
  owner (*los círculos de destino deben verse sobre el suelo, tapados por
  lo que está delante, en todos los escenarios de todos los capítulos*).
  On a painted scene the mark is drawn at the ground's depth of its cell:
  a figure walking over it, a cut-out before it (a statue, an arch's band,
  a door's leaf, a wall's top) covers it, and the covered part is drawn as
  the mark's silhouette, as a figure's is (D107), so that the mark
  is always read whole. This holds in every scene of every chapter;
  `markDepth` goes, and D79's mark over a door's picture goes with it. Rules
  out a mark that floats over an arch or over the wizard's feet.
- **D161 — A door's open state is asked of the model as the whole scene.**
  Decided 2026-11-08 by the owner (*pedir a Gemini la imagen completa con
  la puerta abierta, y eso debería hacer que el suelo tuviese
  continuidad*), to be remembered for every scene: the edit that opens a
  door is asked on the whole picture of the scene, never on a crop, so that
  the floor seen through the doorway continues the floor on both sides;
  the leaf and the doorway are then the difference against the base (D148).
  The dormitory's common room door is made so now. Rules out a doorway
  whose floor stops at the door's box.
- **D162 — A dark room is dark in every level played before it is lit.**
  Decided 2026-11-08 by the owner (*en este nivel la sala debería estar a
  oscuras, porque si no ya la ha visto el niño*). *La losa que va y viene*
  plays with the storeroom dark (`dark: ["storeroom"]`) and no light to
  cast; a dark level needs `kirra` among its spells only when a `collect`
  or an `open` goal lies in the dark room, since a `reach` needs no sight
  (`level.py`). Rules out a room seen lit a level before the level that
  lights it.
- **D163 — The plan shows a dark room as the castle's plan.** Decided
  2026-11-08 by the owner (*en el mapa la oscuridad no se debería ver como
  un parche blanco*). The plan (D151) draws a dark room's picture as any
  room's, since the map knows the castle; only the things that lie unlit in
  it are not drawn (the key stays the level's secret), and a figure in it
  is drawn. Rules out a white patch on the plan.
- **D164 — A key is drawn small, and a torch stands over it.** Decided
  2026-11-08 by the owner (*la llave se ve por encima de la antorcha, y es
  muy grande*). A key's picture on a painted scene is drawn at 0.65 of its
  painted size, centred on its cell (D109); a torch's cut-out on a key's
  row is drawn over it. Rules out a key wider than a figure.
- **D165 — A double door opens a quarter turn within its doorway, its feet
  above what lies before it.** Decided 2026-11-08 by the owner (*las hojas a
  90 o 95 grados, lo justo para no dar con el muro; por encima del agujero,
  no por debajo*). The way down's two leaves are asked of the model turned a
  quarter toward the viewer, each standing against the inner face of its
  own jamb within the doorway's width, their feet ending above the hole's
  row, the arch and its jambs exactly the base's (D158 otherwise stands).
  Rules out leaves that barely open and leaves that reach the hole.
- **D166 — A label on the plan covers no figure and no other label, and the
  mark's label no cut-out.** Decided 2026-11-08. The plan's labels (a
  figure's name and cell, a mark's cell) are placed by a search, right,
  left, below, above of their owner, the first place that overlaps no
  figure, no mark, no label and, for the mark's, no cut-out, and they are
  drawn last, over everything. Rules out Nuri's label over Teku's figure on
  P3's plan.

## 2. The owner's comments, and what answers each

| # | Where | The owner (summary) | Piece |
| --- | --- | --- | --- |
| 1 | S1, step 5 | The friend is hidden by the arch: stand her elsewhere. | 34.5 |
| 2 | S1, step 9 | The floor through the common room's door still does not match: ask Gemini the whole scene with the door open; remember the method. | 34.3 (D161) |
| 3 | I1 tick 12 | The mark inside the dark top arch looks cut: it must read as lying on the floor, whole, up to the arch. | 34.2 (D160) |
| 4 | P6 tick 13 | Marks on the floor, covered by what stands before them, with a latent silhouette; every scene, every chapter. | 34.2 (D160) |
| 5 | P7 won | The storeroom must be dark in the slab's level. | 34.5 (D162) |
| 6 | P8 plan | The dark room not a white patch: show the room. | 34.2 (D163) |
| 7 | P9 tick 0 | The key over the torch, and too big. | 34.2, 34.4 (D164) |
| 8 | P9 tick 5 | The double door opens too little; 90 to 95 degrees; above the hole; the arch not resolved. | 34.3 (D165) |
| 9 | P9 tick 16 | Marks behind the figures walking over them. | 34.2 (D160) |
| 10 | Dormitory contact | (10, 15) not walked while the door is open; at (9, 15) the figure behind the leaf. | 34.3, 34.4 (D157) |
| 11 | Long round contact | (9, 13), (10, 13), (9, 14), (10, 14) nudged more toward the middle, not quite between the cells. | 34.4 |
| 12 | Storeroom contact | Figures over the arch at (4, 7) and (4, 8); why no figure on (3, 8); (4, 8), (5, 8), (8, 13), (12, 13), (12, 14) not walkable; the torches at (8, 13) and (11, 13) masked. | 34.3, 34.4 |
| 13 | P3 plan (designer) | Nuri's and Teku's labels cross. | 34.2 (D166) |
| 14 | The plan (designer) | The mark's label over a cut-out. | 34.2 (D166) |

On (3, 8): it is a wall on purpose (D149): with (3, 8) walked, a child
would walk round the hole on row 8 and the slab's lesson would be lost. It
stays a wall; the acceptance test says so.

## 3. The scenes and the levels

**`the-storeroom`.** Walls: (4, 8), (5, 8), (8, 13), (12, 13), (12, 14);
(3, 8) stays a wall. The store arch's mask and the two torches' masks by
difference against one flat-magenta edit of the base
(`storeroom-arch-torches-marked.md`: the arch's band over its opening and
the two torches beside the lower door flat magenta, nothing else changed),
cut with `--rim`, the torches `over` their row; a figure on (4, 7) is
behind the arch's band, none on (4, 8). The slab's level dark (D162), its
mark at (5, 7) seen in the dark as the castle's shape (D52), the friend and
the mate on (0, 8) and (1, 8) as they are.

**`the-long-round`.** The nudges round both arches 0.3 instead of 0.2:
rows 0 to 2 and 12 to 14 of columns 9 and 10.

**`the-way-down`.** The double door's open state asked again (D165), one
whole-scene edit of the base (`way-down-open-quarter.md`), 1 image
(+1 retry); the leaves and the doorway by difference; the key drawn at
0.65 (D164) and the torch's cut-out over it; D157's measures and nudges
recomputed for the new leaves.

**`the-dormitory`** (chapter 2). The common room door's open state asked
as the whole scene with the door open (D161, `dormitory-front-door-open-
whole.md`), 1 image (+1 retry): the leaf and the doorway's floor by
difference against the painting; D157's measures: (9, 15) and (10, 15)
covered or behind the leaf as the difference says; chapter 2's stories and
levels that walk row 15 while the door is open are played by the staging
check and amended if a step crosses a covered cell (the step walks round by
row 16 if the scene has it, else the story's staging is asked of the
designer through the owner). S1 step 5: the friend comes into the room,
to (12, 13), the wizard stepping to (13, 13) and the mate at (11, 13) in
step 3, so that no one stands under the arch when the friend speaks; step 9
goes out from there.

## 4. The pieces

### 34.1 The world and the tools

- D162 in `level.py`: `kirra` required only with a `collect` or `open`
  goal in a dark room; `test_a_dark_level_needs_kirra` says so; a test that
  a dark level with a `reach` alone loads.
- The map and settings of the storeroom and the long round (section 3).
- Check: `world/tests`, `tests/project`.

### 34.2 The page

- D160: the mark at the ground's depth with its silhouette where covered,
  in `engine/scene.ts` and the silhouette module; `markDepth` and D79's
  door rule removed; a Vitest test on the depths and a browser test that
  the mark's silhouette shows under the three doors' top arch and under the
  wizard standing on it.
- D163: the plan draws a dark room's ground and cut-outs, not its unlit
  things; a Vitest test on `planShapes`.
- D164: the key's scale and the torch's depth over it; a Vitest test.
- D166: the plan's labels by search, drawn last; a Vitest test that no two
  labels and no label and figure overlap on P3's plan and that the mark's
  label touches no cut-out.
- Check: Vitest; e2e in 34.6.

### 34.3 The pictures

The storeroom's magenta edit (1), the way down's door (1 + 1), the
dormitory's door (1 + 1): their masks by difference, the sheets looked at
(every leaf whole, the arch's band and the torches cut to the pixel, the
dormitory's floor running through). Images: 3 (+2 retries), 95 of 100 at
most.

### 34.4 The cells

`art.json` of the storeroom, the long round, the way down and the
dormitory as section 3 and D157's measures; the sweep green in the five
scenes; `tests/project` on the storeroom's walls and the dormitory's
covered cells.

### 34.5 The levels and the story

`the-moving-slab` dark (D162); `after-dark` steps 3, 4 and 9 (section 3);
the staging check; `test_passages.py` on the dark slab's level.

### 34.6 The walkthrough and the documents

`npm run walkthrough -- 03-passages` to a new document; chapter 2's
browser tests green with the dormitory's door; `architecture.md` D160 to
D166 (D79, D109, D151, D158 say where they take over); `art/README.md`:
*How a scene's states are made* gains D161 (the open door asked whole);
`plan.md` 5.5; the report in Spanish and the prompt for the review.

## 5. Gemini images

Three images and two retries at most: 95 of the chapter's 100.

## 6. What the owner tries

1. Any level: the mark lies on the floor, the wizard walks over it, an
   arch's band or a statue covers it and its silhouette shows through.
2. *La losa que va y viene*: the storeroom dark; the mark seen in the arch.
3. *La sala oscura*'s plan: the room drawn, the key not.
4. *El paseo nocturno*: the key small beside the torch; the double door a
   quarter open within its doorway, its feet above the hole, the arch
   whole.
5. *Después del anochecer*: the friend whole inside the room at step 5; the
   common room's floor running through the open door at step 9.
6. The contacts: the storeroom's (3, 8), (4, 8), (5, 8), (8, 13), (12, 13)
   and (12, 14) empty, the arch and the torches over the figures; the long
   round's figures clear of the arches; the dormitory's (9, 15) and (10, 15)
   behind or free of the leaf.
7. P3's plan: no label over a figure; the mark's label clear of the statue.

## 7. What the implementer hands over

A report in Spanish with only pictures of the final commit (a mark under
an arch and under the wizard, the dark slab's level, the dark room's plan,
the way down's door and key, the dormitory's door and step 5, the
storeroom's contact, P3's plan), the commits, the differences from the
plan with their reasons, the images spent against 100, the walkthrough
document's path, what is left open, and the prompt for the designer's
review in English, in a code block.

## 8. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-34.md (this plan, whole), docs/dev/sprint-33.md and
sprint-32.md (how chapter 3's scenes are made), the owner's comments in
drafts/recorrido-capitulo-3-2026-11-08-3.es-comments.md (under each
picture, in Spanish: the sprint answers them), art/README.md whole,
D52, D79, D109, D125, D148 to D166 in docs/dev/architecture.md, and the
memory notes kydux-two-agents, kydux-sprint-33-state,
kydux-designer-review-33 and kydux-designer-scene-states-method. Build
sprint 34 whole: pieces 34.1 to 34.6 in order, one local commit each,
ci/check.sh --e2e green before each, never a push, never a timer (the
owner pushes with ci/push.sh). Never stop or build into the servers on
ports 443 and 5173, and never kill a vite, node or nginx process of the
owner's (CLAUDE.md); your own preview on 4174 is stopped when you are
done. D148 holds: Gemini paints every state of a scene and nothing the
child sees is painted, moved or pasted by a tool; an open door is asked
on the whole scene (D161). Gemini paints at most three images in this
sprint and two retries, within the chapter's ceiling of 100. Every text
the child reads comes from a content file or t(); this sprint writes
none new. The plan decides everything; where it does not, take the
smallest choice that keeps its intent and say it in the commit; a
choice that changes what the owner sees is asked first, through the
owner. Every document and comment in the present. Before git add, read
git diff of each file and stage only your own hunks; commit promptly.
Hand over as section 7 asks, as a report in Spanish, and end with the
prompt for the designer's review in English, in a code block.
```
