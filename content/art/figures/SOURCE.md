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
- Dask's standing frames are Gemini's drawing of him standing still in the four
  views (`figure-dask-standing.md`), cut by `tools/art/figures.py --standing`, and
  his walking frames are made from them.
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
