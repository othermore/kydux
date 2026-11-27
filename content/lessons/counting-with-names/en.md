# Counting with variables

Once a number is kept in a variable, that variable can be counted with, exactly like a number!

So we can add two variables and keep the sum in a third one: `total = a + b`. If `a` holds 4 and `b` holds 3, `total` holds 7, and `print(total)` shows it.

Try changing `a` and `b`, and try `a - b` in place of `a + b` too!

```python try change
a = 4
b = 3
total = a + b
print(total)
```

---
## The steps that are left

Think of a door that is five steps away. If `steps` holds the steps your wizard has already walked towards the door, `5 - steps` is the number of steps still left to the door. It is five less those steps. And `steps + 2` is another number, two more!

---
## Keeping it or using it

This new number can be kept in a variable of its own, like `rest = 5 - steps`, and used as a move's argument: `wizard.move_left(rest)`.

You can even write it straight into the brackets: `wizard.move_left(5 - steps)`. Both ways will walk the exact same distance!

---
## Try it

Let us see how many steps are left to the door once the key is reached.

```python try
eldras_key = wizard.find_nearest("key")
steps = eldras_key.distance_to(wizard)
print(5 - steps)
```
