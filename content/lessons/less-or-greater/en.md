# Smaller or greater

We can use `<` and `>` to compare two numbers. They answer `True` or `False`, just as `==` does when it looks whether two numbers are equal. `3 < 5` is read "3 is smaller than 5", and `5 > 3`, "5 is greater than 3". The sign opens towards the greater number: in `3 < 5`, its open side is next to the 5.

When the two numbers are equal, neither is the smaller: `4 < 4` is `False`.

```python try
print(3 < 5)
print(5 < 3)
print(5 > 3)
print(4 < 4)
```

---
## The coordinates' numbers

Do you remember how coordinates work? `x` is counted from the left and `y` from above. So `x` grows with each step to the right and shrinks with each step to the left, and `y` grows with each step down and shrinks with each step up.

A broom whose `x` is smaller than your wizard's is to its left; greater, to its right. A broom whose `y` is smaller is higher up; greater, lower down. It might surprise you, but `y` grows downwards!

Here `True` means the broom is to the left. Try putting 12 in `broom_x` and run it again!

```python try change
my_x = 9
broom_x = 6
print(broom_x < my_x)
```

---
## Which subtraction

With the `move_` methods, like `move_left()`, you can move 0 or more steps. If you give it a negative number, like in `wizard.move_left(-3)`, the game does not accept it and tells you that `move_left` is not used like that.

So to move to a position from where we are, we first need to see whether we have to move left or right. Then we can work out the greater number less the smaller number, and get a number of steps that is positive. We can do it with the `if` and the `else` you already know.

```python try change
my_x = 9
broom_x = 6
if broom_x < my_x:
    print("left", my_x - broom_x)
else:
    print("right", broom_x - my_x)
```

Try putting 12 and then 9 in `broom_x`. With 9 the `else` runs and the steps are 0, and a move of 0 steps walks nothing.

Up and down work the same with `y`. A smaller `y` is up, and the steps are your `y` less the broom's.
