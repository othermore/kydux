# Finding things

Some methods do something in the world, like moving or picking things up. Others give something back to you, like an answer!

The method `wizard.find_nearest("book")` gives you the nearest book. It gives you the thing itself, even if it is very far away.

---
## Keeping the answer

To keep an answer, we give it a name, which programmers call a variable.

We write it like this: `book = wizard.find_nearest("book")`. The `=` sign simply puts the value under the name so we can use it. It does not ask whether they are equal!

If there is no book at all, the answer is `None`, which is Python's word for nothing.

---
## Making it glow

To see which thing the name holds and where it is, `book.reveal()` makes it glow where it lies. It glows even through whatever hides it, and from then on you know where to walk.

---
## What to do with a thing

Once a thing is kept under a name, you can hand it to whoever stands right beside your wizard, using `wizard.give(book)`.

Eldra, our ghost, has lost a book somewhere between the two big bookcases. Let us find it and make it glow!

```python try
book = wizard.find_nearest("book")
book.reveal()
```
