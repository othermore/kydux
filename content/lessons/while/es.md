# While

Un bucle `for` es genial cuando conoces los pasos.
¡Pero no sabemos cuánto tiempo mirará Dask hacia aquí!
Debemos esperar mientras él mire.
Podemos mezclar un bucle y una condición.
Esto es un bucle `while`.

---

Un bucle `while` repite sus líneas mientras su expresión sea `True`.
Hace la pregunta.
Ejecuta las líneas si la respuesta es sí.
Luego pregunta otra vez.
Cuando la respuesta es `False`, se detiene.

---

¡Si la respuesta nunca cambia, el bucle nunca se detiene!
Esperarías hasta estar {cansado|cansada}.
El juego tiene un límite, y la ejecución termina.
Asegúrate siempre de que la respuesta pueda cambiar.

---

## Pruébalo

Espera mientras Dask mire a la izquierda.
¡Quédate muy {callado|callada}!

```python try
while dask.facing == "left":
    wizard.wait()
```
