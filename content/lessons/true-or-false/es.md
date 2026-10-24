# Verdadero o falso

Algunas preguntas solo tienen dos respuestas: sí o no. ¿Está cerrada la puerta? ¿Está Dask mirando hacia aquí? En un programa, a este tipo de pregunta se le llama una expresión.

El ordenador responde a una expresión con `True` o `False`, que significan verdadero y falso.

---
## Comparar cosas

Un atributo puede ser una de estas respuestas, como `door.locked`. También podemos comparar dos valores para ver si son iguales.

Usamos dos signos de igual `==` para hacer la pregunta (¡recuerda que un solo `=` nombra un valor!). Por ejemplo, `dask.facing == "left"` pregunta si Dask está mirando a la izquierda. ¡Incluso podemos darle la vuelta a la respuesta usando `not`!

---
## Preguntar a los métodos

Algunos métodos también responden a estas preguntas. El ordenador puede comprobar `dask.can_see(wizard)` para decirnos si Dask te puede ver.

Vamos a probar a imprimir algunas respuestas para ver qué dice el ordenador. ¡Recuerda hablar bajito!

```python try
print(dask.facing)
print(dask.can_see(wizard))
```
