# Un hechizo que alcanza

¡Un hechizo puede cruzar el espacio vacío! El hechizo *fendra*, lanzado con la varita, atrae una cosa a la propia casilla de tu {mago|maga}.

Como los estantes altos de la biblioteca están llenos de libros, el hechizo necesita saber exactamente cuál quieres. Debes darle el nombre bajo el que tu programa guarda la cosa, como su segundo argumento: `wizard.cast("fendra", book)`.

---
## Volar sobre las cosas

El hechizo alcanza hasta a tres casillas de distancia en línea recta, en cualquiera de las cuatro direcciones. Vuela sobre estantes y librerías, pero no puede atravesar paredes ni puertas cerradas.

Tampoco llega más allá de una puerta: una cosa que está dentro de una habitación se alcanza desde su umbral, o desde dentro, pero nunca desde delante de la habitación a través de su puerta, aunque esté abierta.

Si la cosa que pides está fuera de su alcance, no vendrá nada, y tu {mago|maga} lo dirá.

---
## Pruébalo

El libro de Eldra se encuentra entre muchos otros en la estantería de su pequeña habitación, demasiado alto para tus manos. Primero, lo encontraremos y lo guardaremos bajo un nombre. ¡Luego daremos un paso hacia arriba hasta el umbral y le lanzaremos *fendra*!

Recuerda que un hechizo mueve las cosas, pero tus manos las llevan. Debes recoger la cosa una vez que haya bajado hasta ti.

```python try
book = wizard.find_nearest("book")
wizard.move_up()
wizard.cast("fendra", book)
wizard.pick_up()
```
