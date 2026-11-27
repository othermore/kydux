# A qué distancia

A veces un programa necesita un número que no puede conocer cuando se escribe.

Piensa en una llave que nunca está dos veces en el mismo sitio. ¡Estará a un número diferente de pasos cada vez que juegues!

---
## Comprobar la distancia

Una vez que un programa ha encontrado la llave y la ha guardado en una variable, por ejemplo `llave_de_eldra`, la llave puede decir cuántos pasos hay entre ella y tu {mago|maga}, a lo largo de las filas y las columnas. Solo tienes que usar `llave_de_eldra.distance_to(wizard)`.

---
## Usar una variable

Si guardas ese número en una variable, como `pasos = llave_de_eldra.distance_to(wizard)`, puedes usarlo como el argumento de un movimiento: `wizard.move_left(pasos)`. ¡Incluso puedes usarlo de nuevo para volver por el mismo camino!

Para esto sirve exactamente una variable: para guardar un valor que no conoces cuando escribes el programa, o que necesitas usar más de una vez.

---
## Buscar la solución que funciona siempre

En este juego, algunas cosas cambian cada vez que se ejecuta un nivel. Por ejemplo, la llave puede aparecer en un lugar diferente. ¡Un mismo programa debe estar preparado para funcionar en todos los casos!

Vamos a ver a qué distancia está la llave esta vez.

```python try
llave_de_eldra = wizard.find_nearest("key")
pasos = llave_de_eldra.distance_to(wizard)
print(pasos)
```
