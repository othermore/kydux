---
outputs:
  - content/lessons/the-two-coordinates/en.md
  - content/lessons/the-two-coordinates/es.md
  - content/lessons/while/en.md
  - content/lessons/while/es.md
  - content/levels/the-dark-tunnel/text.en.json
  - content/levels/the-dark-tunnel/text.es.json
  - content/levels/the-dark-room/text.en.json
  - content/levels/the-dark-room/text.es.json
  - content/levels/the-wrong-door/text.en.json
  - content/levels/the-wrong-door/text.es.json
  - content/levels/left-or-right/text.en.json
  - content/levels/left-or-right/text.es.json
  - content/levels/the-tunnel-exit/text.en.json
  - content/levels/the-tunnel-exit/text.es.json
  - content/levels/past-the-teacher/text.en.json
  - content/levels/past-the-teacher/text.es.json
  - content/levels/the-night-walk/text.en.json
  - content/levels/the-night-walk/text.es.json
context:
  - docs/dev/story.md
  - content/lessons/the-cells/es.md
  - content/lessons/where-i-am/es.md
  - content/lessons/counting-with-names/es.md
  - content/lessons/kirra-and-osto/es.md
  - content/lessons/while/es.md
  - content/lessons/while/en.md
  - content/levels/the-dark-tunnel/text.es.json
  - content/levels/the-dark-tunnel/text.en.json
  - content/levels/the-dark-room/text.es.json
  - content/levels/the-dark-room/text.en.json
  - content/levels/the-wrong-door/text.es.json
  - content/levels/the-wrong-door/text.en.json
  - content/levels/left-or-right/text.es.json
  - content/levels/left-or-right/text.en.json
  - content/levels/the-tunnel-exit/text.es.json
  - content/levels/the-tunnel-exit/text.en.json
  - content/levels/past-the-teacher/text.es.json
  - content/levels/past-the-teacher/text.en.json
  - content/levels/the-night-walk/text.es.json
  - content/levels/the-night-walk/text.en.json
---
Write one new lesson of chapter 3 and correct a few of its texts, in English and Spanish.
The owner read the chapter and wrote some words by hand: those are given below between
FIXED and END, in Spanish, and go into the Spanish file word for word, only with the
wizard's braces as said; the English says the same in natural English. Every text that
is not named here as changing stays word for word as its present file has it: write it
back unchanged, every key of it. A level's `starting_code` is code and comments, and a
hint names no solution line.

## The new lesson, `the-two-coordinates`: Las dos coordenadas

It comes after the level with the moving slab and before *La sala oscura*. The child knows
the system of coordinates from *Las casillas*, `wizard.position` and `key.position` from
*Dónde estoy*, a variable and a subtraction from *Contar con variables*, and the spell
*kirra* from *Luz y losas*. Three pages, the title `# Las dos coordenadas`.

1. Recall in two or three sentences how the coordinates work (x from the left, y from the
   top, both from 0, a step to the right adds one to x and a step down adds one to y). The
   reason for the lesson: in the next room the key lies in another place each night, so
   no number of steps can be written in the program beforehand.
2. A position holds two numbers, and they are its two attributes: `key.position.x` is the
   first and `key.position.y` the second. `wizard.position.x` and `wizard.position.y` are
   ours. The steps from one cell to another are the difference of those numbers: the steps
   to the right are the key's `x` less ours, and the steps down the key's `y` less ours.
   Show it with an example with numbers: we at (5, 7) and the key at (9, 8): 9 - 5 = 4 to
   the right and 8 - 7 = 1 down. Those two numbers are kept in two variables, `right` and
   `down`, and given to the moves. Say that in this room the key always lies to our right
   and never higher than we are, so the two subtractions are never below zero; a move of
   zero steps walks nothing.
3. `## Pruébalo`: one sentence, then exactly this block, which the child runs: it lights
   the room, finds the key and prints the two numbers.

