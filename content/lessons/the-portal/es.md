# El portal que no se cierra

El agujero en el camino a casa no es como el que cruzamos antes. Aquel se cerraba cada pocos ticks, y lo esperábamos con un bucle `while`.

¡Este es un portal oscuro que no se cierra nunca por sí solo! Se mantiene abierto, tick tras tick, así que un bucle `while` que esperara a que se cerrara esperaría para siempre. Necesitamos otra forma de cruzarlo a salvo.

---
## El hechizo *osto*

El hechizo *osto* es justo lo que necesitamos. Cuando lo lanzas con la varita desde una casilla justo al lado del agujero, usando `wizard.cast("osto")`, mantiene el suelo cerrado sobre el agujero durante un rato.

Mientras lo sujeta, se ve una fina grieta de luz a su alrededor, y tus pasos al cruzarlo pisan a salvo el suelo. ¡Así que tu programa debe lanzar *osto* desde la casilla anterior al agujero, y luego cruzar al instante, antes de que deje de sujetarlo!
