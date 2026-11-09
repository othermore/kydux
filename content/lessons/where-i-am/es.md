# Dónde estoy

Aquí no se ve nada, pero eso no nos impide saber dónde estamos. Como tiene el mapa del niño travieso, tu {mago|maga} siempre sabe en qué casilla está. Puedes verlo abriendo el mapa, pero si necesitas verlo dentro del programa, puedes usar `wizard.position`. `position` es un atributo de `wizard`, y guarda dos números juntos, como `(15, 3)`.

También podemos ver la posición de algún objeto o cosa que haya en el escenario. Por ejemplo, si tenemos una llave, `key`, podemos ver su posición usando `key.position`.

```python try
print(wizard.position)
```

---
## Lo que no se ve

A veces no podemos ver algunas cosas en el mapa (quizás hay un encantamiento de ocultación, o quizás son muy pequeñas). Sin embargo, usando el atributo `position`, el programa ve exactamente dónde están las cosas, incluso aunque tú no lo veas en el mapa.

---
## Pruébalo

Vamos a mirar en qué casilla estamos ahora mismo, aquí dentro del túnel.

```python try
print(wizard.position)
```
