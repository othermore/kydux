# Your first spell

A spell is a word of magic. By itself, it is only a string. You must cast it with a wand. Then it does something.

---

What a spell does depends on where you stand. It depends on what is near you. It may do nothing at all. Later, some spells will need to be told what to act on.

---

`cast` is an action the wand gives your wizard. Without the wand, your wizard does not know it.

---

`zelim` is a spell. It breaks the seal of a door. You must stand right beside the door:

```python
wizard.cast("zelim")
```

A sealed door shows a glowing rune.

---

## Try it

```python try
wizard.move_right()
wizard.pick_up()
wizard.cast("zelim")
```
