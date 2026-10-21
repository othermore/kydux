# Finding things

Some actions do something.
Others give something back: an answer.

`wizard.find_nearest("book")` looks for the nearest book, and gives it back.

To use what an action gives back, keep it under a name.
A variable can keep a thing, just as it keeps a number.

---

## Keeping what is found

```python
book = wizard.find_nearest("book")
print(book.position)
```

Now `book` is the book itself.
You can ask it things, like where it lies.

When there is nothing of that kind, `find_nearest` gives back `None`.
`None` is Python's word for *nothing*.

---

## Giving

The wizard can give a thing it carries to someone right beside it:

```python
wizard.give(book)
```

In the brackets goes the thing itself: the one the name keeps.

---

## Try it

Eldra, the library's ghost, has lost a book.
First find out where it lies.

```python try
book = wizard.find_nearest("book")
print(book.position)
```
