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
5. Run `tools/art/export_scene.py`. It writes the scene's files into
   `content/art/scenes/<scene>/` and the check pictures into
   `art/raw/game-check/`. Its last step, `check`, also sweeps the scene
   (`tools/art/sweep.py`): it stands the wizard on every cell walked on,
   writes `sweep-<scene>.png` with every cell where something covers it,
   lists the cells where the wizard is wholly hidden, and fails when a
   cut-out breaks one of the rules below. Run it after every export, and
   look at its sheet before anyone plays the scene.
6. Place the levels on the new map, each starting where the one before
   ended. A level's start, its mark, its things and its friend stand on
   free cells that no cut-out covers. `tests/project/test_art_content.py`
   checks both rules against the painting's cut-outs.

## The rules for the cut-outs

Each raised thing is cut out and drawn in order with the figures, by the
row its foot stands on.

- **Nothing reaches below its own row.** A shadow that falls lower goes
  back to the ground, or is painted apart. A door may reach a little into
  the cell below, its threshold (`reach` in `export_scene.py`); a figure
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
  leave its stone whole.

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

## The figures

Each character is a sheet of four rows, one for each way it faces (down,
left, right, up), with three walking frames in a row. The wizard's sheet
has four more rows below, in the same order: casting, with the wand
raised, pointed with its light, and lowered. The frames are drawn on the
same scale as the scenes. `content/art/figures/figures.json` says the
frame's size and where the feet are.

Every sheet is steadied before the game uses it: each frame is shifted
sideways so that its body lies over its row's standing frame, which keeps
a figure from swaying as it walks. Then each step frame becomes the
standing frame with only its legs taken from the step's drawing, so that
a figure walks moving its feet alone, never turning its head or its arms.
A figure that floats, the ghost, has its dress grow downward in its step
frames instead. Both are done by `tools/art/figures.py`.

A door that opens may have a half-open state, between its closed and its
open ones. It is an edit of the painting like the others, and the game
shows it for a moment as the door opens.

## Where things are kept

- `content/art/`: what the game draws. Each folder has a `SOURCE.md` that
  says how it was made and under which licence it ships.
- `tools/art/prompts/`: every prompt, with its service and model.
- `art/raw/`: the trials, the raw pictures and the check pictures. Git
  ignores this folder.

Everything the project makes ships under the GPL, like the code. A picture
from anywhere else comes in only under a licence that lets it ship with a
GPL game, with its origin, author and licence beside it.
