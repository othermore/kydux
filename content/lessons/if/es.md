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
