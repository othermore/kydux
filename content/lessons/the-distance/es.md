# A qué distancia

A veces un programa necesita un número que no puede conocer cuando se escribe.

Piensa en una llave que nunca está dos veces en el mismo sitio. ¡Estará a un número diferente de pasos cada vez que juegues!

---
## Preguntar la distancia

Una cosa puede decir cuántos pasos hay entre ella y tu {mago|maga}, a lo largo de las filas y las columnas. Solo tienes que pedir `key.distance_to(wizard)`.

---
## Usar una variable

Si guardas ese número bajo un nombre, como `steps = key.distance_to(wizard)`, puedes usarlo como el argumento de un movimiento: `wizard.move_left(steps)`. ¡Incluso puedes usarlo de nuevo para volver por el mismo camino!

Para esto sirve exactamente una variable: para guardar un valor que no conoces cuando escribes el programa, o que necesitas usar más de una vez.

---
## Muchas formas de jugar

En este juego, un nivel se puede jugar de varias maneras, una tras otra, con la llave en un lugar diferente en cada una. ¡Un mismo programa debe ganarlas todas!

Vamos a ver a qué distancia está la llave esta vez.

```python try
key = wizard.find_nearest("key")
steps = key.distance_to(wizard)
print(steps)
```
