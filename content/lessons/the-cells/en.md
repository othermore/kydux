# The cells

I am whispering so we are not heard in the dark. Look at this map I gave you, the naughty child's map. It shows the whole castle floor by floor as a plan of cells, and it opens exactly at the corridor we are standing in.

A cell is named by two numbers: the x counts from the left, and the y counts from the top, both starting from 0. So the top-left cell is `(0, 0)`, and the one just to its right is `(1, 0)`.

---
## Counting steps

A step to the right adds one to the x, and a step down adds one to the y. Left and up subtract one!

So, to go from cell `(5, 12)` to cell `(9, 9)`, your wizard has to walk four steps right and three steps up. You just have to count what changes in each number.

---
## Try it

The map only works with the word written in its corner, *orvim*.

If you cast it with the wand, a window will open with the plan of this corridor, its cells numbered and the three of us named. The game will wait for you to close it before going on.

```python try
wizard.cast("orvim")
```
