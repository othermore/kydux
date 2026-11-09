# Las casillas

Hablo bajito para que no nos oigan en la oscuridad. Mira este mapa que te he dado, el mapa del niño travieso. Muestra todo el castillo planta por planta como un plano de casillas, y se abre exactamente por el pasillo en el que estamos.

Una casilla se nombra con dos números: la equis cuenta desde la izquierda, y la ye cuenta desde arriba, ambos empezando en 0. Así que la casilla de arriba a la izquierda es `(0, 0)`, y la que está justo a su derecha es `(1, 0)`.

---
## Contar los pasos

Un paso a la derecha suma uno a la equis, y un paso hacia abajo suma uno a la ye. ¡Hacia la izquierda y hacia arriba se resta uno!

Así que, para ir desde la casilla `(5, 12)` hasta la `(9, 9)`, tu {mago|maga} tiene que caminar cuatro pasos a la derecha y tres hacia arriba. Solo tienes que contar cuánto cambia cada número.

---
## Pruébalo

El mapa solo funciona con la palabra que está escrita en su esquina, *orvim*.

Si la lanzas con la varita, se abrirá una ventana con el plano de este pasillo, sus casillas numeradas y nuestros tres nombres. El juego esperará a que la cierres antes de continuar.

```python try
wizard.cast("orvim")
```
