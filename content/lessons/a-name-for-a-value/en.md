# A name for a value

A program often uses the same value many times.
Say the wizard must walk four tiles, three times over.

Writing `4` three times works.
But if the corridor changes, you must find every `4` and change it.
And it is easy to miss one.

So a program can give a value a **name**, and use the name instead.
A name for a value is a **variable**.

---

## Giving a name

```python
steps = 4
```

The `=` gives the name `steps` to the value `4`.
It does not ask whether they are equal: it puts the value under the name.

From then on, `steps` means `4`:

```python
wizard.move_right(steps)
```

To change the value, you change only the line that gives it.

---

## Try it

In the reading room, the wizard walks the same distance three times.
Write the number only once, as a variable.

```python try
steps = 2
wizard.move_right(steps)
```
