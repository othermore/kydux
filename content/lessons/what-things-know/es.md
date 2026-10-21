# Lo que saben las cosas

Un objeto puede hacer cosas: son sus acciones.
Un objeto también sabe cosas de sí mismo.
Dónde está.
Qué lleva.
Si una puerta está cerrada con llave.

Lo que sabe un objeto es un **atributo**.

---

## Preguntar

Un atributo se escribe como una acción, con un punto antes de su nombre.
Pero no lleva paréntesis.
No lleva paréntesis porque no se hace nada: solo preguntas.

```python
wizard.position
```

Para ver la respuesta, dásela a `print`, la acción propia de Python para enseñar un valor:

```python
print(wizard.position)
```

Lo que el programa escribe sale en la tarjeta de debajo del editor.

---

## Lo que se puede saber

- `wizard.position` es dónde está {el mago|la maga}.
- `wizard.items` es lo que lleva {el mago|la maga}.
- `door.locked` es `True` mientras la puerta necesita su llave, y `False` cuando no.

`True` y `False` son las palabras de Python para *sí* y *no*.

---

## Pruébalo

El camino corto para salir pasa por una puerta.
Pregúntale a la puerta antes de chocar con ella.

```python try
print(door.locked)
```
