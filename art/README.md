# Kydux — the art

This is the style guide for the game's pictures, and how each one is made.
The decisions behind it are D72 and D76 in `docs/dev/architecture.md`.

## The look

The game is painted cartoon art: bold dark outlines, warm saturated colour
and soft painted shading. Children's adventure games are the family it
belongs to. The light is a warm dusk outside and lamplight or moonlight
inside.

The view is three-quarter top-down. The ground is seen from above. Every
upright thing shows its top and its front, the side that faces the viewer.
Nothing is isometric and nothing is drawn on a diagonal: every edge runs
along the grid's rows or columns, because the wizard moves only up, down,
left and right.

The characters are small, with big heads, about one and a quarter cells
tall.

## The grid

The world is a grid of square cells, and everything stands on it. A path,
a wall or a fence follows the cells' edges, and a path runs along the rows
and the columns. A thing fits one cell where it can: a rock, a stone, a
bush. A tree's trunk stands on one cell, and its crown may spread over the
cells above it. The game draws a thin pencil grid over the ground, so that
a child can count steps. A painting must still read well under it.

The game draws over the painting what changes with the play: the goal's
mark, a round ring that beats in size and colour, and the glow of a
sealed door's rune while the seal holds. Neither is painted.

## How a scene is made

A chapter's scene is one painting. Its map is read from the painting.

1. Write the scene's requirements from its levels, as plain facts: "two
   paths, one with a gate", "the wand on a flat stone a step off the path".
   Put them in a prompt file in `tools/art/prompts/`, with the style
   sketch as the style's reference.
2. Ask for the painting with a faint grid of square cells over it. Paint
   again rather than force a picture that misses a requirement.
3. Mark each cell from the painting with `tools/art/map_from_image.py`:
   walked on or not, seen through or not, and its kind. Every cell a
   tree's trunk, a rock, a fence or a stone stands on is marked as not
   walked on. A cell under only a crown, its foot in a cell below, is
   walked on: the figure passes behind the crown. This gives the scene's
   `map.txt` and `scene.json`. The world plays on that map, and the
   painting is cut by it too.
4. Ask Gemini for an edit of the painting without each thing that opens
   or is picked up, one thing an edit. The edits must line up with the
   painting pixel for pixel.
5. Write the scene's settings, `art/scenes/<scene>/cut.json`, the field's
   as the model: where its pictures are in `art/raw/`, each thing that
   opens or is picked up (its box in cells, its row, its states and the
   edit without it), the rows of the walls' tops (`cuts`), the row above
   which the painting stays ground (`castle`), the patches of the ground,
   and the colours the painting is read by (`thresholds`), when its light
   is not the field's.
6. Run `tools/art/export_scene.py <scene>`. It writes the scene's files into
   `content/art/scenes/<scene>/` and the check pictures into
   `art/raw/game-check/`. Its last step, `check`, also sweeps the scene
   (`tools/art/sweep.py`): it stands the wizard on every cell walked on,
   writes `sweep-<scene>.png` with every cell where something covers it,
   lists the cells where the wizard is wholly hidden, and fails when a
   cut-out breaks one of the rules below. Run it after every export, and
   look at its sheet before anyone plays the scene.
