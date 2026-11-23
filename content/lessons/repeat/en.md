# Repeat

Doing the same instructions many times means having to write them over and over, and that is a lot of work! We can tell the computer to repeat them for us.

Programmers call this a loop. We write `for step in range(3):` and, moved in underneath with four spaces, the lines we want to run three times.

---
## The three doors

Look at the three doors down the corridor, one after another. They are exactly the same.

To get past them, you would have to write exactly the same lines to open a door and walk through it, three times in a row. A loop does that for us! The word `step` is just a variable the loop counts with, and the lines inside do not even have to use it.

---
## Try it

Let us make a loop to see how it counts.

Just like the numbers of a cell, the loop starts counting from 0. The instructions inside will run three times, and the computer will print 0, 1, and 2!

```python try
for step in range(3):
    print(step)
```
