# Si no

Un `if` hace sus líneas cuando la respuesta es sí.
Pero a veces hay otra cosa que hacer cuando es no.

Dos puertas, una cerrada con llave.
Si la de la izquierda está cerrada, ve por la derecha.
Si no, ve por la izquierda.

*Si no* es `else`.

---

## Cómo se escribe un else

```python
if left_door.locked:
    print("la izquierda está cerrada")
else:
    print("la izquierda está abierta")
```

`else` va después de las líneas del `if`, en el mismo sitio que `if`, con sus propios dos puntos.
Sus líneas, metidas, solo se hacen cuando la respuesta es `False`.

Así que siempre se hace una de las dos, y nunca las dos.

---

## Pruébalo

El próximo nivel se juega de dos maneras: en cada una, la puerta cerrada es otra.
Pregúntale primero a la puerta de la izquierda.

```python try
if left_door.locked:
    print("la izquierda está cerrada")
else:
    print("la izquierda está abierta")
```
