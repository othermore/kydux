# Lo que sabe

Un objeto sabe cosas de sí mismo: sus **atributos**. Los has mirado muchas veces: `door.locked`, `wizard.items`. Hasta hoy solo los leías. Los de tu clase los escribes tú.

---
## Se escriben como se leen

Un atributo se escribe igual que se lee, con el punto, y se le da su valor con `=`, como a cualquier variable: `vesso.name = "Vesso"`.

El atributo es de ese objeto y de ningún otro. Y no es lo mismo que la variable: `vesso` es la variable donde tu programa guarda el objeto; `vesso.name` es lo que el objeto sabe de sí mismo.

---
## Un error que hay que ver

```python try
class Crow:
    pass

vesso = Crow()
vesso.name = "Vesso"
vesso.color = "black"
print(vesso.name, vesso.color)

otro = Crow()
print(otro.name)
```

La última línea da un error, y es justo el que hay que ver: `otro` es otro objeto, y nadie le ha dado un nombre. El juego te lo explica así: «Este objeto no tiene nada que se llame `name`.»

---
## Dos atributos, y nada más

Como os dije antes, las reglas son claras para los alumnos de primero: el familiar de un alumno de primer curso tiene dos atributos, `name` y `color`, y ninguno más. El nombre es una sola palabra.

El color es uno de los naturales de su tipo: un zorro puede ser `"red"`, `"white"` o `"black"`; un cuervo, `"black"` o `"white"`; un murciélago, `"black"` o `"white"`; una liebre, `"brown"` o `"white"`; un ratón, `"brown"` o `"white"`, y una rana, `"green"` o `"red"`.

Los demás colores, y los demás atributos, necesitan conocimientos mágicos más profundos, y no podréis hacerlo hasta cursos más altos.
