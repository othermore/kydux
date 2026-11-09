# Esperar

Hasta ahora hemos hecho programas en los que nuestro personaje siempre hacía algo, pero a veces nos hace falta hacerlo esperar. Por ejemplo, en la siguiente pantalla, nuestro personaje tiene que esperar a que Dask pase antes de poder cruzar. Para esperar se usa el método `wizard.wait()`.

Un tick es un momento del juego en el que todo lo demás se mueve. ¡`wizard.wait()` espera un tick, y `wizard.wait(2)` espera dos ticks!

---
## Pruébalo

Espera dos ticks y luego camina ocho casillas hacia la derecha. Debajo leerás la casilla en la que ha terminado tu {mago|maga}. ¡Y puedes cambiarlo y probar de nuevo!

```python try
wizard.wait(2)
wizard.move_right(8)
```
