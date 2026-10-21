# Repetir

Algunas escaleras son largas.
Arriba, derecha, arriba, derecha, ocho veces seguidas.
Son dieciséis líneas, y es fácil perder la cuenta.

Un programa puede hacer las mismas líneas una y otra vez.
Eso es un **bucle**.

---

## Cómo se escribe un for

```python
for step in range(4):
    wizard.move_up()
    wizard.move_right()
```

`for step in range(4):` hace las líneas de debajo cuatro veces.
Las líneas van metidas cuatro espacios, como debajo de un `if`.

`step` cuenta las veces, desde `0` hasta `3`.
Puedes usarlo, o no hacerle caso.

---

## Pruébalo

Sube la escalera larga con un bucle.
Cambia el número hasta que {el mago|la maga} llegue arriba.

```python try
for step in range(3):
    wizard.move_up()
    wizard.move_right()
```
