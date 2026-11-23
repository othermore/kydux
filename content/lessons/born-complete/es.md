# Nacer completo

Dar los datos uno a uno, después de hacer el objeto, es fácil pero inseguro. Debemos escribir en el libro una única instrucción, una línea, con la que conjuramos al familiar. Lo demás tendrá que estar en la descripción del familiar.

Una clase, la descripción, puede asignar los atributos del objeto, para que al conjurarlo ya los tenga.

---
## `__init__` y `self`

Eso se hace con un método escrito dentro de la clase, con un nombre que Python conoce: `__init__`, con dos guiones bajos a cada lado. Es el método que se usa cuando se conjura un objeto de la clase: Python lo ejecuta él solo cada vez.

Su primer argumento es siempre `self`: el objeto que está naciendo. Lo que se guarda en `self.` se queda en el objeto.

```python
class Crow:
    def __init__(self, name, color):
        self.name = name
        self.color = color
```

---
## Hacer el objeto

Ahora el objeto se hace dándole sus datos entre los paréntesis: `Crow("Vesso", "black")`. Esos son los datos que recibe la función `__init__`, que se encarga de asignarlos al objeto.

`"Vesso"` va a `name`, y `"black"`, a `color`. No hay que poner nada en la llamada para `self`, ese lo pone Python.

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
