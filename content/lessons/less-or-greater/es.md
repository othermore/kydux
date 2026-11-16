# Menor o mayor

Podemos usar `<` y `>` para comparar dos números. Responden `True` o `False`, igual que `==`, que mira si dos números son iguales. `3 < 5` se lee «3 es menor que 5», y `5 > 3`, «5 es mayor que 3». El signo se abre hacia el número mayor: en `3 < 5`, el lado abierto está junto al 5.

Cuando los dos números son iguales, ninguno es menor: `4 < 4` es `False`.

```python try
print(3 < 5)
print(5 < 3)
print(5 > 3)
print(4 < 4)
```

---
## Los números de las coordenadas

¿Recuerdas cómo funcionan las coordenadas? La `x` se cuenta desde la izquierda y la `y` desde arriba. Así que la `x` crece con cada paso a la derecha y disminuye con cada paso a la izquierda, y la `y` crece con cada paso hacia abajo y disminuye con cada paso hacia arriba.

Una escoba cuya `x` es menor que la de tu {mago|maga} está a su izquierda; si es mayor, a su derecha. Una escoba cuya `y` es menor está más arriba; si es mayor, más abajo. ¡Es sorprendente que la `y` crezca hacia abajo, pero así es!

Aquí `True` significa que la escoba está a la izquierda. ¡Prueba a poner 12 en `escoba_x` y ejecútalo de nuevo!

```python try
mi_x = 9
escoba_x = 6
print(escoba_x < mi_x)
```

---
## Qué resta hacemos

Un movimiento da 0 pasos o más. Si le das un número negativo, como en `wizard.move_left(-3)`, el juego no lo acepta y te dice: *`move_left` no se usa así. Prueba de esta forma: `wizard.move_left(3)`.*

Así que el programa mira primero y resta después, siempre el menor del mayor, con el `if` y el `else` que ya conoces. Las líneas del `else` se ejecutan cuando la condición del `if` es `False`.

```python try
mi_x = 9
escoba_x = 6
if escoba_x < mi_x:
    print("izquierda", mi_x - escoba_x)
else:
    print("derecha", escoba_x - mi_x)
```

Prueba a poner 12 y luego 9 en `escoba_x`. Con 9 el `else` se ejecuta y los pasos son 0, y un movimiento de 0 pasos no camina nada.

Arriba y abajo funcionan igual con la `y`. Una `y` menor es hacia arriba, y los pasos son tu `y` menos la de la escoba.