7. Paint the margin, the scene going on beyond its playable area (D83):
   say its cells in the settings (`margin`), make the canvas with
   `tools/art/margin.py <scene> canvas`, ask Gemini to paint its border
   (the field's prompt is `tools/art/prompts/image-first-field-margin.md`),
   and join it with `tools/art/margin.py <scene> join <picture>`. The tool
   says where the border does not meet the painting's edge; ask again for
   a border that breaks there, naming what the edge cuts. It leaves out
   the painting's few outermost pixels and brings the border's colours to
   the painting's along the seam. Then export: the margin is drawn a
   little in shadow outward. A scene painted from the start with its
   margin, the next ones, has no seam at all: ask for the whole picture,
   its playable area in the middle, and make every edit of it whole.
8. Place the levels on the new map, each starting where the one before
   ended. A level's start, its mark, its things and its friend stand on
   free cells that no cut-out covers. `tests/project/test_art_content.py`
   checks both rules against the painting's cut-outs.

## What surrounds a scene

A scene's margin (D83) is the rest of the place seen from above, where
no one walks, never a frame and never a void: a painting zoomed out shows
more of the castle, not black and not a floating room. Rule given by the
owner on 2026-10-26, for every scene from the dormitory on:

- **Indoors, the margin is the castle.** The room's own thick outer
  walls; beyond them, on one side, a neighbouring room of the same kind
  seen in shadow, with a solid wall between and no way in, such as the
  second-year dormitory beside the first-year one; on another side, the
  castle's massive walls and round towers with battlements and roofs;
  below, the corridor that gives access to the room through its door, and
  to the neighbouring room through a door of its own.
- **Where the castle ends, the sky.** Above the walls and the towers, and
  in the corners: a starry night sky for a scene at night, the same the
  windows show; a pale morning sky with clouds for a scene by day. Each
  scene is painted at its own hour, and its light says so.
- **A scene painted at night has its morning picture** (D126), when a
  morning story plays on it or a night spent in it ends in the morning.
  Gemini paints the whole painting again by morning, given it as it is:
  the same things in the same places, the sky and the outside by day, the
  rooms lit by day and every torch, candle and fire out (the dormitory's
  prompt is `tools/art/prompts/game-dormitory-day.md`). `tools/art/trace.py
  <scene> fit <picture>` lays it on the painting box by box, every static
  thing's and every door's, and says how far each is off and how much of
  the painting's dark outlines it covers. Where every box lies within
  three pixels, the picture is the morning, whole: a section with `whole`
  (`repaint.py <scene> join <picture> --section <name>`) lays it on the
  painting by its outlines, the settings' `sources` name it in `hours`
  (`{"morning": ...}`), and the export cuts every image of the scene from
  it a second time with the same masks, `<image>-morning.webp`: the
  ground, a doorway's fill given the hour's light of the floor it is taken
  from; every row's image; every state of every thing, a door's leaf
  swung open given the hour's light round it. The page shows them over
  the night ones as the day comes and lays no light over the morning. The
  share of the outlines covered tells a picture painted wrong; a night's
  outlines, thickened by its shadows, and its rooms in the dark keep it
  low even where the picture lies in place, as the dormitory's does.
  Where the picture does not fit, the sky above the walls, each window
  and everything beyond the castle's walls are taken from it in boxes
  (and polygons, `areas`, along a slanting wall's outer line), each faded
  in on the outlines that bound it, into a picture the settings'
  `sources` name in `grounds`; the inside stays the night painting's,
  under the morning's light, and a row's image that holds some of the
  outside is named in `rows_morning` and has a morning image of its own.
  Either way the export writes `ground-morning.webp` beside `ground.webp`,
  and `morning-<scene>.png` among the check pictures, every row and thing
  over it, to look at for a night piece left over the day, and the page
  fades the morning in over the night at the dawn (D124).
- **What a model leaves unpainted round a place is painted as the castle's
  inside.** A scene asked as a place (D136) may come with black or pale paper
  round it. `tools/art/repaint.py` paints what is empty (`void`) in one section:
  the model is given the picture with that part flat, black, or in a dim colour
  where it keeps black as a gap and pale paper as the page (`flat`), and asked for
  the tops of thick walls and dim closed rooms, and what it still leaves is laid
  with the picture's own stones, mirrored so that they meet (`tiled`). Chapter
  3's scenes are mended so.
- **A wall may be moved along its rows, or a corridor made wider, without a
  model** (`repaint.py spaced`): a wall with its door moved whole and the plain
  floor beside it stretched, where a loop needs its doors evenly apart, or a level
  needs a third cell across. Its seams lie on the outlines of what is moved.
- **Outdoors, the margin is more of the same ground**, woods, rocks and
  fences no one could walk through, as the field's.
- **A margin painted on later is joined, the painting kept.** For a
  scene chosen without one, `tools/art/margin.py <scene> canvas` puts the
  painting on a canvas grown by the margin's cells, its edge blurred
  outward; the model paints the border; `margin.py <scene> join
  <picture>` lays its picture by the least difference over the painting
  and keeps the painting pixel for pixel. Where the model's picture falls
  short of the canvas's edge, its outermost pixels are stretched out to
  it. The library's sides are painted so (D92).
- **The margin is painted with the scene from the start**, in one
  picture, the playable area in the middle, four or five cells on each
  side and two above and below (D118): a scene is taller than wide more
  often than not, and the zoom wants its room at the sides. What fills
  the margin keeps a figure out of it of itself, walls, bushes, rocks,
  water, a drop, never a floor one could walk on. Every edit of the painting is made whole, margin
  included. Ask for every cell painted, and say "never black": a model
  asked for "no floor there" paints black.
- **One winding way.** Each chapter's levels chain, each starting where
  the one before ended, so the scene is one route from its entrance to
  its end, like a snake, with no second way from one part to the next:
  a second route leaves a level with nowhere to start. Say in the prompt
  how many doors there are, which wall each is in, and that no other
  opening exists; a model given two routes paints a third.
- **A thing the levels move stands in the painting at one place**, where
  the cut takes its picture from: a key that lies behind a bookcase or in
  a different cell each time the level is played is painted once on open
  floor, and the game draws it where the level says (`at` in the scene's
  `cut.json`, D85), the middle of its picture on the middle of that cell
  (D109); laid on a cell no one walks, under a bookcase, it is drawn under
  that row's things.
- **Once chosen, a painting is mended, not painted again** (D88). A
  model asked to edit a whole picture paints it all again, and moves what
  is to be kept. A fix is made with `tools/art/repaint.py <scene> canvas`: the boxes
  to mend, and a band below when the picture must go on, blurred on a
  canvas, and the model given a crop of it large enough that what is kept
  fills it (`repaint` in `cut.json`, with its prompt in
  `tools/art/prompts/`); then `repaint.py <scene> join <picture>` takes
  the boxes and the band from the model's picture, faded into the painting
  over a few pixels round them, the painting itself elsewhere. The scene's edits that showed the part as the painting
  did, its ground-only edit and its marked picture, are mended with it
  (`also`), so that the cut finds no difference there; a mend that takes a
  door out of its doorway makes the doorway's dark magenta in the marked
  picture (`opened`), which the scene's `marks` then name (`mended`).
- **What stands in front of a figure and never changes is a static thing**
  (D89): a bed, an armchair, a counter, a bookcase, a lamp, a wall. It is
  marked flat magenta by Gemini (the owner's way): the scene's settings'
  `marks` give the crops of the painting Gemini is given, each asked to
  turn only the named things magenta and to redraw nothing, and
  `tools/art/repaint.py <scene> marks` lays each answer on the painting,
  whole and then part by part, its outlines onto the painting's. A part may be
  asked several times, and is then magenta where most tries agree: each
  try strays somewhere else. The thing is its magenta whole, with the
  painting's outline beside it (`"mask": "marked"`); a wall cut round its
  openings is its box less the magenta (`"unmarked"`); a wall a model
  cannot paint flat is a polygon in cells, each edge on its outline
  (`"polygon"`), and its part with no outline between it and what lies
  beyond, a stone's sunlit top or a wall's foot on a beam of its colour, is
  the polygon's as drawn (`fixed`); a part of it that is behind a figure,
  the inside of a doorway's arch and its line, is a hole (`holes`), taken
  out after the snap, which would take the line back in. A thing with others standing just behind
  it, a counter before its wands, takes only its own line (`lined`). Things
  that lie on other things, a bed's covers, are marked in a set of their own
  (`sets`). Ask Gemini to name every small part, the candles and their
  flames too: it leaves out what the prompt does not name.
- **A wall and the door in it leave no gap.** A static thing gives up to a
  door, a key or a book exactly the pixels of its cut-out, so that nothing
  between them shows a figure behind. An arch is a polygon of its dome and
  its sides, less the door's cut-out and the threshold between them.
- **Where a thing is drawn among the figures** (D95): on the row of its
  foot, over the figures standing above it; a shut door and an arch
  (`"under"`) over the figure in its doorway too, while an open door's
  doorway, what is seen through it, is under that figure; a wall seen from
  above and a chandelier hanging above every head (`"over"`) over every
  figure; what hangs on a wall at a figure's height (`"hangs"`) as
  its row's, standing on no cell. A scene's `lowered` cells draw a figure
  lower, so that a counter on the row below hides its legs, and its
  `nudged` cells draw a figure sideways, by the strip's middle less the
  cell's, so that it walks the painted strip where the painting's strip is
  off its cells' middle (D105). An open door is its leaf swung against the
  wall beside its doorway (D111), drawn by its open state's `row` when that
  wall is drawn on another row than the door, and its doorway's floor is
  the ground's, under every figure (D108); the cells of that row its leaf
  lies on, where a figure would stand behind it, are the door's `covers`
  in the scene's `scene.json`, which no one walks onto while it is open
  (D125): a cell whose lower part, from 0.45 of it down and its sides left
  out, the leaf covers by more than a fifth, measured by `export_scene.py
  check` and held by the content test; a door's `rest` is the state it
  is drawn in where no level or story places it (D104). A
  scene's `dark` passages draw a figure darker the deeper it goes into
  them, its head darker than its feet (D100). A tall bookcase a figure in
  a story steps out from behind (D128) is a static thing cut by the
  polygon traced on its outline and `"under"` on its row, so that the
  figure is wholly hidden on the cell behind its end; `export_scene.py
  check` counts the figure's pixels seen there, none.
- **A thing painted too big for its place is drawn smaller** (`scale`), on
  its foot's middle, over the picture without it: a book on a shelf; a
  scale by state (`{"pulled": 0.72}`) shrinks that state alone.
- **A thing's picture without it may be a box of another picture**
  (`without` as `{"picture", "box", "from"}`): the painting with that box
  taken from the picture named, so that what Gemini painted beside the
  thing stays; its mask is that difference, left unsnapped (`snap: false`)
  where the snap runs into lines that are not the thing's. A state may be
  cut from a picture of its own against its own edit (`{"picture",
  "without", "solid"}`), or, where the model painted the thing's
  surroundings again so that the difference takes them too, by the polygon
  traced round the thing on its outline (`{"picture", "traced"}`): Eldra's
  book standing upright among the others on her bookcase, with nothing of
  the books beside it.
- **A bed's cover is its quilt and its folded sheet** (D97), from the
  sheet's dark line by the pillow to the foot, the pillow left out. Its
  mask takes only its own line (`image_first.lined`), so that the pillow's
  line and the strip of bed beside the sheet stay under the head. The
  pillow's middle is the head's point in `cut.json`'s `beds`, as far from
  the sheet's line in every bed. A sleeper lies over the bed's frame and
  under its cover, with the head on the pillow and the sheet's line over
  the body. The scene's `scene.json` names, on each bed, the floor cell
  under its pillow (`pillow_side`): the cell of the row just below the
  bed nearest the pillow's point, which a figure going to bed walks to and
  hops in from (D130); a bed with a wall in front of it has none, and no
  level or story sends anyone to bed in it.

## The rules for the cut-outs

Each raised thing is cut out and drawn in order with the figures, by the
row its foot stands on.

- **Nothing reaches below its own row.** A shadow that falls lower goes
  back to the ground, or is painted apart. A door may reach a little into
  the cell below, its threshold (`reach` in the scene's `cut.json`); a figure
  standing there is drawn over it.
- **A thing covers only the cells above it.** So it hides a figure that
  stands behind it, and a figure that stands in front of it is drawn over
  it.
- **What is drawn in front of a figure hangs from its foot.** A crown, a
  rock or a wall's top reaches down to the row it stands on without a
  break. A shadow, a flower or a tuft on the lawn, with lawn between it
  and that row, lies on the ground, and so does the lawn between two
  things: none is drawn over a figure (`floating` and `lawn` in the
  sweep).
- **A crown is whole.** Its sunlit leaves, coloured as the grass, are what
  its dark outline closes in, and are of it; no gap in a crown shows the
  figure behind it (`hole` in the sweep). Over a wall, only the leaves are
  the tree's; the stones stand on the wall's row.
- **What opens or is picked up is cut against its edit without it.** A
  gate that opens must leave no ghost bars, and a wand picked up must
  leave its stone whole. An open door is drawn as its edit shows it open,
  its leaves seen (D101). Where that picture goes wrong, a door in a wall
  seen from the front with room behind it swings in out of sight: its
  whole doorway, from the arch to the threshold and over the threshold's
  line, is the floor of the room beyond, taken from the painting itself
  where that floor is plain, darker under the arch and as lit as the room
  at the threshold, laid in by `tools/art/repaint.py doorways` (D108),
  the leaf found from seeds across it within its own box (`leaf_box`),
  from one jamb to the other and down to its foot, so that no board of the
  leaf is left there: the floor's own dark line under a threshold, or the
  closed leaf's own bottom outline, gone through to its lower edge. At
  that foot lies a threshold (D114), 0.08 cells high, inside the doorway
  and never over the floor before it: a strip of the floor seen through
  the doorway turned a quarter, a board with its grain across the doorway
  or a flagstone, a tenth darker than that floor, its two edges thin wavy
  lines in the colour of that floor's joints, never the outlines' black.
  Over the closed leaf's own outline, the threshold reaches down to the
  jambs' feet, where their bottom outline ends beside the fill, over the
  doorway's own floor, and the fill reaches down to its top; on the
  floor's own line, where the floor before the door begins, it ends on
  that line, even where the jambs stand lower. The fill and its threshold
  are laid into the scene's other pictures that show the doorway shut,
  its ground-only edit and its marked picture (`also`), so that the cut
  finds no difference there, each from its untouched copy beside it
  (`<stem>-untouched.<suffix>`), made from the picture on the first run
  that finds none: a doorway laid again leaves nothing of the one before.
  `repaint.py marks`, writing a marked picture the doorways are laid
  into, writes its untouched copy too, so that the doorways laid after it
  go on the new one.
  Its leaf, so that the door is seen open and the doorway is not taken for
  the floor, is swung out against the wall beside the arch: a model's
  picture, painted on the guide the tool draws (`guide`, the shut leaf
  turned over on its hinges, with its shadow) and joined as any box is,
  the open state's picture (D111).
- **A door's leaves are cut by the shapes traced round them** (D113). The
  open state is the polygon traced by hand on the swung picture (`leaf`,
  in cells): round the wood, the hinges and the iron of the leaf, on the
  outer edge of its dark outline, and round the shadow it throws on the
  wall out to where the shadow fades into the painting's own wall; the
  free edge and both bottom corners whole, and no stone the model painted
  again beside the hinges. It is drawn at the painting's size with its
  edge soft over one pixel, and nothing of it is snapped, flooded or kept
  by size; the sweep judges its edge on its own picture composed on the
  ground, its hinges' outlines there, not on the ground the scene was cut
  from, which has no leaf. The closed state is the painting within the
  doorway's polygon (`doorway`: the open doorway's fill and its threshold, every pixel
  where the doorway picture differs from the painting, grown over the
  arch's inner line by the width of the painting's outlines, about seven
  pixels), so that the wall keeps its line round the door's cut-out, no
  mortar line of the wall beside the arch comes with the leaf, and
  nothing of the open doorway shows through it. `tools/art/trace.py
  <scene> footprint <door>` makes that polygon, and it is made again
  whenever `repaint.py doorways` lays the fill again. A static thing's
  hole (`holes`) takes every pixel its polygon touches and two more round
  them, the reach of the page's resampling, so that a hole traced from a
  leaf leaves no pixel of the wall on it.
  `tools/art/trace.py` helps to trace a leaf: `outline` gives a first
  polygon, `look` a crop at three times the size with a grid every tenth
  of a cell and the points numbered, and `--diff` shows in red what the
  model painted again round the leaf. Twenty to sixty points a leaf, the
  top's curve with a point about every 0.05 cells.
- **A cut-out ends at the outer edge of its outline** (D93): the outline is
  the thing's, and nothing of the ground beyond it is (`fringe` and `bare`
  in the sweep). Every mask but a box's, and one its thing says not to (`snap: false`),
  is moved onto its outline (`image_first.snapped`); a mask drawn inside the outline, Gemini's
  magenta, has the outline added and nothing taken away
  (`image_first.rimmed`). A painting whose outlines are not black, a night
  scene or a brown-lined room, gives its outline's darkness in `cut.json`
  (`thresholds`, `outline`).
- **A thing is one thing, on the row of its foot** (D94). Where a thing is
  cut across a row's edge, the figure stands inside it, behind one part and
  in front of the other (`spill` in the sweep): the scene's settings give
  the thing its row (`rows`), give a patch of lawn cut as a thing back to the
  ground (`grounds`), keep a crown whole behind a gap in its outline
  (`kept`), or fill its holes (`whole`). Where the sweep flags what is the
  thing all the same (a light stone top with no line on it), `kept` says so,
  and the commit names it.

Look at every check picture before committing. Each shows a figure behind
and in front of a row's things, and `all-<scene>.png` the wizard on every
cell walked on at once, every door open, as it is when someone stands in
its doorway, and every passage as dark as the page draws it.
`states-<scene>.png` shows each thing with states, a row each: the ground
round its box and each state drawn on it, at three times the page's size
(twice for a thing 300 pixels wide or more), with the state's edge in
magenta. A door's state is accepted only when that edge lies on the
leaf's outline all round: the bottom corners whole, the shadow's edge a
smooth line, no floor or wall inside it but the shadow, no pale fringe
along the free edge; a closed leaf's edge on the arch's inner line and the
threshold, no line reaching into the wall. `doors-<scene>.png` shows every
state of every thing with states composed as the page draws the scene,
with no figure: the ground, every row and every thing at its depth, the
others resting, each panel round the thing's box with a cell of margin,
enlarged as on the states sheet and numbered from 1, four a row. On it,
each open leaf is whole to its foot, its lower corners rounded; each open
doorway ends in its threshold, its foot on the jambs' feet with no floor
between them, or on the floor's own line where the floor before the door
begins, the floor before the door untouched below it; no outline of the
closed leaf is left at a doorway's foot. To name a cell when something
looks wrong, open the game with `?debug` (docs/dev/dev-environment.md).

## What a painting must keep to

The cut reads the painting by rules, and a painting that breaks one is cut
wrong in a way the sweep may not catch. Ask for these in the prompt, and
look for them in the picture before cutting it.

- **Every raised thing has a dark outline all round it.** A crown's sunlit
  leaves are found by the outline that closes them in; a crown whose
  outline fades out on its lit side leaves a hole that shows the figure
  behind it, and the sweep cannot tell such a hole from the lawn.
- **Things stand apart.** Two crowns, or a crown and a rock, that touch
  each other close lawn in between them, and that lawn is cut as theirs
  and drawn over a figure. Leave grass between things, or let one hide
  the other wholly.
- **Flowers, tufts and stones that are walked over lie clear of things.**
  What touches a crown, or lies within half a cell of it, is taken as the
  crown's and drawn in front of a figure. Keep them a cell away from
  anything raised.
- **A thing is at most three cells tall above its foot.** Higher up, its
  pixels are given the row they lie on and the figure walks over them.
  Something taller, like the castle, is ground: say so (`castle` in
  `cut.json`), and nothing of it is cut out.
- **A wall's top is a straight row of cells, said in `cuts`.** Things never
  hold together across it, and a crown over a wall keeps only its green
  leaves and the outline next to them.
- **Trees are green, walls are grey.** On a wall, what is green within a
  tree's reach is the tree's; a green thing painted on a wall, like ivy,
  would be cut as a crown.
- **Shadows fall on the ground, below and beside the thing, in its colour
  darkened.** A shadow is told from a thing by being the ground's own
  colour made darker; a coloured shadow, or one cast on another thing, is
  cut as a thing.
- **The ground-only edit keeps the ground pixel for pixel.** The cut is
  the difference between the painting and that edit; where the edit moves
  the lawn's brushstrokes, the difference shows them as things.
- **Lawn, path and the painting's light stay in the colours of
  `image_first.groundlike`**, lit grass and tan dirt. A scene painted at
  night, or indoors on stone, needs its own thresholds in `cut.json`
  before it is cut; the field's are the defaults.

The rules the sweep checks (`floating`, `lawn`, `hole`) catch the first
three when they go wrong over a cell walked on; the others it cannot see.

## What a scene is painted for

A painting asks things of the cut, and a scene painted for the cut asks
little (D99). A scene still to paint keeps to these, in its prompt and in
the choice among Gemini's tries:

- **The grid comes first** (D102). The map is drawn before the prompt is
  written: rooms, walls, doorways, furniture and every walked strip on the
  grid, every wall on a cell line, every doorway whole cells wide, every
  walked strip at least a cell wide and in the middle of its cells, every
  thing in whole cells, no slanting perspective that takes a wall from one
  column into the next. `tools/art/layout.py <scene>` draws it
  (`art/raw/<scene>/layout.png`), and it is the prompt's first picture; a
  try is laid under the same grid with `layout.py <scene> --over <try>`
  and chosen only when its walls, doorways and furniture lie in the
  layout's cells. A try that is off is asked for again, not mended. The
  prompt asks for the picture on the grid as if the grid lay on the floor
  (D115): the things and the edges coincide roughly with the cells'
  lines, a thing's base in its cells and its height free to rise over the
  cell above; it never lists what each cell holds.
- **The floor a figure walks is open.** Furniture stands against the top
  wall or in the corners, where no figure walks beside or behind it. A
  thing in the middle of the floor costs a mask to make and to check; one a
  scene at most, and only where the story needs it.
- **Doors are doorways.** A door a figure walks through is in a wall seen
  from the front, with an arch at least two cells wide and a fifth of a
  cell taller than the tallest figure, so that the check's tenth (D98)
  holds with room to spare; open, it shows the floor of the
  room beyond, at that room's light (D108). Every door is asked of the
  model shut and open when the scene is painted, and both masks are made
  from those pictures (D116); the open picture shows the floor of the room
  beyond, never the room before, and at the doorway's foot a joint
  painted from jamb to jamb, a board or a row of paving, where the two
  floors meet, so that the tool's threshold (D114) is not needed. A leaf's
  lower corners and the row it is cut at below are what most often go
  wrong: look there first on the doors sheet. No slits in walls seen from
  above: a wall between rooms is seen from the front, or the rooms are two
  scenes. Where a painting has a doorway in a wall seen from above, the
  walked cells go through that doorway and no other, and whoever stands in
  it is behind the wall's band and in front of the doorway's inside
  (D104): the wall's polygon takes in the band and leaves the inside out.
- **Shelves are one row, against a wall.**
- **Nothing hangs from what the picture does not show.** A lamp is on a
  wall or a stand, or ends at its ring.
- **No one is painted into the scene.** A keeper or a teacher is a figure
  the page places; a counter stands where the figure behind it is drawn
  whole, or lowered behind it.
- **Every thing has its outline closed, black, and its base in its own
  cells.** A rock's base, a tree's roots and a bed's foot end in the cells
  the map marks not walked on.
- **Things stand apart**: a chair is not tucked under a table, a torch is
  on the wall, a book is on the floor, not against a shelf.
- **Each thing is marked in magenta when the painting is chosen**, three
  tries a part, every small part named, so that no scene is cut by colour.
- **Figures fit** (D98): a child at most 1.15 cells, a grown-up, who wears
  no hat, at most 1.31, every door a tenth of a cell taller than who walks
  through it.
- **Where a painting's strip still falls off its cells, the figure moves,
  not the map** (D95, D105): the cells are named in the scene's settings
  with how far a figure on them is drawn lower (`lowered`: the library's
  counter, half a cell) or sideways (`nudged`: the library's cells beside
  the vault's wall, the dormitory's along the wall between the rooms),
  so that the figure walks the painted strip and the map stays the map.
  Lesson the owner drew on 2026-10-29 from chapter 2.

## The figures

Each character is a sheet of four rows, one for each way it faces (down,
left, right, up), with three walking frames in a row. The wizard's sheet
has four more rows below, in the walking rows' order: casting, with the
wand raised, pointed with its light, and lowered. Then four rows picking
up, in the same order: bending forward, both hands at the ground in front
of the feet, in the middle, never to a side, and half up again; a frame
the model draws too tall is lowered to the same depth for every way, and
the row seen from behind, which a model leaves standing, is the standing
frame lowered so. Last, one row facing down, celebrating: the arms up, a
jump, down again. Then one row lying on the back, eyes closed, head at
the top, for a pupil asleep (D91): the page turns it along the bed. A
friend's sheet has its walking rows and its lying row after them.
`figures.json` names where each part begins (`rows`, and `sheets` for a
sheet laid out otherwise), and the page reads it there. The frames are drawn on the
same scale as the scenes. `content/art/figures/figures.json` says the
frame's size and where the feet are.

Every sheet is steadied before the game uses it: each frame is shifted
sideways so that its body lies over its row's standing frame, which keeps
a figure from swaying as it walks. Then each step frame becomes the
standing frame with only its legs taken from the step's drawing, so that
a figure walks moving its feet alone, never turning its head or its arms.
A figure that floats, the ghost, has its dress grow downward in its step
frames instead. Both are done by `tools/art/figures.py`.

Each friend comes in two sets of colours (D90), `nuri-a`, `nuri-b`,
`teku-a` and `teku-b`, recoloured from the friends' bases with the colours
of `FRIEND_SETS` in `app/src/engine/looks.ts`; the game wears the set
farthest from the wizard's look and from the other friend's.

A door that opens may have a half-open state, between its closed and its
open ones. It is an edit of the painting like the others, and the game
shows it for a moment as the door opens.

## Where things are kept

- `content/art/`: what the game draws. Each folder has a `SOURCE.md` that
  says how it was made and under which licence it ships.
- `tools/art/prompts/`: every prompt, with its service and model.
- `art/raw/`: the trials, the raw pictures and the check pictures. Git
  ignores this folder.
- `art/scenes/<scene>/`: each painted scene's settings, `cut.json`, with
  its manifest: the field, the entrance hall, the dormitory, the library,
  and chapter 3's seven: the tunnel, the crossing, the two doors, the three
  doors, the long round, the storeroom and the way down.

Everything the project makes ships under the GPL, like the code. A picture
from anywhere else comes in only under a licence that lets it ship with a
GPL game, with its origin, author and licence beside it.
