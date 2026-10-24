# Luz y escaleras

Estos pasadizos nocturnos están llenos de secretos. ¿Ves esas habitaciones oscuras? Necesitamos un nuevo hechizo para ver su interior. El hechizo *kirra* ilumina la habitación en la que estás, para que se vea lo que hay en la oscuridad.

¡También hay escaleras móviles por aquí! Se colocan en su sitio por un momento y luego se vuelven a apartar.

---
## Pasos seguros

Una escalera sabe si está en su sitio con el atributo `stair.in_place`. Esto dice si dar un paso hacia ella en este momento sería seguro.

Si te paras junto a una escalera móvil, puedes lanzar el hechizo *osto*. ¡Mantiene la escalera móvil quieta durante un rato y te da tiempo a cruzar!

---
## Pruébalo

Vamos a acercarnos a una escalera y comprobar si está lista para que la pisemos. ¡Podemos imprimir lo que sabe la escalera!

```python try
wizard.move_up(2)
print(stair.in_place)
```
