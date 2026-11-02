# Llaves y puertas

Una puerta es un objeto y tiene su propio método: `door.open()`.

Pero una puerta solo se abre para {un mago|una maga} que esté justo a su lado. ¡Y si la puerta está cerrada con llave, solo se abrirá cuando lleves su llave encima!

---
## Cosas ocultas

A veces no puedes ver una cosa en el suelo, pero para el programa está ahí de todos modos.

Tu método `find_nearest` la encuentra dondequiera que esté, y `reveal` la muestra a través de lo que sea que la esconda, como ya has aprendido.

---
## Pruébalo

La llave de la puerta de enfrente cayó bajo la gran estantería hace mucho tiempo, y nadie la ha visto desde entonces.

¡Vamos a encontrarla y a hacer que brille!

```python try
key = wizard.find_nearest("key")
key.reveal()
```
