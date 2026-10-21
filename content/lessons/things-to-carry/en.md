# Things to carry

Arvelia is full of things: keys, books, wands.
A thing lies on a tile of the floor.

The wizard can carry things.
To carry one, the wizard stands on its tile, and picks it up.

---

## Picking up

```python
wizard.pick_up()
```

This action picks up the thing on the wizard's tile.
Its brackets are empty.
The wizard picks up what is under its feet, so there is nothing more to tell it.

If there is nothing on the tile, there is nothing to pick up.
The wizard will tell you so.

---

## Try it

Your wand lies a few tiles away.
Walk onto its tile first, and then pick it up.

```python try
wizard.move_right(2)
wizard.pick_up()
```
