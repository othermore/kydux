# Encontrar cosas

Algunas acciones cambian el mundo. Otras acciones te devuelven algo. Te devuelven una respuesta. Debes guardar esa respuesta a salvo. La guardas en una variable.

---

Puedes buscar un objeto perdido. `find_nearest` devuelve la cosa más cercana de ese tipo.

```python
book = wizard.find_nearest("book")
```

Ahora `book` guarda el libro en sí. Puedes preguntar por sus atributos, como `book.position`. Si no hay ningún libro, devuelve `None`. `None` es una palabra especial para nada.

---

También puedes entregar cosas. Puedes darle un objeto a alguien justo a tu lado. Usas el método `give`.

```python
wizard.give(book)
```

El argumento es la variable que guarda la cosa.

---

## Pruébalo

Una buena bibliotecaria sabe dónde están los libros. Encuentra el libro más cercano. Luego imprime su posición.

```python try
book = wizard.find_nearest("book")
print(book.position)
```
