# The figures

Kydux's own art, made for the game and under the GNU GPL, version 3 or
later, like the rest of it.

- Drawn by Gemini 3 Pro Image (`gemini-3-pro-image`) as walking sheets, from
  `tools/art/prompts/demo-wizard.md`, `demo-nuri.md`, `demo-wenna.md`,
  `demo-eldra.md`, `demo-dask.md`, `demo-ilda.md` and `demo-baro.md`, each
  with the style-B wizard as its reference (`chibi-b-gemini.md`); cut by
  `tools/art/sprites.py` and put together by `tools/art/export_scene.py`,
  Ilda's sized and turned by Wenna's, a figure of her build, and Baro's by
  Dask's.
- Dask's and Wenna's standing frames are Gemini's drawings of them standing still in
  the four views (`figure-dask-standing.md`, `figure-wenna-standing.md`), cut by
  `tools/art/figures.py --standing`, and their walking frames are made from them.
- The wizard's girl and Nuri's are Gemini's edits of those sheets
  (`figure-wizard-girl.md`, `figure-nuri-girl.md`), and the wizard's
  casting frames are Gemini's edits of the wizard's two sheets
  (`figure-cast-boy.md`, `figure-cast-girl.md`), each put back on its grid
  by `tools/art/figures.py`. The base sheets are in `art/figures/`.
- `wizard-<look>.webp` for each look of the creator, its walking rows and
  its casting rows, and `nuri-a`, `nuri-b`, `teku-a` and `teku-b`, each
  friend in two sets of colours (D90), are those bases recoloured by
  `tools/art/figures.py`: the robe, the hat, its band, the hair and the
  skin in the look's colours (`app/src/engine/looks.ts`), their shading
  kept.
- Every wizard's sheet has four flying rows last (D188), riding the broom the way it
  faces: Gemini's edit of the walking base of its gender (`figure-fly-boy.md`,
  `figure-fly-girl.md`), each row's figure level, a little up and a little down, put
  on its grid by `tools/art/figures.py --fly`, the magenta round it cleared two pixels
  in, and recoloured with the rest.
- `zarek.webp` and `rinlo.webp`, two pupils a year older, are Gemini's drawings of them
  standing still in the four views (`figure-zarek-standing.md`,
  `figure-rinlo-standing.md`), drawn with the pupils' and the teachers' figures as
  their reference, cut by `tools/art/figures.py --drawn` at a height between the
  children's and the grown-ups'; Zarek's flying rows are Gemini's drawings of him
  riding a broom, both hands on its handle: his down view (`figure-zarek-fly-down.md`),
  and from it his right, left and back views (`figure-zarek-fly.md`), each put in its
  row by `--drawn-fly-view`.
- Rinlo's sheet has four sitting rows after his walking ones (D273): Gemini's drawing
  of him sitting on the floor in the four views, hunched, his arms round his knees
  (`figure-rinlo-sitting.md`, his standing drawing and his portrait given), each view
  its row's three frames, put on its grid by `tools/art/figures.py --drawn-sit`.
- `orla.webp`, the head of the school, a grown-up, is Gemini's drawing of her standing
  still in the four views (`figure-orla-standing.md`, the cast and her portrait given),
  cut by `tools/art/figures.py --drawn` at a grown-up's height.
- The familiars (D273), `familiar-<kind>-<colour>.webp`, fourteen walking sheets: the
  first colour of each kind drawn by Gemini as a sheet of four rows of three on flat
  magenta, from its picture of the six animals in their colours (`familiars-test.md`,
  `familiars-colours.md`): the red fox's (`familiar-fox-walk-2.md`), the black crow's,
  the black bat's, the brown hare's, the brown mouse's and the green frog's
  (`familiar-<kind>-walk.md`); each other colour Gemini's edit of its kind's first
  drawing (`familiar-<kind>-<colour>.md`). Each is cut by `tools/art/figures.py
  --familiar`: every figure about half a child's height, its bottom on the frame's
  foot line, the magenta's shades round it cleared, the row facing right the row facing
  left mirrored, and a colour's sheet checked against its kind's first one, frame by
  frame, by how much of their outlines they share.
