# Encontrar cosas

Algunos métodos hacen algo en el mundo, como moverse o recoger cosas. ¡Otros te devuelven algo, como una respuesta!

El método `wizard.find_nearest("book")` te da el libro más cercano. Te da la cosa en sí, incluso si está muy lejos.

---
## Guardar la respuesta

Para guardar una respuesta, le damos un nombre, algo que los programadores llaman una variable.

Lo escribimos así: `book = wizard.find_nearest("book")`. El signo `=` simplemente pone el valor bajo el nombre para que podamos usarlo. ¡No pregunta si son iguales!

Si no hay ningún libro, la respuesta es `None`, que es la palabra de Python para decir nada.

---
## Qué hacer con una cosa

Una vez que guardas una cosa bajo un nombre, puedes preguntarle lo que sabe, como `book.position`. También puedes entregársela a quien esté justo al lado de tu {mago|maga}, usando `wizard.give(book)`.

Nuestra fantasma, Eldra, ha perdido un libro en algún lugar al otro lado de la sala. ¡Vamos a encontrarlo para ella!

```python try
book = wizard.find_nearest("book")
print(book.position)
```
