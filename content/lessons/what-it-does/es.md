# Lo que hace

Tu familiar ya sabe cosas, y sabe hacer lo que hace todo familiar. Ahora va a saber hacer algo suyo. Usas métodos desde el primer día: `wizard.move_up()` usa un método de `wizard`. Hoy vas a escribir uno.

---
## Escribir un método

Un **método** se escribe con `def`, dentro de la clase, y su primer argumento es `self`, como en `__init__`. Aquí `self` es el objeto que recibe la orden.

```python
class Crow:
    def __init__(self, name):
        self.name = name
        self.hops = 0

    def hop(self, times):
        self.hops = self.hops + times
        print(self.name, "ha saltado", self.hops, "veces")
```

---
## Usar el método

Se usa con el punto: `vesso.hop(3)`.

Lo que va antes del punto es lo que Python pone en `self`. Por eso entre los paréntesis solo hay una cosa.

---
## Para qué sirve

Quien sepa el nombre del método puede mandar a tu familiar sin saber cómo está hecho por dentro.

Dentro de un método, `self` puede usar todo lo que tiene el objeto: sus atributos y sus otros métodos, también los que hereda.

---
## Dos órdenes

Aquí Vesso recibe dos órdenes. Después de cada una dice cuántas veces ha saltado ya: tres, y luego cinco.

```python try
class Crow:
    def __init__(self, name):
        self.name = name
        self.hops = 0

    def hop(self, times):
        self.hops = self.hops + times
        print(self.name, "ha saltado", self.hops, "veces")

vesso = Crow("Vesso")
vesso.hop(3)
vesso.hop(2)
```
