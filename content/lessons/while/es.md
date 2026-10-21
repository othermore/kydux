# Mientras

Un `for` repite un número de veces que conoces.
Pero a veces no sabes cuántas veces.

Espera, mientras el profesor mire hacia aquí.
Nadie sabe cuánto rato: depende del profesor.

Un bucle que sigue *mientras* una pregunta dice sí es un `while`.

---

## Cómo se escribe un while

```python
while dask.facing == "left":
    wizard.wait()
wizard.move_up(2)
```

`while` hace su pregunta.
Si la respuesta es `True`, hace sus líneas, y luego vuelve a preguntar.
Cuando la respuesta es `False`, para, y el programa sigue por debajo.

---

## Un while que no acaba nunca

Si la respuesta nunca pasa a ser `False`, el bucle no para nunca.
{El mago|La maga} esperaría para siempre.

El nivel tiene un límite de ticks, así que la partida acaba, y la tarjeta lo dice.
Entonces mira la pregunta: ¿puede cambiar alguna vez su respuesta?

---

## Pruébalo

Espera mientras Dask mire hacia aquí, y luego cruza.

```python try
while dask.facing == "left":
    wizard.wait()
```
