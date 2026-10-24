# Verdadero o falso

¡Chis, {wizard}!
Dask está dando vueltas en la oscuridad.
Debemos saber qué es seguro.
Algunas preguntas solo tienen dos respuestas.
La respuesta es sí o no.
¿Está cerrada la puerta?
¿Nos ve el profesor?
El castillo responde a una pregunta, que los programadores llaman una expresión.
La respuesta es `True` o `False`.

---

Vamos a hacer algunas preguntas.
`3 > 2` da `True`.
También podemos preguntar por un atributo como `door.locked`.
Usamos dos signos de igual `==` para ver si dos cosas son iguales.
Un `=` es para una variable.
Dos `==` hacen una pregunta.
`dask.facing == "left"` pregunta hacia dónde mira Dask.

---

A veces queremos lo contrario.
La palabra `not` da la vuelta a la respuesta.
`not door.locked` es `True` cuando la puerta no está cerrada con llave.
Un método también puede responder.
¡`dask.can_see(wizard)` nos dice si Dask te descubre!

---

## Pruébalo

Vamos a espiar a Dask.
Pregunta hacia dónde mira.
Luego pregunta si puede verte.

```python try
print(dask.facing)
print(dask.can_see(wizard))
```
