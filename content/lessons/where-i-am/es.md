# Dónde estoy

Ya estamos dentro del túnel encantado. ¡Aquí no se ve a nadie, ni en la escena ni en el plano! Pero un programa puede preguntar dónde está de todos modos.

Tu {mago|maga} sabe perfectamente en qué casilla está. Para preguntarlo, usamos `wizard.position`. Es un atributo que guarda los dos números juntos, como `(15, 3)`. ¡Una cosa también sabe su casilla, como `key.position`!

---
## Por qué preguntar

Un programa no puede mirar al suelo, y en un lugar oscuro o encantado tampoco hay nada que ver.

La posición le dice al programa exactamente dónde está tu {mago|maga}. ¡Y desde ahí, solo tienes que contar hasta donde quieres llegar!

---
## Pruébalo

Vamos a preguntar en qué casilla estamos exactamente ahora mismo, aquí dentro del túnel.

```python try
print(wizard.position)
```
