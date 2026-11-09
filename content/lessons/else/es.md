# Si no

Cuando haces una pregunta con `if`, sabes qué hacer si la respuesta es `True`. Pero, ¿y si la respuesta es no? A lo mejor quieres hacer otra cosa en su lugar.

Usamos la palabra `else` para decir qué pasa cuando la condición es `False`, y escribimos las líneas que el ordenador debe ejecutar entonces.

---
## Tomar una decisión

El `else` se pone en el mismo sitio que su `if`, sin espacios delante, y lleva sus propios dos puntos. Luego, metemos sus líneas hacia dentro con cuatro espacios por debajo.

Cuando el ordenador lee esto, una de las dos partes siempre se ejecutará. ¡Si la condición es verdadera ejecuta la primera, y si es falsa ejecuta la segunda!

---
## Pruébalo

Vamos a comprobar hacia dónde está mirando Dask ahora mismo.

¡El ordenador imprimirá una cadena u otra, pero nunca las dos!

```python try
if dask.facing == "left":
    print("Dask mira a la izquierda")
else:
    print("Dask no mira a la izquierda")
```
