# If

Ahora sabemos si Dask está mirando.
Pero solo queremos escondernos cuando mira hacia aquí.
Necesitamos una elección, que los programadores llaman una condición.
Hacemos una pregunta.
Solo hacemos algo cuando la respuesta es sí.

---

Para esto sirve `if`.
Después de `if` viene tu expresión.
Luego vienen dos puntos `:`.
Las líneas debajo deben estar movidas hacia dentro por cuatro espacios.
Eso le dice al castillo que estas líneas pertenecen al `if`.
Solo se ejecutan cuando la expresión es `True`.

---

Debes quedarte {quieto|quieta} cuando Dask mira hacia aquí.
`wizard.wait()` te hace esperar un instante mientras el mundo sigue.
La siguiente sala se juega de dos formas diferentes.
¡El mismo código debe llevarte a salvo por ambas!

---

## Pruébalo

Comprueba hacia dónde mira Dask.
Espera solo si mira a la izquierda.

```python try
if dask.facing == "left":
    wizard.wait()
```
