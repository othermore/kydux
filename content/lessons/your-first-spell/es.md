# Tu primer hechizo

Un hechizo es una palabra mágica. Por sí solo, es solo una cadena. Debes lanzarlo con una varita. Entonces hace algo.

---

Lo que hace un hechizo depende de dónde estés. Depende de lo que haya cerca. Puede que no haga nada en absoluto. Más adelante, algunos hechizos necesitarán saber sobre qué actuar.

---

`cast` es una acción que la varita le da a tu {mago|maga}. Sin la varita, no la conoce.

---

`zelim` es un hechizo. Rompe el sello de una puerta. Debes estar justo al lado de la puerta:

```python
wizard.cast("zelim")
```

Una puerta sellada muestra una runa brillante.

---

## Pruébalo

```python try
wizard.move_right(2)
wizard.cast("zelim")
```
