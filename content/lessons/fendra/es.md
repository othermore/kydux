# Un hechizo que alcanza

¡Un hechizo puede cruzar el espacio vacío! El hechizo *fendra*, lanzado con la varita usando `wizard.cast("fendra")`, atrae la cosa más cercana a la propia casilla de tu {mago|maga}.

Puede alcanzar hasta a tres casillas de distancia en línea recta, en cualquiera de las cuatro direcciones.

---
## Volar sobre las cosas

El hechizo vuela sobre estantes y librerías, pero no puede atravesar paredes ni puertas cerradas.

Si no hay nada lo suficientemente cerca para atraer, no vendrá nada, y tu {mago|maga} lo dirá.

---
## Pruébalo

Un libro raro brilla en lo alto de una librería cercana, pero está fuera de tu alcance. ¡Usaremos *fendra* para bajarlo!

Recuerda que un hechizo mueve las cosas, pero tus manos las llevan. Debes recoger la cosa una vez que haya llegado hasta ti.

```python try
wizard.move_right(5)
wizard.cast("fendra")
wizard.pick_up()
```
