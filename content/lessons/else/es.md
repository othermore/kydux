# Si no

Cuando comprobamos algo con `if`, sabemos qué hacer si la respuesta es `True`. Pero, ¿y si la respuesta es no? A lo mejor queremos hacer otra cosa en su lugar.

Usamos la palabra `else` para decir qué pasa cuando la condición es `False`, y escribimos las líneas que el ordenador debe ejecutar entonces.

---
## Tomar una decisión

El `else` se pone en el mismo sitio que su `if`, sin espacios delante, y lleva sus propios dos puntos. Luego, metemos sus líneas hacia dentro con cuatro espacios por debajo.

Cuando el ordenador lee esto, una de las dos partes siempre se ejecutará. ¡Si la condición es verdadera ejecuta la primera, y si es falsa ejecuta la segunda!

---
## Pruébalo

Por ejemplo, si la puerta izquierda está cerrada con llave, vamos por la derecha; si no, por la izquierda.

Ahora mismo la puerta izquierda está cerrada con llave, ¡así que el programa escribirá el primer mensaje!

```python try
if left_door.locked:
    print("Vamos por la puerta derecha")
else:
    print("Vamos por la puerta izquierda")
```
