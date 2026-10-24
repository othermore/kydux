# Si

Saber la respuesta a una expresión está muy bien, ¡pero hacer algo solo cuando la respuesta es sí es aún mejor! Los programadores llaman a esto una condición. La escribimos con la palabra `if`.

En este juego, un nivel puede ocurrir de distintas maneras, ¡así que el mismo programa debe poder ganarlas todas! A veces Dask está mirando, y a veces no.

---
## Escribir una condición

Escribimos `if`, luego nuestra expresión, y al final dos puntos. Debajo, metemos nuestras líneas hacia dentro dejando cuatro espacios. El ordenador solo ejecutará estas líneas con espacios si la respuesta es `True`.

Si Dask está mirando, tenemos que esperar. El método `wizard.wait()` hace que {el mago|la maga} se quede quiet{o|a} por un momento mientras todo lo demás se mueve.

---
## Pruébalo

Vamos a escribir una condición para escondernos de él. ¡La instrucción de esperar solo se ejecutará si Dask está mirando a la izquierda!

```python try
if dask.facing == "left":
    wizard.wait()
```
