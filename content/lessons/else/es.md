# Else

A veces necesitamos un plan de reserva.
¿Y si la puerta está cerrada con llave?
Debemos ir por el otro lado.
Un `if` solo se ejecuta cuando la respuesta es sí.
Necesitamos líneas que se ejecuten cuando la respuesta es no.

---

Para eso sirve `else`.
Significa de otro modo.
Va después de las líneas del `if`.
No debe estar movido hacia dentro.
Tiene sus propios dos puntos `:`.
Las líneas debajo de `else` se mueven hacia dentro cuatro espacios.
Solo se ejecutan cuando la condición es `False`.

---

## Pruébalo

Vamos a probar la puerta izquierda.
Pregunta si está cerrada con llave.
Imprime una cadena si lo está, y otra si está abierta.

```python try
if left_door.locked:
    print("la izquierda está cerrada")
else:
    print("la izquierda está abierta")
```
