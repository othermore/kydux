# Si

A veces un programa tiene que hacer algo solo en algunos casos.
Esperar, pero solo si el profesor mira hacia aquí.
Abrir la puerta, pero solo si está cerrada con llave.

Para eso sirve `if`.
Significa *solo si*.

---

## Cómo se escribe un if

```python
if dask.facing == "left":
    wizard.wait()
wizard.move_up(2)
```

Después de `if` va una pregunta, y luego dos puntos, `:`.
Las líneas de debajo, metidas cuatro espacios, solo se hacen cuando la respuesta es `True`.
Los cuatro espacios dicen qué líneas son del `if`.

`wizard.wait()` hace que {el mago|la maga} se quede quiet{o|a} un tick, mientras el mundo sigue.

La línea que no está metida se hace siempre, después del `if`.

---

## Un programa, todas las maneras

El próximo nivel se juega de dos maneras.
En una, Dask mira hacia otro lado.
En la otra, mira hacia aquí.

El mismo programa tiene que superar las dos.
Un programa que solo camina te deja ver en una de ellas.
Un programa que solo espera te deja ver en la otra.

---

## Pruébalo

Haz la pregunta, y espera solo cuando la respuesta sea sí.

```python try
if dask.facing == "left":
    wizard.wait()
```
