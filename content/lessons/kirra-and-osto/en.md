# Light and stairs

The castle hides two tricky things at night.
Some rooms are very dark.
You cannot see what is inside them.
And some stairs move!
They swing into place for a little while.
Then they swing away.
We need two new spells for this.

---

Cast `kirra` with your wand to fix the dark.
`kirra` lights up the room so you can see everything.
You must wait for a moving stair to arrive.
You can check the attribute `stair.in_place`.
It asks if a step onto the stair would land safely.

---

Cast `osto` with your wand next to the stair when it arrives.
`osto` holds the moving stair in place for a while.
Then you can cross without a bump!

---

## Try it

Walk up to the gap.
See if the stair is in place right now.

```python try
wizard.move_up(2)
print(stair.in_place)
```
