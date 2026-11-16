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

Los cuatro espacios antes de una línea son la forma que tiene Python de saber que la línea está dentro del `if`. Nadie tiene que contarlos: en este editor, al pulsar Intro al final de una línea que acaba con dos puntos, la siguiente línea empieza ya metida hacia dentro, y las que van después se quedan dentro.

La tecla Tab pone cuatro espacios a la vez para meter una línea hacia dentro, y está a la izquierda del teclado, encima de la tecla de bloqueo de mayúsculas, a menudo dibujada con dos flechas. La tecla de borrar, la que tiene una flecha larga hacia la izquierda, pulsada en los espacios antes de una línea, quita los cuatro de golpe: una pulsación saca la línea. Cuatro pulsaciones de la barra espaciadora son lo mismo para Python; con Tab, simplemente, se hace antes.

Ejecuta el código de abajo, y se imprime una línea, la de fuera. Pon el cursor al principio de la última línea, pulsa Tab y ejecútalo de nuevo: no se imprime nada, porque la línea ahora está dentro del `if` y Dask no mira hacia abajo. Pulsa la tecla de borrar ahí, y la línea sale otra vez y se vuelve a imprimir.

```python try
if dask.facing == "down":
    print("Dask mira hacia abajo")
print("Esta línea está fuera del if")
```
