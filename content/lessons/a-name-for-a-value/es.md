# Un nombre para un valor

Un programa usa a menudo el mismo valor muchas veces.
Imagina que {el mago|la maga} tiene que andar cuatro casillas, tres veces seguidas.

Escribir `4` tres veces funciona.
Pero si el pasillo cambia, tienes que buscar cada `4` y cambiarlo.
Y es fácil que se te escape uno.

Por eso un programa puede darle un **nombre** a un valor, y usar el nombre en su lugar.
Un nombre para un valor es una **variable**.

---

## Dar un nombre

```python
steps = 4
```

El `=` le da el nombre `steps` al valor `4`.
No pregunta si son iguales: guarda el valor bajo ese nombre.

A partir de ahí, `steps` significa `4`:

```python
wizard.move_right(steps)
```

Para cambiar el valor, solo cambias la línea que lo da.

---

## Pruébalo

En la sala de lectura, {el mago|la maga} anda la misma distancia tres veces.
Escribe el número una sola vez, como una variable.

```python try
steps = 2
wizard.move_right(steps)
```
