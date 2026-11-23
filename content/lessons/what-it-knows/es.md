# Lo que sabe

Un objeto sabe cosas de sí mismo: sus **atributos**. Los has mirado muchas veces: `door.locked`, `wizard.items`. Hasta hoy solo los leías. Los de tu clase los escribes tú.

---
## Se escriben como se leen

Un atributo se escribe igual que se lee, con el punto, y se le da su valor con `=`, como a cualquier nombre: `vesso.name = "Vesso"`.

El atributo es de ese objeto y de ningún otro. Y no es lo mismo que el nombre del programa: `vesso` es como tu programa llama al objeto; `vesso.name` es lo que el objeto sabe de sí mismo.

---
## Un error que hay que ver

```python try
class Crow:
    pass

vesso = Crow()
vesso.name = "Vesso"
vesso.color = "black"
print(vesso.name, vesso.color)

other = Crow()
print(other.name)
```

La última línea da un error, y es justo el que hay que ver: `other` es otro objeto, y nadie le ha dado un nombre. El juego te lo explica así: «Este objeto no tiene nada que se llame `name`.»

---
## Dos atributos, y nada más

El libro lo dice claro: el familiar de un alumno de primer curso tiene dos atributos, `name` y `color`, y ninguno más. El nombre es una sola palabra.

El color es uno de los naturales de su tipo: un zorro puede ser `"red"`, `"white"` o `"black"`; un cuervo, `"black"` o `"white"`; un murciélago, `"black"` o `"white"`; una liebre, `"brown"` o `"white"`; un ratón, `"brown"` o `"white"`, y una rana, `"green"` o `"red"`. Gris, nunca.

Los demás colores, y los demás atributos, piden una magia que se aprende en cursos más altos.
