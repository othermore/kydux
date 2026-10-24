# The figures

Kydux's own art, made for the game and under the GNU GPL, version 3 or
later, like the rest of it.

- Drawn by Gemini 3 Pro Image (`gemini-3-pro-image`) as walking sheets, from
  `tools/art/prompts/demo-wizard.md`, `demo-nuri.md`, `demo-wenna.md`,
  `demo-eldra.md` and `demo-dask.md`, each with the style-B wizard as its
  reference (`chibi-b-gemini.md`); cut by `tools/art/sprites.py` and put
  together by `tools/art/export_scene.py`.
- The wizard's girl and Nuri's are Gemini's edits of those sheets
  (`figure-wizard-girl.md`, `figure-nuri-girl.md`), put back on their grid
  by `tools/art/figures.py`. The four base sheets are in `art/figures/`.
- `wizard-<look>.webp` for each look of the creator, and Teku's and Nuri's,
  are those bases recoloured by `tools/art/figures.py`: the robe, the hat,
  its band, the hair and the skin in the look's colours
  (`app/src/engine/looks.ts`), their shading kept.
