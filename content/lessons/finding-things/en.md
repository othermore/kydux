# Finding things

Some actions change the world. Other actions give something back to you. They give back an answer. You must keep that answer safe. You keep it under a variable.

---

You can look for a lost object. `find_nearest` gives back the nearest thing of that kind.

```python
book = wizard.find_nearest("book")
```

Now `book` holds the book itself. You can ask for its attributes, like `book.position`. If there is no book, it gives back `None`. `None` is a special word for nothing.

---

You can also give things away. You can give an object to someone right beside you. You use the `give` method.

```python
wizard.give(book)
```

The argument is the variable that holds the thing.

---

## Try it

A good librarian knows where books are. Find the nearest book. Then print its position.

```python try
book = wizard.find_nearest("book")
print(book.position)
```
