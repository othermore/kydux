# Waiting

Until now we have made programs in which our character always did something, but sometimes we need to make them wait. For example, on the next screen our character has to wait for Dask to go by before crossing. To wait, we use the method `wizard.wait()`.

A tick is a moment of the game in which everything else moves. `wizard.wait()` waits one, and `wizard.wait(2)` waits two.

---
## Try it

Wait two ticks and then walk nine cells to the right.

```python try
wizard.wait(2)
wizard.move_right(9)
```
