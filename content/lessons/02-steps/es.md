# Pasos, llaves y puertas

Escribir la misma línea muchas veces es lento.
Una acción puede llevar un número entre sus paréntesis.

```python
wizard.move_right(4)
```

Esta línea hace que el mago dé cuatro pasos.
El número se llama **argumento**: le dice a la acción cuánto tiene que hacer.

---

## Las cosas del mundo

En algunos niveles hay **cosas**, como una llave o una puerta.
Cada cosa también es un objeto, con su propio nombre y sus propias acciones.

El mago puede coger la cosa que hay en su casilla:

```python
wizard.pick_up()
```

Una puerta tiene una acción propia.
El mago tiene que estar a su lado, y llevar la llave si está cerrada con llave:

```python
door.open()
```

---

## Pruébalo

Camina hasta la llave y cógela.
Luego busca el camino hasta la puerta.

```python try
wizard.move_right(4)
wizard.pick_up()
```
