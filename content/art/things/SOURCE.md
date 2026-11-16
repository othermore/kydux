# The things drawn from a sprite of their kind

Kydux's own art, made for the game and under the GNU GPL, version 3 or later,
like the rest of it. `things.json` says each picture's size in cells and where
its foot stands in its cell (D182).

- `ring.webp`: one hoop on its post, cut by `tools/art/sprites.py sprite --lawn`
  from Gemini's edit without the grid (`tools/art/prompts/ring-field-2-nogrid.md`)
  of its painting of a small ring field (`tools/art/prompts/scene-ring-field-2.md`),
  both by Gemini 3 Pro Image (`gemini-3-pro-image`).
- `broom-hung.webp`: the same broom hanging straight down by a loop of cord from a
  peg, the peg painted with it, on flat magenta, by Gemini 3 Pro Image from
  `tools/art/prompts/sprite-broom-hung.md` (the lying broom and the shed's rack given
  as its pictures), cut by `tools/art/sprites.py sprite`. `things.json` hangs it by its
  peg's middle (`origin`) on the point of the scene's peg in its cell (`foot`), D195.
- `broom.webp`: a broom lying on the floor, painted alone on flat magenta by
  Gemini 3 Pro Image from `tools/art/prompts/sprite-broom.md`, keyed out, its
  magenta rim and the lawn strip under it taken out, by
  `tools/art/sprites.py sprite --lawn`.
