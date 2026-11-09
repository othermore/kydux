# The two coordinates

Do you remember how the naughty child's map works? We count the x from the left and the y from the top, and both start at 0. A step to the right adds one to the x, and a step down adds one to the y! We are going to need it, because in the next room the key lies in another place each night. We cannot just write a fixed number of steps in the program beforehand, so we will have to calculate them!

---
## The two numbers

A position holds two numbers, and they are its two attributes: `key.position.x` is the first and `key.position.y` the second. Ours are `wizard.position.x` and `wizard.position.y`. The steps from one cell to another are just the difference of those numbers! The steps to the right are the key's `x` less ours, and the steps down are the key's `y` less ours.

For example, if we are at (5, 7) and the key is at (9, 8): 9 - 5 = 4 steps to the right, and 8 - 7 = 1 step down. Those two numbers can be kept in two variables, like `right` and `down`, and given to the moves. In this room the key always lies to our right and never higher than we are, so the two subtractions are never below zero. And do not worry, a move of zero steps walks nothing at all!

---
## Try it

The program keeps your wizard's position in a variable, `position`, and then prints its two numbers, its attribute `x` first and its attribute `y` second, each on its own line. This way you can see the two numbers of the cell where you stand!

```python try
position = wizard.position
print(position.x)
print(position.y)
```
