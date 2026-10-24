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
   tree, a rock, a fence or a stone stands on is marked as not walked on.
   This gives the scene's `map.txt` and `scene.json`.
4. Ask Gemini for an edit of the painting without each thing that opens
   or is picked up, one thing an edit. The edits must line up with the
   painting pixel for pixel.
5. Run `tools/art/export_scene.py`. It writes the scene's files into
   `content/art/scenes/<scene>/` and the check pictures into
   `art/raw/game-check/`.
6. Place the levels on the new map, each starting where the one before
   ended. A level's start, its mark, its things and its friend stand on
   free cells that no cut-out covers. `tests/project/test_art_content.py`
   checks both rules against the painting's cut-outs.

## The rules for the cut-outs

Each raised thing is cut out and drawn in order with the figures, by the
row its foot stands on.

- **Nothing reaches below its own row.** A shadow that falls lower goes
  back to the ground, or is painted apart.
- **A thing covers only the cells above it.** So it hides a figure that
  stands behind it, and a figure that stands in front of it is drawn over
  it.
- **What opens or is picked up is cut against its edit without it.** A
  gate that opens must leave no ghost bars, and a wand picked up must
  leave its stone whole.

Look at every check picture before committing. Each shows a figure behind
and in front of a row's things.

## The figures

Each character is a sheet of four rows, one for each way it faces (down,
left, right, up), with three walking frames in a row. The frames are drawn
on the same scale as the scenes. `content/art/figures/figures.json` says
the frame's size and where the feet are.

## Where things are kept

- `content/art/`: what the game draws. Each folder has a `SOURCE.md` that
  says how it was made and under which licence it ships.
- `tools/art/prompts/`: every prompt, with its service and model.
- `art/raw/`: the trials, the raw pictures and the check pictures. Git
  ignores this folder.

Everything the project makes ships under the GPL, like the code. A picture
from anywhere else comes in only under a licence that lets it ship with a
GPL game, with its origin, author and licence beside it.
