# Verdadero o falso

## Otros atributos

Un atributo puede guardar algo distinto a dos números. Por ejemplo, `dask.facing` guarda una palabra, una cadena, que dice hacia dónde mira Dask: `"up"`, `"down"`, `"left"` o `"right"`. El atributo `wizard.facing` dice lo mismo sobre tu {mago|maga}.

```python try
print(dask.facing)
```

---
## Comparar

Podemos comparar dos cosas para ver si son iguales usando dos signos de igual `==`. La respuesta solo puede ser sí o no, que en programación se llaman `True` y `False`. A esta comprobación la llamamos una expresión. Recuerda que un solo `=` le da un nombre a un valor, ¡y `==` sirve para comparar!

Por ejemplo, vamos a ver qué pasa si comparamos números.

```python try
print(3 == 3)
print(3 == 4)
```

---
## Comparar atributos

Podemos comparar dos atributos para ver si Dask y tu {mago|maga} miran hacia el mismo lado escribiendo `dask.facing == wizard.facing`. También podemos comparar un atributo con un valor literal, que es un valor escrito tal cual: para comprobar si Dask mira hacia arriba usamos `dask.facing == "up"`.

Vamos a ver las respuestas a esas dos expresiones.

```python try
print(dask.facing == wizard.facing)
print(dask.facing == "up")
```

---
## Decir lo contrario

Si ponemos la palabra `not` delante de una expresión, dice lo contrario. Por ejemplo, si Dask mira hacia arriba, `not dask.facing == "up"` responderá `False`.

Vamos a comprobarlo imprimiendo lo contrario de que Dask mire hacia arriba.

```python try
print(not dask.facing == "up")
```

---
## Pruébalo

Ahora puedes cambiar este pequeño programa. Imprime si Dask mira hacia abajo, y luego si no mira hacia abajo.

```python try
print(dask.facing == "down")
print(not dask.facing == "down")
```
