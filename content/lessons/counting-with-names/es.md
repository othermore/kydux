# Contar con variables

Una vez que se guarda un número en una variable, ¡esa variable se puede usar para contar, exactamente igual que un número!

Por eso podemos sumar dos variables y guardar la suma en una tercera: `total = a + b`. Si `a` guarda 4 y `b` guarda 3, `total` guarda 7, y `print(total)` lo muestra.

¡Prueba a cambiar `a` y `b`, y prueba también `a - b` en lugar de `a + b`!

```python try change
a = 4
b = 3
total = a + b
print(total)
```

---
## Los pasos que quedan

Imagina una puerta que está a cinco pasos de distancia. Si `pasos` guarda los pasos que tu {mago|maga} ya ha dado hacia la puerta, `5 - pasos` son los pasos que todavía quedan hasta la puerta. Son cinco menos esos pasos. ¡Y `pasos + 2` es otro número, dos más!

---
## Guardarlo o usarlo

Este nuevo número se puede guardar en su propia variable, como `resto = 5 - pasos`, y usarse como el argumento de un movimiento: `wizard.move_left(resto)`.

Incluso puedes escribirlo directamente en los paréntesis: `wizard.move_left(5 - pasos)`. ¡Ambas formas caminarán exactamente la misma distancia!

---
## Pruébalo

Vamos a ver cuántos pasos quedan hasta la puerta cuando ya se ha llegado a la llave.

```python try
llave_de_eldra = wizard.find_nearest("key")
pasos = llave_de_eldra.distance_to(wizard)
print(5 - pasos)
```
