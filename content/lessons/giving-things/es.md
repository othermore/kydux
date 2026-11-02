# Dar cosas

Cuando empiezas un nivel nuevo, estás empezando un programa completamente nuevo. Esto significa que un nombre que guardaste en el último programa, como `book`, ha desaparecido, ¡incluso cuando la cosa en sí sigue en las manos de tu {mago|maga}!

El programa nuevo nunca ha oído ese nombre, así que tiene que volver a pedir la cosa. ¡Siempre sorprende un poco la primera vez!

---
## Preguntar por lo que llevas

Para preguntar por algo que llevas encima, usas `wizard.find_item("book")`. Te devuelve la cosa de ese tipo que lleva tu {mago|maga}, o `None` cuando no llevas ninguna.

Funciona igual que `find_nearest`, pero `find_nearest` busca en el suelo, ¡mientras que `find_item` busca en las manos de tu {mago|maga}! Lo guardamos bajo un nombre exactamente igual que antes, escribiendo `book = wizard.find_item("book")`.

---
## Dar una cosa

Una vez que guardas una cosa bajo un nombre, puedes entregársela a quien esté justo al lado de tu {mago|maga}.

Simplemente usas el método `wizard.give(book)`, poniendo el nombre de la cosa dentro de los paréntesis para decir exactamente qué quieres dar. Si no hay nadie junto a tu {mago|maga}, te lo dirá y se quedará con la cosa.

---
## Pruébalo

El libro está en tus manos y Eldra espera al otro extremo de la sala, lejos de ti. Todavía no hay nadie a tu lado.

¡Vamos a pedir el libro e intentar darlo aquí mismo, solo para ver qué dice tu {mago|maga}! Luego, en el nivel, caminarás hacia Eldra primero.

```python try
book = wizard.find_item("book")
wizard.give(book)
```
