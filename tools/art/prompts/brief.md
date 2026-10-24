# The art trials' brief (D72)

One brief, turned into each candidate's prompts, so that the candidates are
judged on the same pieces:

1. **The wizard's walking sheet**: four directions (down, left, right, up),
   each a standing frame and two walking frames, about 1.3 tiles tall, a
   pointed hat, a robe; on the key colour.
2. **A stone wall's pieces**: the sixteen pieces of a thin wall, one for
   each way its four neighbours are wall too (none; an end towards each
   side; straight across and up and down; the four corners; the four T
   junctions; the cross), in the oblique view: the wall's top seen from
   above, its front face below the top where the wall does not go on south.
3. **Grass and path**: a grass tile that repeats without a seam, and the
   path's sixteen pieces over grass in the same way as the wall's.
4. **A wooden door** in a wall running across, closed and open.

The view is the game's: 2D top-down oblique, a three-quarter view, the
floor from above and walls and things with their front face, every piece
on the tile grid; never isometric. The native tile is 24 pixels (drawn at
×2 on the game's 48-pixel grid) or 48; the background is the key colour
#FF00FF where a piece is not a full tile.

The pieces are named as `tools/art/trials/draw.py` names them, so that
`tools/art/trials/contact.py` draws each candidate's test scene the same way:
`grass`, `wall-M`, `path-M` (M the neighbours: north 1, east 2, south 4,
west 8), `door-closed`, `door-open`, `wizard-<way>-<frame>`.
