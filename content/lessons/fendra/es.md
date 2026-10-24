# Un hechizo que alcanza

A veces, un libro que quieres está fuera de tu alcance, en lo alto de una estantería o al otro lado de un hueco. ¡La magia puede ayudarnos a alcanzar cosas a través del espacio vacío!

El hechizo *fendra*, lanzado con tu varita, atrae un objeto a tu casilla. Encuentra la cosa más cercana hasta a tres casillas de distancia en línea recta, en cualquiera de las cuatro direcciones.

---
## Cómo viaja el hechizo

El hechizo puede volar por encima de las estanterías, pero no puede atravesar paredes ni puertas cerradas. Si no hay nada lo bastante cerca, no viene nada, ¡y tu {mago|maga} lo dirá!

Como un hechizo mueve las cosas y las manos las llevan, debes recoger el objeto después de que llegue a tu casilla.

---
## Pruébalo

Vamos a acercarnos, a lanzar *fendra* para atraer un libro y luego a recogerlo.

```python try
wizard.move_left(5)
wizard.cast("fendra")
wizard.pick_up()
```
