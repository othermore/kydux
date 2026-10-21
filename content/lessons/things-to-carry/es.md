# Cosas que llevar

Arvelia está llena de cosas: llaves, libros, varitas.
Una cosa está en una casilla del suelo.

{El mago|La maga} puede llevar cosas.
Para llevar una, se pone en su casilla, y la coge.

---

## Coger

```python
wizard.pick_up()
```

Esta acción coge la cosa que hay en la casilla {del mago|de la maga}.
Sus paréntesis están vacíos.
Coge lo que tiene a sus pies, así que no hace falta decirle nada más.

Si no hay nada en la casilla, no hay nada que coger.
{El mago|La maga} te lo dirá.

---

## Pruébalo

Tu varita está a unas casillas.
Camina primero hasta su casilla, y luego cógela.

```python try
wizard.move_right(2)
wizard.pick_up()
```
