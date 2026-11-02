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
  picture, the playable area in the middle, three or more cells on each
  side and two or more above and below; a wider one costs nothing and
  frees the zoom. Every edit of the painting is made whole, margin
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
  `cut.json`, D85).
- **Once chosen, a painting is mended, not painted again** (D88). A
  model asked to edit a whole picture paints it all again, and may change
  what was to be kept: the library's border edit took its reading room
  away. A fix is made with `tools/art/repaint.py <scene> canvas`: the boxes
  to mend, and a band below when the picture must go on, blurred on a
  canvas, and the model given a crop of it large enough that what is kept
  fills it (`repaint` in `cut.json`, with its prompt in
  `tools/art/prompts/`); then `repaint.py <scene> join <picture>` takes only
  the boxes and the band from the model's picture, the painting pixel for
  pixel elsewhere.
- **What stands in front of a figure and never changes is a static thing**
  (D89): a bed, an armchair, a counter, a bookcase, a lamp, a wall. It is
  marked flat magenta by Gemini (the owner's way): the scene's settings'
  `marks` give the crops of the painting Gemini is given, each asked to
  turn only the named things magenta and to redraw nothing, and
  `tools/art/repaint.py <scene> marks` lays each answer on the painting,
  whole and then part by part, its outlines onto the painting's. A part is
  asked three times or more and is magenta where most tries agree: each
  try strays somewhere else. The thing is its magenta whole, with the
  painting's outline beside it (`"mask": "marked"`); a wall cut round its
  openings is its box less the magenta (`"unmarked"`); a wall a model
  cannot paint flat is a polygon in cells, each edge on its outline
  (`"polygon"`). Things that lie on other things, a bed's covers, are marked
  in a set of their own (`sets`). Ask Gemini to name every small part, the
  candles and their flames too: it leaves out what the prompt does not
  name.
- **Where a thing is drawn among the figures** (D95): on the row of its
  foot, over the figures standing above it; a door and its arch
  (`"under"`) over the figure in its doorway too; a wall seen from above
  (`"over"`) over every figure; what hangs on a wall (`"hangs"`) as its
  row's, standing on no cell. A scene's `lowered` cells draw a figure
  lower, so that a counter on the row below hides its legs.
- **A bed's cover is its quilt and its folded sheet** (D97), from the
  sheet's dark line by the pillow to the foot, the pillow left out; the
  pillow's middle is the head's point in `cut.json`'s `beds`. A sleeper
  lies over the bed's frame and under its cover, with the head on the
  pillow and the sheet's line over the body.

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
  leave its stone whole. An open door shows the floor of the room beyond,
  from Gemini's edit of the doorway alone, laid on the painting.
- **A cut-out ends at the outer edge of its outline** (D93): the outline is
  the thing's, and nothing of the ground beyond it is (`fringe` and `bare`
  in the sweep). Every mask is moved onto its outline
  (`image_first.snapped`); a mask drawn inside the outline, Gemini's
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
cell walked on at once. To name a cell when something looks wrong, open
the game with `?debug` (docs/dev/dev-environment.md).

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

The three sprints that went to chapter 2's scenes went to things the
paintings asked of the cut (D99). A scene still to paint keeps to these, in
its prompt and in the choice among Gemini's tries:

- **The floor a figure walks is open.** Furniture stands against the top
  wall or in the corners, where no figure walks beside or behind it. A
  thing in the middle of the floor costs a mask to make and to check; one a
  scene at most, and only where the story needs it.
- **Doors are doorways.** A door a figure walks through is in a wall seen
  from the front, with an arch at least two cells wide and a fifth of a
  cell taller than the tallest figure; open, it shows the floor of the
  room beyond, lit. No slits in walls seen from above: a wall between rooms
  is seen from the front, or the rooms are two scenes.
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
- **Figures fit** (D98): a child at most 1.15 cells, a grown-up at most
  1.45, every door a tenth of a cell taller than who walks through it.

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
  its manifest: the field, the entrance hall, the dormitory and the
  library.

Everything the project makes ships under the GPL, like the code. A picture
from anywhere else comes in only under a licence that lets it ship with a
GPL game, with its origin, author and licence beside it.
