# Contar con nombres

Una vez que se guarda un número bajo un nombre, ¡ese nombre se puede usar para contar, exactamente igual que un número!

Imagina una puerta que está a cinco pasos de distancia, con una llave en algún punto del camino. Si `steps` guarda los pasos que dio tu {mago|maga} para llegar a la llave, `5 - steps` también es un número. Son cinco menos esos pasos. ¡Y `steps + 2` es otro número, dos más!

---
## Guardarlo o usarlo

Este nuevo número se puede guardar bajo su propio nombre, como `rest = 5 - steps`, y usarse como el argumento de un movimiento: `wizard.move_left(rest)`.

Incluso puedes escribirlo directamente en los paréntesis: `wizard.move_left(5 - steps)`. ¡Ambas formas caminarán exactamente la misma distancia!

---
## Pruébalo

Vamos a ver cuántos pasos quedan hasta la puerta cuando ya se ha llegado a la llave.

```python try
key = wizard.find_nearest("key")
steps = key.distance_to(wizard)
print(5 - steps)
```
