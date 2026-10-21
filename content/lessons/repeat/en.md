# Repeat

Some stairs are long.
Up, right, up, right, eight times over.
That is sixteen lines, and it is easy to lose count.

A program can do the same lines again and again.
That is a **loop**.

---

## Writing a for

```python
for step in range(4):
    wizard.move_up()
    wizard.move_right()
```

`for step in range(4):` does the lines under it four times.
The lines are moved in by four spaces, as under an `if`.

`step` counts the times, from `0` up to `3`.
You can use it, or leave it alone.

---

## Try it

Climb the long stairs with a loop.
Change the number until the wizard reaches the top.

```python try
for step in range(3):
    wizard.move_up()
    wizard.move_right()
```
