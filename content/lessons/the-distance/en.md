# How far

Sometimes a program needs a number it cannot know when it is written.

Think of a key that is never twice in the same place. It will be a different number of steps away every time you play!

---
## Asking for the distance

A thing can say how many steps lie between it and your wizard, along the rows and the columns. You just ask for `key.distance_to(wizard)`.

---
## Using a variable

If you keep that number under a name, like `steps = key.distance_to(wizard)`, you can use it as a move's argument: `wizard.move_left(steps)`. You can even use it again to walk back the same way!

This is exactly what a variable is for: holding a value you do not know when you write the program, or that you need to use more than once.

---
## Many ways to play

In this game, a level can be played in several ways, one after the other, with the key in a different place in each one. One program must win them all!

Let us see how far the key is this time.

```python try
key = wizard.find_nearest("key")
steps = key.distance_to(wizard)
print(steps)
```
