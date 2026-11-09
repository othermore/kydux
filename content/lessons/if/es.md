# Si

Saber la respuesta a una expresión está muy bien, ¡pero hacer algo solo cuando la respuesta es sí es aún mejor! Los programadores llaman a esto una condición. La escribimos con la palabra `if`.

Escribimos `if`, luego nuestra expresión, y al final dos puntos. Debajo, metemos nuestras líneas hacia dentro dejando cuatro espacios. El ordenador solo ejecutará estas líneas con espacios si la respuesta es `True`.

---
## Esperar nuestro momento

A veces Dask mira hacia aquí, y a veces mira hacia otro lado. Si está mirando, tenemos que esperar.

El método `wizard.wait()` hace que tu {mago|maga} se quede quiet{o|a} durante un tick, que es un momento del juego, mientras todo lo demás se mueve. ¡Y con `wizard.wait(2)` espera dos ticks!

---
## Pruébalo

Vamos a escribir una condición para escondernos de él. Como los niveles se pueden jugar de varias formas, Dask podría hacer cosas distintas.

¡Esta instrucción de esperar solo se ejecutará si está mirando a la izquierda!

```python try
if dask.facing == "left":
    wizard.wait()
```
