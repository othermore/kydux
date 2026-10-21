# Llaves y puertas

La mayoría de las puertas se abren con la mano.
Algunas están cerradas con llave, y solo se abren con su llave.

Así que {el mago|la maga} necesita primero la llave, encima.
Luego se pone al lado de la puerta, y la abre.

---

## Abrir una puerta

Una puerta también es un objeto, con una acción propia:

```python
door.open()
```

{El mago|La maga} tiene que estar justo al lado de la puerta.
Si la puerta está cerrada con llave, tiene que llevar su llave.
Una puerta que no está cerrada con llave se abre igual, sin llave.

---

## Pruébalo

En la sala siguiente, la llave está en el suelo, y la puerta está cerrada con llave.
Coge primero la llave.

```python try
wizard.move_right(4)
wizard.pick_up()
```
