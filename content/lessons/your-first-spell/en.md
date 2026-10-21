# Your first spell

A spell is a word of magic.
Said by anyone, it is only a word.
Cast with a wand, it does something.

Each spell does one thing, there where the wizard stands.

---

## The spell zelim

Some doors in Arvelia are sealed.
A rune glows on them, and no hand can open them.

The spell `zelim` breaks a seal.
It works on a sealed door right beside the wizard.

---

## Casting

```python
wizard.cast("zelim")
```

`cast` is the wand's action.
The wizard can only do it while carrying the wand.
Without the wand, the wizard does not know this action at all.

The spell's name is a string, in quotes, like the words the wizard says.

---

## Try it

In the next room, the wand lies on the floor, and a sealed door waits.
Pick up the wand first.
Then walk up beside the door, and cast.

```python try
wizard.move_right()
wizard.pick_up()
wizard.cast("zelim")
```
