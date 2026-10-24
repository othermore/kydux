# Encontrar cosas

Una biblioteca guarda muchos secretos, y {un buen mago|una buena maga} sabe cómo buscar. Algunos métodos hacen algo en el mundo, como moverse. Otros métodos devuelven algo, una respuesta.

Cuando un método te da una respuesta, ¡puedes guardarla bajo una variable para usarla después!

---
## Guardar la respuesta

El método `wizard.find_nearest("book")` mira alrededor y devuelve el libro más cercano, la cosa en sí. Podemos guardarlo escribiendo `book = wizard.find_nearest("book")`.

Si no hay ningún libro lo bastante cerca, devuelve `None`, que es la palabra de Python para nada. Una vez que has encontrado un libro, podrías comprobar dónde está con `book.position`, o dárselo a un amigo justo a tu lado con `wizard.give(book)`.

---
## Pruébalo

Vamos a buscar un libro y a ver dónde está. ¡Primero buscamos y luego le preguntamos al libro por su posición!

```python try
book = wizard.find_nearest("book")
print(book.position)
```
