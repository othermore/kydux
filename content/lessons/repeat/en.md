# Repeat

Walking down these long passages takes a lot of steps. Doing the same instructions many times means writing them many times, and that is a lot of work!

We can ask the computer to do the instructions again and again for us. Programmers call this a loop.

---
## Doing it again

We write a loop with `for`. We write `for step in range(8):` and, moved in under it, the lines to repeat, eight times.

The word `step` is just a variable the loop counts with. The computer will run those moved-in lines over and over until it finishes counting.

---
## Try it

Let us make a loop to walk without having to write so many lines. The instructions inside will happen three times in a row!

```python try
for step in range(3):
    wizard.move_up()
    wizard.move_right()
```
