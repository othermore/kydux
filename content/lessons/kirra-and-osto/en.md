# Light and stairs

The night passages have two troubles.

Some rooms are dark.
In the dark, the wizard sees only the tiles right around it.
A key a few tiles away might as well not be there.

And some stairs come and go.
They swing into place for a while, then swing away.

Two spells help with both.

---

## The spell kirra

`kirra` lights the room the wizard is in, for the rest of the way.

```python
wizard.cast("kirra")
```

After it, `find_nearest` finds things anywhere in the room, as in daylight.
Before it, it finds only what is right around the wizard.

---

## Stairs and osto

A stair is in place for a few ticks, then away for as many.
A step onto a stair that is away does not land.

`stair.in_place` asks whether a step taken now would land on it.
So a `while` can wait for it:

```python
while not stair.in_place:
    wizard.wait()
```

`osto`, cast beside a stair, holds it in place for six ticks, from the next time it comes.

---

## Try it

A stair crosses the next gap.
Walk up to it, and ask whether it is in place.

```python try
wizard.move_right()
print(stair.in_place)
```
