# La escoba y su nudo

Una escoba es un objeto, igual que las llaves o las puertas. Cuando un programa la guarda en una variable, por ejemplo `broom`, puede mirar su atributo `broom.knotted`. Este atributo es `True` mientras el hilo negro sigue anudado y `False` una vez que se lo quitas.

También puedes usar su método `broom.untie()`, que desata el nudo. Solo funciona cuando tu {mago|maga} está encima de la escoba o, si la escoba cuelga de un gancho, justo debajo de ella.

Para encontrar la escoba, `wizard.find_nearest("broom")` te da la más cercana, igual que nos daba una llave en la biblioteca.

---
## Lo que encuentras depende de dónde estés

Ya has usado antes funciones que buscan cosas, como `find_nearest`. Pero estas funciones te dan un resultado distinto según dónde esté tu {mago|maga} en el escenario. Eso significa que no siempre puedes encontrar todo. Por ejemplo, en este cobertizo, si estás junto a la pared en la que se cuelgan las escobas, solo encontrarás las escobas colgadas. Y si estás en la paja, encontrarás las que están tiradas en el suelo.
