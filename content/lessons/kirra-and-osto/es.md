# Luz y losas

Estos pasadizos nocturnos están llenos de secretos. ¿Ves esa habitación oscura? Necesitamos ver qué hay dentro.

El hechizo *kirra* ilumina la habitación en la que estás, para que se muestre lo que yace en la oscuridad y puedas encontrarlo.

---
## La losa que va y viene

En la oscuridad de la noche, se abre un agujero en el suelo de una casilla. Una losa cubre el agujero durante unos pocos ticks y desaparece por otros tantos, una y otra vez.

Si lanzamos el hechizo *osto* junto al agujero, sujeta la losa en su sitio durante un rato. Para saber si es seguro pisarla, miramos `hole.closed`. ¡Así podemos hacer `while not hole.closed:` con una espera debajo, y luego dar el paso de forma segura!

---
## Pruébalo

Vamos a caminar dos pasos por el pasillo, justo hasta el agujero del siguiente nivel, y comprobar si la losa está lista para que la pisemos.

```python try
wizard.move_right(2)
print(hole.closed)
```
