---
outputs:
  - content/levels/the-tunnel-exit/text.en.json
  - content/levels/the-tunnel-exit/text.es.json
  - content/levels/by-the-statues/text.en.json
  - content/levels/by-the-statues/text.es.json
  - content/lessons/waiting/en.md
  - content/lessons/waiting/es.md
  - content/levels/the-moving-slab/text.en.json
  - content/levels/the-moving-slab/text.es.json
context:
  - docs/dev/story.md
  - content/lessons/waiting/es.md
  - content/lessons/waiting/en.md
  - content/lessons/if/es.md
  - content/levels/the-tunnel-exit/text.es.json
  - content/levels/the-tunnel-exit/text.en.json
  - content/levels/by-the-statues/text.es.json
  - content/levels/by-the-statues/text.en.json
  - content/levels/the-moving-slab/text.es.json
  - content/levels/the-moving-slab/text.en.json
---
Correct the counts of a few texts of chapter 3, in English and Spanish. The place they are
told in, the crossing, has moved its walked cells a row lower: the gallery where the tunnel
comes out is three rows of floor, and the row at the foot of its top wall, where the three
statues stand against that wall, is no longer walked. Every text that is not named here as
changing stays word for word as its present file has it: write it back unchanged, every
key of it. A level's `starting_code` is code and comments, and a hint names no solution
line. Where a text is given below between FIXED and END, it goes into the file word for
word.

## *La salida del túnel* (`the-tunnel-exit`)

The wizard, the friend and the mate come out of the dark tunnel into the gallery. The
wizard starts two cells past the tunnel's arch, on the gallery's top row of floor, in front
of the top wall; the friend and the mate stand just below. Dask comes up the corridor that
crosses the gallery, looking up, a cell a tick. Waiting two ticks lets him go by; then the
wizard walks seven cells to the right, to the mark on the floor just left of the first
statue. The solution is `wizard.wait(2)` then `wizard.move_right(7)`.

Change only:
- the third `hints`: it says to wait two ticks and then to walk seven cells to the right,
  to the mark (it names no line of code: "Espera dos ticks y luego camina siete casillas a
  la derecha, hasta la marca" in its own words).
- Every other text as it is: the `intro`, which already says to wait two ticks and walk to
  the mark by the first statue, the `goals`, the `starting_code`, the other hints, the
  `outro` and the `learned`.

## *Junto a las estatuas* (`by-the-statues`)

Dask stands still in the middle of the gallery, on its middle row, just below the first
two statues, between them; he looks up or down (the level's two ways). The wizard starts
on the gallery's top row of floor, by the first statue's base, a row above Dask and two
cells to his left. If Dask looks up, the wizard goes down two cells, to the gallery's
bottom row, behind the low wall, and passes below him; if he looks down, it walks straight
to the right on the top row, above him, in front of the statues' bases. Either way it then
walks four cells to the right and down to the mark, at the top of the corridor that goes
down between the second and the third statue. The solution:

```python
if dask.facing == "up":
    wizard.move_down(2)
wizard.move_right(4)
wizard.move_down(2)
```

Change:
- `intro`: Dask stands still in the middle of the gallery, below the first two statues;
  we are on the row above him, by the statues' bases. If he looks up, we must go down two
  cells and pass below him, behind the low wall; if he looks down, we can cross straight,
  above him. Then we go down to the mark, at the top of the corridor between the second
  and the third statue. Keep its tone and its length.
- the third `hints`: after the `if`, with no spaces in front, walk four cells to the right
  and two down (no line of code named).
- Every other text as it is: the `goals`, the `starting_code`, the first two hints, the
  `outro`, the `learned` and the `ways`.

## *Esperar* (`waiting`)

The lesson stays as it is but for its last page, whose block the child runs on the next
level's scene, from its start: its sentence says to wait two ticks and then to walk seven
cells to the right, and its block is exactly this one, in both files:

FIXED
```python try
wizard.wait(2)
wizard.move_right(7)
```
END

## *La losa que va y viene* (`the-moving-slab`)

The level is played in four ways: the slab comes and goes every three, four, five or seven
ticks. Change only its `ways`, which name all four, the two new ones given here:

- Spanish: FIXED `"three": "Cada tres ticks", "four": "Cada cuatro ticks", "five": "Cada cinco ticks", "seven": "Cada siete ticks"` END
- English: `"three": "Every three ticks", "four": "Every four ticks", "five": "Every five ticks", "seven": "Every seven ticks"`

Every other text of the level as it is.
