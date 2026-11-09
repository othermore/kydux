# Waiting

Until now we have made programs where our character always did something, but sometimes we need to make them wait. For example, on the next screen, our character has to wait for Dask to pass before crossing. To wait we use the method `wizard.wait()`.

A tick is a moment of the game in which everything else moves. `wizard.wait()` waits one tick, and `wizard.wait(2)` waits two ticks!

---
## Try it

Wait two ticks and then walk nine cells to the right. Under it you will read the cell your wizard ended on. And you can change it and try again!

```python try
wizard.wait(2)
wizard.move_right(9)
```
