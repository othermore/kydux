# Where I am

We are inside the enchanted tunnel now. In here, no one is seen, neither on the scene nor on the plan! But a program can ask where it is anyway.

Your wizard knows exactly which cell they stand in. To ask, we use `wizard.position`. It is an attribute that holds the two numbers together, like `(15, 3)`. A thing knows its cell too, like `key.position`!

---
## Why we ask

A program cannot look at the floor, and in a dark or enchanted place there is nothing to see anyway.

The position tells the program exactly where your wizard is. From there, you just have to count to where you want to go!

---
## Try it

Let us ask exactly which cell we are in right now, here inside the tunnel.

```python try
print(wizard.position)
```
