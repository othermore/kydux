# Dar cosas

Cuando empiezas un nivel nuevo, estás empezando un programa completamente nuevo. Esto significa que una variable que guardaste en el último programa, como `book`, ha desaparecido, ¡incluso cuando la cosa en sí sigue en las manos de tu {mago|maga}!

El programa nuevo nunca ha visto esa variable, así que tiene que volver a buscar la cosa. ¡Siempre sorprende un poco la primera vez!

---
## Buscar lo que llevas

Para buscar algo que llevas encima, usas `wizard.find_item("book")`. Te devuelve la cosa de ese tipo que lleva tu {mago|maga}, o `None` cuando no llevas ninguna.

Funciona igual que `find_nearest`, pero `find_nearest` busca en el suelo, ¡mientras que `find_item` busca en las manos de tu {mago|maga}! Lo guardamos en una variable exactamente igual que antes, escribiendo `book = wizard.find_item("book")`.

---
## Dar una cosa

Una vez que guardas una cosa en una variable, puedes entregársela a quien esté justo al lado de tu {mago|maga}.

Simplemente usas el método `wizard.give(book)`, poniendo la variable que la guarda dentro de los paréntesis para decir exactamente qué quieres dar. Si no hay nadie junto a tu {mago|maga}, te lo dirá y se quedará con la cosa.
