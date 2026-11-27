# How far

Sometimes a program needs a number it cannot know when it is written.

Think of a key that is never twice in the same place. It will be a different number of steps away every time you play!

---
## Checking the distance

Once a program has found the key and kept it in a variable, say `eldras_key`, the key can tell how many steps lie between it and your wizard, along the rows and the columns. You just use `eldras_key.distance_to(wizard)`.

---
## Using a variable

If you keep that number in a variable, like `steps = eldras_key.distance_to(wizard)`, you can use it as a move's argument: `wizard.move_left(steps)`. You can even use it again to walk back the same way!

This is exactly what a variable is for: holding a value you do not know when you write the program, or that you need to use more than once.

---
## Finding the answer that always works

In this game, some things change each time a level is run. For example, the key may appear in a different place. One program must be ready to work in every case!

Let us see how far the key is this time.

```python try
eldras_key = wizard.find_nearest("key")
steps = eldras_key.distance_to(wizard)
print(steps)
```
