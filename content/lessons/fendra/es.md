# Un hechizo que alcanza

Algunos libros son difíciles de alcanzar. Descansan en estantes altos. Yacen al otro lado de grandes huecos. Tus manos no pueden alcanzarlos. Pero un hechizo sí puede.

---

El hechizo `fendra` atrae cosas hacia ti. Alcanza hasta tres casillas en línea recta. Busca en las cuatro direcciones. Pasa por encima de los estantes. Las paredes y las puertas cerradas lo detienen.

---

Trae la cosa más cercana que puede alcanzar. La cosa aterriza exactamente en tu casilla. Luego debes recogerla. Un hechizo mueve cosas, y las manos las llevan.

---

Como tu primer hechizo, necesita tu varita. Usas el método `cast` con una cadena.

```python
wizard.cast("fendra")
wizard.pick_up()
```

Si no hay nada lo suficientemente cerca, {tu mago|tu maga} te lo dirá.

---

## Pruébalo

Un libro descansa en un estante alto. Atráelo hacia ti, y recógelo.

```python try
wizard.cast("fendra")
wizard.pick_up()
```
