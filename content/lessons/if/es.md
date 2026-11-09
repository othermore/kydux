# Si

Saber la respuesta a una expresión está muy bien, ¡pero hacer algo solo cuando la respuesta es sí es aún mejor! Los programadores llaman a esto una condición. La escribimos con la palabra `if`.

Escribimos `if`, luego nuestra expresión, y al final dos puntos. Debajo, metemos nuestras líneas hacia dentro dejando cuatro espacios. El ordenador solo ejecutará estas líneas con espacios si la respuesta es `True`.

---
## Una condición

Si Dask mira hacia arriba, queremos caminar dos casillas hacia abajo.

Este código imprime la casilla de tu {mago|maga}, que solo cambia si la condición es verdadera.

```python try
if dask.facing == "up":
    wizard.move_down(2)
print(wizard.position)
```

---
## Pruébalo

Cambia `"up"` por `"down"` en el código. ¡Verás que la casilla se queda igual porque la condición ya no es verdadera!

```python try
if dask.facing == "up":
    wizard.move_down(2)
print(wizard.position)
```
