# Luz y escaleras

Los pasadizos de la noche tienen dos problemas.

Algunas salas están a oscuras.
A oscuras, {el mago|la maga} solo ve las casillas que tiene alrededor.
Una llave a unas casillas es como si no estuviera.

Y algunas escaleras van y vienen.
Se colocan en su sitio un rato, y luego se apartan.

Dos hechizos ayudan con las dos cosas.

---

## El hechizo kirra

`kirra` ilumina la sala donde está {el mago|la maga}, para el resto del camino.

```python
wizard.cast("kirra")
```

Después, `find_nearest` encuentra cosas en cualquier sitio de la sala, como de día.
Antes, solo encuentra lo que hay justo alrededor.

---

## Las escaleras y osto

Una escalera está en su sitio unos ticks, y luego apartada otros tantos.
Un paso hacia una escalera apartada no llega a pisarla.

`stair.in_place` pregunta si un paso dado ahora caería sobre ella.
Así que un `while` puede esperarla:

```python
while not stair.in_place:
    wizard.wait()
```

`osto`, lanzado al lado de una escalera, la sujeta en su sitio seis ticks, desde la próxima vez que llegue.

---

## Pruébalo

Una escalera cruza el próximo hueco.
Acércate a ella, y pregunta si está en su sitio.

```python try
wizard.move_right()
print(stair.in_place)
```
