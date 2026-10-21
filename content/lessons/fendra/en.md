# A spell that reaches

Some things lie where the wizard cannot walk.
On a high shelf.
Across a gap.

Hands cannot reach them.
A spell can.

---

## The spell fendra

`fendra` draws a thing to the wizard.

It reaches three tiles, straight ahead in each of the four ways.
It passes over shelves.
Walls and closed doors stop it.

It brings the nearest thing it can reach, onto the wizard's tile.
Then the wizard picks it up, as always: a spell moves things, and hands carry them.

---

## Casting it

```python
wizard.cast("fendra")
wizard.pick_up()
```

Like `zelim`, it needs the wand.
If there is nothing near enough, the wizard will tell you so.

---

## Try it

A book lies on a high shelf.
Walk until the wizard stands in line with it, near enough, and cast.

```python try
wizard.cast("fendra")
```
