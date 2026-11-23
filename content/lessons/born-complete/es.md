# Nacer completo

Dar los datos uno a uno, después de hacer el objeto, es fácil de olvidar, y un familiar a medio hacer no entra en el libro. Una clase puede decir qué hay que darle a un objeto para que nazca completo.

---
## `__init__` y `self`

Eso se hace con una acción escrita dentro de la clase, con un nombre que Python conoce: `__init__`, con dos guiones bajos a cada lado. Python la ejecuta él solo cada vez que nace un objeto de la clase.

Su primer argumento es siempre `self`: el objeto que está naciendo. Lo que se guarda en `self.` se queda en el objeto.

```python
class Crow:
    def __init__(self, name, color):
        self.name = name
        self.color = color
```

---
## Hacer el objeto

Ahora el objeto se hace dándole sus datos entre los paréntesis: `Crow("Vesso", "black")`.

`"Vesso"` va a `name`, y `"black"`, a `color`. A `self` no se le da nada: lo pone Python.

---
## Dos cuervos completos

Aquí nacen dos cuervos, cada uno con sus datos. Cuando lo hayas probado, quita un dato de entre los paréntesis y mira qué dice Python.

```python try
class Crow:
    def __init__(self, name, color):
        self.name = name
        self.color = color

vesso = Crow("Vesso", "black")
dalu = Crow("Dalu", "white")
print(vesso.name, vesso.color)
print(dalu.name, dalu.color)
```
