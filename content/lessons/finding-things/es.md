# Encontrar cosas

Algunos métodos hacen algo en el mundo, como moverse o recoger cosas. ¡Otros te devuelven algo, como un valor!

El método `wizard.find_nearest("book")` te da el libro más cercano. Te da la cosa en sí, incluso si está muy lejos.

---
## Guardar el valor

Para guardar un valor, le damos un nombre, algo que los programadores llaman una variable.

Lo escribimos así: `book = wizard.find_nearest("book")`. El signo `=` simplemente pone el valor en una variable para que podamos usarlo. ¡No comprueba si son iguales!

Si no hay ningún libro, el valor es `None`, que es la palabra de Python para decir nada.

---
## Hacer que brille

Para ver qué cosa guarda la variable y dónde está, `book.reveal()` hace que brille donde se encuentra. Brilla incluso a través de lo que la esconda, y a partir de entonces sabes adónde caminar.

---
## Pruébalo

Nuestra fantasma, Eldra, perdió uno de sus libros hace mucho tiempo. Está en un rincón de la biblioteca, junto a la pila de libros viejos, medio escondido detrás de ella. Un programa lo encuentra dondequiera que esté, ¡así que vamos a encontrarlo y a hacer que brille!

```python try
book = wizard.find_nearest("book")
book.reveal()
```
