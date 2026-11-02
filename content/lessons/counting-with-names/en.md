# Counting with names

Once a number is kept under a name, that name can be counted with, exactly like a number!

Think of a door that is five steps away, with a key lying somewhere on the way. If `steps` holds the steps your wizard walked to reach the key, `5 - steps` is a number too. It is five less those steps. And `steps + 2` is another number, two more!

---
## Keeping it or using it

This new number can be kept under a name of its own, like `rest = 5 - steps`, and used as a move's argument: `wizard.move_left(rest)`.

You can even write it straight into the brackets: `wizard.move_left(5 - steps)`. Both ways will walk the exact same distance!

---
## Try it

Let us see how many steps are left to the door once the key is reached.

```python try
key = wizard.find_nearest("key")
steps = key.distance_to(wizard)
print(5 - steps)
```
