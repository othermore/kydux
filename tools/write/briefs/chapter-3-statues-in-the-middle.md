---
outputs:
  - content/levels/by-the-statues/text.en.json
  - content/levels/by-the-statues/text.es.json
context:
  - docs/dev/story.md
  - content/lessons/if/es.md
  - content/levels/the-tunnel-exit/text.es.json
  - content/levels/by-the-statues/text.es.json
  - content/levels/by-the-statues/text.en.json
---
Correct one text of chapter 3, in English and Spanish. Every other text of the level stays
word for word as its present file has it: write it back unchanged, every key of it.

## *Junto a las estatuas* (`by-the-statues`)

The gallery where the tunnel comes out is three rows of flagstones high. Its three statues
stand out in the middle of it, on its middle row, away from the walls. Dask stands still
on that middle row, between the first two statues, looking up or down (the level's two
ways). The wizard starts on the gallery's top row, left of the first statue, a row above
Dask. If Dask looks up, the wizard goes down two cells, to the bottom row behind the low
wall, and passes below him; if he looks down, it walks straight to the right along the top
row, behind him and behind the statues. Either way it then walks four cells to the right
and down to the mark, at the top of the corridor that goes down between the second and the
third statue. The solution:

```python
if dask.facing == "up":
    wizard.move_down(2)
wizard.move_right(4)
wizard.move_down(2)
```

Change only the `intro`: Dask stands still in the middle of the gallery, between the first
two statues; we are on the row above him. If he looks up, we must go down two cells and
pass below him, behind the low wall; if he looks down, we can cross straight along the top
row, behind him and the statues. Then we go down to the mark, at the top of the corridor
between the second and the third statue. Keep its tone and its length. Every other text as
it is: the `goals`, the `starting_code`, the `hints`, the `outro`, the `learned` and the
`ways`.
