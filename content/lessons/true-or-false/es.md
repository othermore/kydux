# Verdadero o falso

Algunas preguntas solo tienen dos respuestas: sí, o no.
¿Está la puerta cerrada con llave?
¿Lleva {el mago|la maga} la llave?
¿Puede verte el profesor?

Un programa hace preguntas así todo el rato.
Las hace para poder elegir qué hacer.

---

## Preguntas en Python

En Python, una pregunta es una **expresión**, y su respuesta es `True` o `False`.

```python
print(3 > 2)
print(door.locked)
```

La primera línea escribe `True`: tres es más que dos.
La segunda escribe `True` o `False`, según esté la puerta.

---

## ¿Es lo mismo?

`==` pregunta si dos valores son el mismo:

```python
print(dask.facing == "left")
```

No es `=`.
Un `=` le da un nombre a un valor.
Dos, `==`, hacen una pregunta.

`not` le da la vuelta a la respuesta: `not door.locked` es `True` cuando la puerta se abre con la mano.

Una acción también puede responder:

```python
print(dask.can_see(wizard))
```

---

## Pruébalo

Dask, el profesor de los pasadizos, está en la torre de vigilancia.
Pregunta hacia dónde mira, y si puede ver {al mago|a la maga}.

```python try
print(dask.facing)
print(dask.can_see(wizard))
```
