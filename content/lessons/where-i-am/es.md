# Dónde estoy

Aquí no se ve nada, pero eso no nos impide saber dónde estamos.

Un objeto tiene métodos, y también sabe cosas sobre sí mismo, algo que los programadores llaman atributos. Por ejemplo, tu {mago|maga} sabe qué lleva encima. Una puerta sabe si está cerrada con llave o no.

---
## Mirar un atributo

Para mirar el atributo de un objeto, escribimos un punto detrás de su variable, pero sin paréntesis. ¡Dejamos los paréntesis fuera porque no estamos usando ningún método!

Simplemente escribimos `door.locked` o `wizard.items`.

---
## La posición

Como tiene el mapa del niño travieso, tu {mago|maga} siempre sabe en qué casilla está. Puedes verlo abriendo el mapa, pero si necesitas verlo dentro del programa, puedes usar `wizard.position`. `position` es un atributo de `wizard`, y guarda dos números juntos, como `(15, 3)`.

También podemos ver la posición de algún objeto o cosa que haya en el escenario. Por ejemplo, si tenemos una llave, `mi_llave`, podemos ver su posición usando `mi_llave.position`.

```python try
print(wizard.position)
```

---
## Lo que no se ve

A veces no podemos ver algunas cosas en el mapa (quizás hay un encantamiento de ocultación, o quizás son muy pequeñas). Sin embargo, usando el atributo `position`, el programa ve exactamente dónde están las cosas, incluso aunque tú no lo veas en el mapa.
