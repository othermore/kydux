# Lo que hace

Tu familiar ya sabe cosas: sabe hacer lo que hace todo familiar. Ahora le vas a enseñar una nueva habilidad.

Hasta ahora has usado métodos en los objetos: `wizard.move_up()` usa un método de `wizard`. Hoy vas a escribir tu propio método.

---
## Escribir un método

Un **método** se escribe con `def`, dentro de la clase, y su primer argumento es `self`, como en `__init__`. Aquí `self` es el objeto que recibe la orden.

```python
class Crow:
    def __init__(self, name):
        self.name = name
        self.caws = 0

    def caw(self, times):
        for i in range(times):
            print("¡Grraaak!")
        self.caws = self.caws + times
        print("(y con eso van", self.caws, "graznidos)")
```

Con `times` le decimos el número de graznidos que debe dar. Después dice cuántos lleva.

---
## Usar el método

Se usa con el punto: `vesso.caw(3)`.

Lo que va antes del punto es lo que Python pone en `self`. Por eso entre los paréntesis solo hay una cosa.

---
## Para qué sirve

Sabiendo el nombre del método puedes hacer que tu familiar lo ejecute sin saber cómo está hecho por dentro.

Dentro de un método, `self` puede usar todo lo que tiene el objeto: sus atributos y sus otros métodos, también los que hereda.

---
## Dos órdenes

Vamos a enseñar a Vesso a graznar y a contar sus graznidos. Cada vez que le digas que grazne, dará los graznidos que le pidas y te dirá cuántos lleva.

```python try
class Crow:
    def __init__(self, name):
        self.name = name
        self.caws = 0

    def caw(self, times):
        for i in range(times):
            print("¡Grraaak!")
        self.caws = self.caws + times
        print("(y con eso van", self.caws, "graznidos)")

vesso = Crow("Vesso")
vesso.caw(3)
vesso.caw(2)
```
