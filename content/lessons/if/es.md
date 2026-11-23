# Si

Saber la respuesta a una expresión está muy bien, ¡pero hacer algo solo cuando la respuesta es sí es aún mejor! Los programadores llaman a esto una condición. La escribimos con la palabra `if`.

Escribimos `if`, luego nuestra expresión, y al final dos puntos. Debajo, metemos nuestras líneas hacia dentro dejando cuatro espacios. El ordenador solo ejecutará estas líneas con espacios si la respuesta es `True`.

---
## Una condición

La primera línea es la condición. La línea de debajo, metida hacia dentro con cuatro espacios, solo se ejecuta cuando la condición es `True`. La última línea no está metida hacia dentro, así que se ejecuta siempre, e imprime la palabra y la casilla de tu {mago|maga}. Al darle a `print` dos valores, separados por una coma, escribe ambos con un espacio entre ellos.

Dask mira hacia arriba ahora mismo, así que este programa imprime ambas líneas. Cambia `"up"` por `"down"` y ejecútalo de nuevo, y solo se imprimirá la casilla, porque la condición ya no es `True`.

```python try
if dask.facing == "up":
    print("Mirando hacia arriba")
print("Posición:", wizard.position)
```

---
## Meter líneas hacia dentro

Los cuatro espacios antes de una línea son la forma que tiene Python de saber que la línea está dentro del `if`.

La tecla Tab pone cuatro espacios a la vez para meter una línea hacia dentro, y que así no tengas que escribir los cuatro espacios tú. Es una tecla a la izquierda del teclado, encima de la tecla de bloqueo de mayúsculas. A veces tiene dibujadas una o dos flechas hacia los lados.

Una vez que estás escribiendo dentro del `if`, cada vez que pulsas Intro se añaden los espacios solos, para seguir dentro.

La tecla de borrar, que está encima del Intro y suele tener una flecha hacia la izquierda, borra los cuatro espacios, para volver a escribir fuera del `if`.

Puedes probarlo {tú mismo|tú misma}. Prueba a poner el cursor al principio de la última línea y pulsar Tab. Verás que la línea se mueve dentro del `if`, y si lo ejecutas ya no se imprimirá. Si borras los espacios y vuelves a ejecutar, la línea sí se imprimirá.

```python try
if dask.facing == "down":
    print("Dask mira hacia abajo")
print("Esta línea está fuera del if")
```
