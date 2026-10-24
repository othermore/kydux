# Mientras

Un bucle `for` es genial cuando sabes exactamente cuántas veces quieres repetir algo. ¡Pero no podemos saber cuánto tiempo estará Dask mirando hacia aquí!

Podemos usar otro bucle distinto que repite sus líneas mientras una expresión sea `True`. Lo escribimos con `while`.

---
## Esperar un cambio

El bucle `while` comprueba la condición, ejecuta las líneas de dentro si es `True`, y luego vuelve a preguntar. Solo se detiene cuando la respuesta es `False`.

¡Ten cuidado! Si la respuesta no cambia nunca, el bucle no terminará jamás. El juego detendrá una ejecución que dure demasiado tiempo, así que asegúrate de que la respuesta pueda cambiar.

---
## Pruébalo

Vamos a escondernos y esperar. ¡Tu {mago|maga} se quedará quiet{o|a} una y otra vez, mientras Dask siga mirando a la izquierda!

```python try
while dask.facing == "left":
    wizard.wait()
```
