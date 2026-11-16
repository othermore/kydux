# If

Knowing the answer to an expression is great, but doing something only when the answer is yes is even better! Programmers call this a condition. We write it with the word `if`.

We write `if`, then our expression, and a colon at the end. Underneath, we move our lines in by leaving four spaces. The computer will only run these spaced lines if the answer is `True`.

---
## A condition

The first line is the condition. The line under it, moved in by four spaces, runs only when the condition is `True`. The last line is not moved in, so it runs always, and prints the word and your wizard's cell. Given two values separated by a comma, `print` writes both, with a space between them.

Dask looks up right now, so this program prints both lines. Change `"up"` to `"down"` and run it again, and only the cell is printed, because the condition is no longer `True`.

```python try
if dask.facing == "up":
    print("Looking up")
print("Position:", wizard.position)
```

---
## Moving lines in

The four spaces before a line are how Python knows that the line is inside the `if`.

The Tab key puts four spaces at once to move a line in, so that you do not have to type the four spaces yourself. It is a key at the keyboard's left, above the Caps Lock key. Sometimes it has one or two arrows drawn on it that point to the sides.

Once you are writing inside the `if`, every time you press Enter the spaces are added for you, to stay inside.

The Backspace key, which is above Enter and often has an arrow that points left, deletes the four spaces, to write outside the `if` again.

You can try it yourself. Put the cursor at the start of the last line and press Tab. You will see that the line moves inside the `if`, and if you run it, it will not be printed any more. If you delete the spaces and run it again, the line will be printed.

```python try
if dask.facing == "down":
    print("Dask looks down")
print("This line is outside the if")
```
