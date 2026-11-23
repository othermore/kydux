# The portraits

Kydux's own art, made for the game and under the GNU GPL, version 3 or later, like the
rest of it (D194).

- `<character>.webp`: Ilda, Orla, Dask, Wenna, Nuri, Teku, Zarek, Baro, Eldra, Rinlo and
  Bimo, each a bust painted by Gemini 3 Pro Image (`gemini-3-pro-image`) on flat magenta
  from `tools/art/prompts/portrait-<character>.md`: from the character's front frame in
  its figure sheet (`art/raw/portraits/ref-<character>.png`, cut from
  `content/art/figures/`), or, for Orla and Bimo, who have no sheet, from the cast's
  figures for the style. Cut by `tools/art/sprites.py portrait` into a square of 512
  pixels.
- `wizard-<look>.webp`: each look of the wizard, recoloured by
  `tools/art/figures.py --portraits` from its gender's base bust,
  `art/figures/portrait-wizard-<gender>.webp`, which Gemini 3 Pro Image painted from
  the base sheet's figure (`tools/art/prompts/portrait-wizard-<gender>.md`).
- `nuri-b.webp` and `teku-b.webp`: Nuri and Teku in their second set of colours (D90,
  D283), recoloured by `tools/art/figures.py --portraits` from `nuri.webp` and
  `teku.webp`, which wear the first.
