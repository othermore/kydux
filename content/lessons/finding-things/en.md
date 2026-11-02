# Finding things

Some methods do something in the world, like moving or picking things up. Others give something back to you, like an answer!

The method `wizard.find_nearest("book")` gives you the nearest book. It gives you the thing itself, even if it is far away.

---
## Keeping the answer

To keep an answer, we give it a name, which programmers call a variable.

We write it like this: `book = wizard.find_nearest("book")`. The `=` sign simply puts the value under the name so we can use it. It does not ask whether they are equal!

If there is no book at all, the answer is `None`, which is Python's word for nothing.

---
## What to do with a thing

Once a thing is kept under a name, you can ask what it knows, like `book.position`. You can also hand it to whoever stands right beside your wizard, using `wizard.give(book)`.

Our ghost, Eldra, has lost a book somewhere across the hall. Let us find it for her!

```python try
book = wizard.find_nearest("book")
print(book.position)
```
