# Luz y escaleras

El castillo esconde dos cosas engañosas por la noche.
Algunas salas son muy oscuras.
No puedes ver qué hay dentro de ellas.
¡Y algunas escaleras se mueven!
Giran hasta su lugar por un momento.
Luego se alejan.
Necesitamos dos nuevos hechizos para esto.

---

Lanza `kirra` con tu varita para arreglar la oscuridad.
`kirra` ilumina la sala para que puedas ver todo.
Debes esperar a que llegue una escalera móvil.
Puedes comprobar el atributo `stair.in_place`.
Pregunta si un paso sobre la escalera aterrizaría a salvo.

---

Lanza `osto` con tu varita junto a la escalera cuando llegue.
`osto` sujeta la escalera móvil en su lugar por un rato.
¡Entonces puedes cruzar sin chocar!

---

## Pruébalo

Camina hasta el hueco.
Mira a ver si la escalera está en su lugar ahora mismo.

```python try
wizard.move_up(2)
print(stair.in_place)
```
