# Las dos coordenadas

¿Recuerdas cómo funciona el mapa del niño travieso? Contamos la x desde la izquierda y la y desde arriba, ¡y ambas empiezan en el 0! Un paso a la derecha suma uno a la x, y un paso hacia abajo suma uno a la y. Lo vamos a necesitar, porque en la siguiente sala la llave está en un lugar distinto cada noche. No podemos escribir un número fijo de pasos en el programa de antemano, ¡así que tendremos que calcularlos!

---
## Los dos números

Una posición guarda dos números, y son sus dos atributos: `mi_llave.position.x` es el primero y `mi_llave.position.y` el segundo. Los nuestros son `wizard.position.x` y `wizard.position.y`. ¡Los pasos de una casilla a otra son la diferencia de esos números! Los pasos a la derecha son la `x` de la llave menos la nuestra, y los pasos hacia abajo son la `y` de la llave menos la nuestra.

Por ejemplo, si estamos en la (5, 7) y la llave está en la (9, 8): 9 - 5 = 4 pasos a la derecha, y 8 - 7 = 1 paso hacia abajo. Esos dos números se pueden guardar en dos variables, como `derecha` y `abajo`, y usarse en los movimientos. En esta sala la llave siempre está a nuestra derecha y nunca más arriba que nosotros, así que las dos restas nunca bajan de cero. ¡Y no te preocupes, un movimiento de cero pasos no camina nada en absoluto!

---
## Pruébalo

El programa guarda la posición de tu {mago|maga} en una variable, `casilla`, y luego imprime sus dos números, primero su atributo `x` y después su atributo `y`, cada uno en su propia línea. ¡Así puedes ver los dos números de la casilla donde estás!

```python try
casilla = wizard.position
print(casilla.x)
print(casilla.y)
```