```python try
wizard.cast("kirra")
key = wizard.find_nearest("key")
right = key.position.x - wizard.position.x
down = key.position.y - wizard.position.y
print(right)
print(down)
```

## `while`: its last block

The lesson stays as it is but for its last page: its block is exactly this one in the
Spanish file, FIXED, and in the English file the same with the two strings in English
(`"Dask is looking", dask.facing, "so I wait"` and `"We left the loop because Dask is
looking", dask.facing`). The sentence before it says that the program writes a line each
tick it stays in the loop, and one more when it leaves it.

FIXED
```python try
while dask.facing == "right":
    print("Dask mira hacia", dask.facing, "así que espero")
    wizard.wait()
print("Hemos salido del bucle porque Dask mira hacia", dask.facing)
```
END

## *El túnel oscuro* (`the-dark-tunnel`)

The level now starts on a cell the child has not seen: (14, 2), inside the tunnel, not where
the level before ended. The exit is (19, 1), and no text names its numbers: the child finds
them on the map. Its solution prints the position, walks up 1 and right 5. Change:

- `intro`, FIXED, with the wizard's braces for *la maga*:
FIXED
¡Qué oscuro! En este túnel no se ve nada... Y por algún motivo, ni siquiera el mapa nos muestra lo que hay dentro del túnel. Pero sí que vemos la salida del túnel (busca la posición en el mapa). ¡Podemos mirar dónde está {el mago|la maga}, contar los pasos y caminar a ciegas!
END
- `goals`, the first, FIXED: `Sal por la salida del túnel: búscala en el mapa`; the second as it is.
- `starting_code`: its first comment says to open the map with its spell and look for the exit; the next ones to print where you are, to go up to the exit's row and to walk to the right to the exit, none saying a number.
- `hints`: the first says to cast *orvim* to see the exit on the map; the second to look at `wizard.position`; the third, how to count from the two cells, with no numbers of this level's cells.

## *La sala oscura* (`the-dark-room`)

Played in three ways: the key at (9, 7), at (8, 8) and at (10, 8), the wizard always from
(5, 7), so the child's program computes the steps with the two numbers. The door `store_door`
is at (10, 10), opened from the cell above it. Change:

- `intro`: the room is dark; the key is in another place each night, so light the room with *kirra*, find the key, count the steps with the two numbers and walk there, pick it up, and then count the steps the same way to the cell above the door, `store_door`, and open it.
- `goals`: the fourth becomes `Cuenta los pasos con `x`.` (`Count the steps with `x`.`).
- `starting_code`: comments only, as now, in order: light the room; find the key; keep the steps to the right and down in two variables, with `position.x` and `position.y`; walk; pick it up; count again to the cell above the door; walk; open it.
- `hints`: no number of steps; the first about *kirra*; the second about the two subtractions; the third about the door's cell above it, its `y` less one.
- `learned`: that a position holds two numbers, `x` and `y`, and that their differences say the steps between two cells.
- A new key `ways`: `same_row`, `lower`, `farther`, each a few words: la llave en nuestra fila; la llave una fila más abajo, cerca; la llave una fila más abajo, más lejos.

## *La puerta equivocada* (`the-wrong-door`)

`intro`: a child does not know what branches are. Its last sentence but one, FIXED in sense: *he puesto las líneas del `if` donde iban las del `else`*. The rest as it is. `learned` says *qué líneas se ejecutan* and no *rama*. `hints` as they are. `starting_code` as it is.

## The counts that changed

- `left-or-right`, `hints`: the walk down before the turn is now 2, not 3 (baja 2 and camina 3 ... in both).
- `the-tunnel-exit`, `hints`: the walk is now eight cells, not nine.
- `past-the-teacher`, `hints`: the walk down before the crossing is now 4 cells, not 5.
- `the-night-walk`, `hints`: the key is now 1 step away, not 2.
