# Repetir

¡Estas escaleras nocturnas son muy largas, {wizard}!
Sube.
Camina a la derecha.
Escribir eso muchas veces es cansado.
Podemos decirle al castillo que haga las mismas cosas una y otra vez.
Una repetición, que los programadores llaman un bucle, nos ahorra trabajo.

---

Escribimos un bucle con `for`.
Podemos escribir `for step in range(8):` para hacer algo ocho veces.
Las líneas debajo deben estar movidas hacia dentro por cuatro espacios.
El castillo ejecuta esas líneas ocho veces seguidas.

---

## Pruébalo

Sube las escaleras con un bucle.
Muévete hacia arriba y luego a la derecha tres veces.

```python try
for step in range(3):
    wizard.move_up()
    wizard.move_right()
```
