# Mientras

Un bucle `for` es genial cuando sabes exactamente cuántas veces quieres repetir algo. Pero necesitamos esperar mientras Dask mire hacia la derecha, ¡y no sabemos durante cuántos ticks lo hará!

Podemos usar otro bucle que repite sus líneas una y otra vez mientras su expresión se mantenga verdadera, y continúa cuando se vuelve falsa. Lo escribimos con la palabra `while`.

---
## Hasta que cambie

¡Ten cuidado! Si la respuesta no cambia nunca, el bucle no terminará jamás.

Pero no es ningún desastre: el juego detendrá un `while` que no termina gracias al límite de ticks del juego. ¡Solo asegúrate de que la respuesta pueda cambiar!

---
## Pruébalo

Tu {mago|maga} se quedará quiet{o|a} una y otra vez, mientras Dask mire hacia la derecha. El programa escribe una línea cada tick que permanece en el bucle, y una más cuando sale de él.

```python try
while dask.facing == "right":
    print("Dask mira hacia", dask.facing, "así que espero")
    wizard.wait()
print("Hemos salido del bucle porque Dask mira hacia", dask.facing)
```
