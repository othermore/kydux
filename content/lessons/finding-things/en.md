# Finding things

A library holds many secrets, and a good wizard knows how to search. Some methods do something in the world, like moving. Other methods give something back, an answer.

When a method gives you an answer, you can keep it under a variable to use later!

---
## Keeping the answer

The method `wizard.find_nearest("book")` looks around and gives back the nearest book, the thing itself. We can keep it by writing `book = wizard.find_nearest("book")`.

If there is no book near enough, it gives back `None`, which is Python's word for nothing. Once you have found a book, you could check where it is with `book.position`, or hand it to a friend right beside you with `wizard.give(book)`.

---
## Try it

Let us find a book and see where it is. First we search, and then we ask the book for its position!

```python try
book = wizard.find_nearest("book")
print(book.position)
```
