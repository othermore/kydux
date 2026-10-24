# Si no

Cuando haces una pregunta con `if`, sabes qué hacer si la respuesta es `True`. Pero, ¿y si la respuesta es no? A lo mejor quieres hacer otra cosa en su lugar.

Usamos la palabra `else` para decir qué pasa cuando la condición es `False`.

---
## Tomar una decisión

El `else` se pone en el mismo sitio que su `if`, sin espacios delante, y lleva sus propios dos puntos. Luego, metemos sus líneas hacia la derecha con cuatro espacios por debajo.

Cuando el ordenador lee esto, una de las dos partes siempre se ejecutará. ¡Si ejecuta la primera parte, se salta la segunda; y si se salta la primera, ejecuta la segunda!

---
## Pruébalo

Vamos a comprobar una puerta para ver si está cerrada. El ordenador imprimirá una cadena u otra, ¡pero nunca las dos!

```python try
if left_door.locked:
    print("la izquierda está cerrada")
else:
    print("la izquierda está abierta")
```
