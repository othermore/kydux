# Arguments of your own

Between the brackets of our `def` go variables, which are the function's arguments. When we call the function, we give them values in the same order, exactly as `move_right(3)` is given its 3!

Inside the function, those variables keep the values we gave them. Because of this, the exact same function serves for things that are alike but not the same, such as passing through two rings at different distances!

```python try
def greet(name):
    print("Hello", name)

greet("Teku")
greet("Nuri")
```
