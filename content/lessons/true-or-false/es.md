# Verdadero o falso

Mira por el pasillo. Dask hace su ronda ahí delante, y mira hacia un lado o hacia otro. A veces, las preguntas solo tienen dos respuestas: sí o no. En un programa, a este tipo de pregunta se le llama una expresión.

El ordenador responde a una expresión con `True` o `False`, que significan verdadero y falso.

---
## Comparar cosas

Podemos comparar dos valores para ver si son iguales usando dos signos de igual `==`. ¡Recuerda que un solo `=` nombra un valor, mientras que `==` hace una pregunta!

Por ejemplo, `dask.facing == "left"` pregunta si Dask está mirando a la izquierda. Su atributo guarda una cadena con la dirección hacia la que mira: `"up"`, `"down"`, `"left"`, o `"right"`.

---
## Darle la vuelta a la respuesta

Incluso podemos darle la vuelta a la respuesta del ordenador escribiendo `not` antes de la expresión. Si Dask está mirando a la izquierda, `not dask.facing == "left"` responderá `False`.

Vamos a ver cómo imprimirías una respuesta para ver qué dice el ordenador. ¡Recuerda hablar bajito!

```python
print(dask.facing == "left")
```
