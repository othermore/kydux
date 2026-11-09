# Finding things

Some methods do something in the world, like moving or picking things up. Others give something back to you, like a value!

The method `wizard.find_nearest("book")` gives you the nearest book. It gives you the thing itself, even if it is very far away.

---
## A variable

To keep a value, we give it a name, which programmers call a variable. A variable can hold a number or a string.

It is written with `=`: the name on the left, the value on the right, as in `age = 9` and `name = "Marta"`. The `=` sign simply puts the value in a variable so we can use it. It does not check whether they are equal!

When we use `print` with a variable's name, it shows what the variable holds: the 9 or Marta, not the word `age` or `name`. Try changing the number and the word!

```python try
age = 9
name = "Marta"
print(age)
print(name)
```

---
## Adding variables

A variable that holds a number can be used just like that number. So we can add two variables and keep the sum in a third one: `total = a + b`. If `a` holds 4 and `b` holds 3, `total` holds 7, and `print(total)` shows it.

Try changing `a` and `b`, and try `a - b` in place of `a + b` too!

```python try
a = 4
b = 3
total = a + b
print(total)
```

---
## Keeping what a method gives back

When we write `book = wizard.find_nearest("book")`, the variable `book` keeps the book the method gives back, and the program can use it afterwards.

If there is no book at all, the value is `None`, which is Python's word for nothing.

---
## Making it glow

To see which thing the variable holds and where it is, `book.reveal()` makes it glow where it lies. It glows even through whatever hides it, and from then on you know where to walk.

---
## Try it

Eldra, our ghost, lost one of her books long ago. It lies in a corner of the library, by the pile of old books, half hidden behind it. A program finds it wherever it lies, so let us find it and make it glow!

```python try
book = wizard.find_nearest("book")
book.reveal()
```
