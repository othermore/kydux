# Finding things

Some methods do something in the world, like moving or picking things up. Others give something back to you, a value!

For example, `wizard.find_nearest("book")` gives you the nearest book, even if it lies far away.

---
## Not kept, it is lost

A line that is only `wizard.find_nearest("book")` finds the book and forgets it at once: the program has not kept it in any variable, and on the next line it can no longer use it.

To keep it, we put a variable and `=` in front: `treasure = wizard.find_nearest("book")`. You can give it any name you like. I, for one, call it `treasure` because, to a librarian, every book is a treasure!

---
## The game's word and the variable

In that line, one word is the game's and the other is not. `"book"`, in quotes, is the game's word: it says what kind of thing to look for, and must be written exactly so, with its quotes.

But `treasure` is the variable, and its name is chosen by whoever writes the program: `dusty_one` or `my_find` would do just as well. From that line on, the book is in that variable and we can use it in other places.

---
## The methods of what you find

When we use `find_nearest` and keep what it finds in a variable, what was found is an object, and like the door it has methods of its own. For example, `treasure.reveal()` makes it glow, so that it is seen wherever it lies.

The variable goes before the dot, exactly as `door` does in `door.open()`. That is why we cannot write `wizard.reveal(treasure)`: `reveal` is the thing's method, not your wizard's.

---
## Try it

The nearest book is this one on the floor. Run the code to see how the program prints `<book at 3, 15>`. This is the game's way of writing a thing: its kind and the cell where it lies (you will learn to read those two numbers later).

Now, change the variable's name in both lines to one of your own and run it again. It finds the same book!

```python try rename
treasure = wizard.find_nearest("book")
print(treasure)
```
