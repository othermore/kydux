# A spell that reaches

Some books are hard to reach. They rest on high shelves. They lie across wide gaps. Your hands cannot reach them. But a spell can.

---

The spell `fendra` draws things to you. It reaches up to three tiles straight ahead. It looks in all four ways. It passes over shelves. Walls and closed doors stop it.

---

It brings the nearest thing it can reach. The thing lands exactly on your tile. Then you must pick it up. A spell moves things, and hands carry them.

---

Like your first spell, it needs your wand. You use the `cast` method with a string.

```python
wizard.cast("fendra")
wizard.pick_up()
```

If nothing is near enough, your wizard will tell you.

---

## Try it

A book lies on a high shelf. Walk left until you stand under it. Then draw it to you, and pick it up.

```python try
wizard.move_left(5)
wizard.cast("fendra")
wizard.pick_up()
```
