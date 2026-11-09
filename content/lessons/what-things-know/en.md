# What things know

An object has methods. But an object also knows things about itself, which programmers call attributes.

For example, your wizard knows what it carries. A door knows whether it is locked or not.

---
## Looking at an attribute

To look at an object's attribute, we write a dot after its name, but no brackets. We leave the brackets out because we are not using a method!

We just write `door.locked` or `wizard.items`.

---
## Showing the value

To see it, we use `print`. It is Python's own way to show a value, right under the editor where you write your code.

`print` shows any value, not only an attribute. It shows a number, like 7. It shows a sum: Python works it out first and writes the result. And it shows a string, the words in quotes, which appears without the quotes. Each `print` writes its own line. Try changing the numbers or the word, and run it again!

```python try
print(7)
print(2 + 3)
print("Hello")
```

---
## Finding things

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

To see which thing the variable holds and where it is, `book.reveal()` makes it glow where it lies. It glows even through whatever hides it, and from then on you know where to walk.

---
## Try it

The door I just opened for you is the nearest one, so it is a perfect one to check! The first line finds the nearest door and keeps it in the variable `door`, and the second line looks at its attribute `locked` and prints it. Because I just opened this door for you, it is not locked, so the answer it prints will be `False`.

```python try
door = wizard.find_nearest("door")
print(door.locked)
```
