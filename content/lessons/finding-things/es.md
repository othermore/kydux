# Encontrar cosas

Algunas acciones hacen algo.
Otras devuelven algo: una respuesta.

`wizard.find_nearest("book")` busca el libro más cercano, y lo devuelve.

Para usar lo que devuelve una acción, guárdalo bajo un nombre.
Una variable puede guardar una cosa, igual que guarda un número.

---

## Guardar lo que encuentras

```python
book = wizard.find_nearest("book")
print(book.position)
```

Ahora `book` es el libro mismo.
Le puedes preguntar cosas, como dónde está.

Cuando no hay nada de ese tipo, `find_nearest` devuelve `None`.
`None` es la palabra de Python para *nada*.

---

## Dar

{El mago|La maga} puede darle una cosa que lleva a alguien que esté justo a su lado:

```python
wizard.give(book)
```

Entre los paréntesis va la cosa misma: la que guarda el nombre.

---

## Pruébalo

Eldra, el fantasma de la biblioteca, ha perdido un libro.
Primero averigua dónde está.

```python try
book = wizard.find_nearest("book")
print(book.position)
```
