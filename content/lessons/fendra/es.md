# Un hechizo que alcanza

Algunas cosas están donde {el mago|la maga} no puede ir.
En una estantería alta.
Al otro lado de un hueco.

Las manos no llegan.
Un hechizo, sí.

---

## El hechizo fendra

`fendra` atrae una cosa hacia {el mago|la maga}.

Alcanza tres casillas, en línea recta, hacia cada uno de los cuatro lados.
Pasa por encima de las estanterías.
Las paredes y las puertas cerradas lo paran.

Trae la cosa más cercana que alcanza, hasta la casilla {del mago|de la maga}.
Luego la coge, como siempre: un hechizo mueve las cosas, y las manos las llevan.

---

## Lanzarlo

```python
wizard.cast("fendra")
wizard.pick_up()
```

Como `zelim`, necesita la varita.
Si no hay nada lo bastante cerca, {el mago|la maga} te lo dirá.

---

## Pruébalo

Hay un libro en una estantería alta.
Camina hasta ponerte en línea con él, lo bastante cerca, y lanza el hechizo.

```python try
wizard.cast("fendra")
```
