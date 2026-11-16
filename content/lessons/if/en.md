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

The four spaces before a line are how Python knows that the line is inside the `if`. Nobody has to count them: in this editor, pressing Enter at the end of a line that ends with a colon starts the next line already moved in, and the lines after it stay in.

The Tab key puts four spaces at once to move a line in, and is at the keyboard's left, above the Caps Lock key, often drawn with two arrows. The Backspace key, the one with the long arrow that points left, pressed in the spaces before a line, takes the four away at once: one press brings the line out. Four presses of the space bar are the same for Python; Tab is only quicker.

Run the code below, and one line is printed, the one outside. Put the cursor at the start of the last line, press Tab, and run it again: nothing is printed, because the line is now inside the `if` and Dask does not look down. Press Backspace there, and the line is out again and is printed again.

```python try
if dask.facing == "down":
    print("Dask looks down")
print("This line is outside the if")
```
