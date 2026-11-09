# Luz y trampas

Estos pasadizos nocturnos están llenos de secretos. ¿Ves esa habitación oscura? Necesitamos ver qué hay dentro.

El hechizo *kirra* ilumina la habitación en la que estás, para que se muestre lo que yace en la oscuridad y puedas encontrarlo.

---
## El agujero que se abre

En estos pasadizos hay agujeros que se abren en el suelo: una trampa mágica, o un portal oscuro. El agujero está cerrado unos pocos ticks, con el suelo intacto sobre él, y abierto otros tantos, una y otra vez.

Para saber cómo está, miramos sus atributos. `hole.open` es `True` mientras el agujero está abierto, y `hole.closed` es `True` mientras el suelo lo tapa: uno es siempre lo contrario del otro. Por eso hay dos formas de esperar que son la misma: `while hole.open:` espera mientras está abierto, y `while not hole.closed:` espera mientras no está cerrado. Con una espera debajo, cuando el bucle acaba ya podemos dar el paso.

Y si lanzamos el hechizo *osto* junto al agujero, lo mantiene cerrado durante un rato.

---
## Pruébalo

Vamos a caminar dos pasos por el pasillo, justo hasta el borde del agujero del siguiente nivel, y mirar si está cerrado.

```python try
wizard.move_right(2)
print(hole.closed)
```
