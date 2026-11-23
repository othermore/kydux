# Lo que hereda

Esta es la descripción de tu última prueba. Mira su primera línea. Esto lo has escrito desde el primer día, y no te he dicho qué es.

```python
{familiar_source}

{familiar_var} = {familiar_class}("{familiar}", "{familiar_color}")
```

---
## La clase `Familiar`

En la primera línea dices que un `{familiar_class}` es un `Familiar`. `Familiar` es otra clase, y está escrita en este libro desde mucho antes de que tú llegaras: describe lo que tiene todo familiar de Arvelia.

Una clase que dice que es de otra tiene todo lo que tiene la otra, sin escribirlo. Eso se llama **heredar**.

---
## Lo que hereda tu familiar

Tu familiar sabe dónde está, `position`, y sabe andar, con `move_up`, `move_down`, `move_left` y `move_right`. Son los mismos nombres que usa tu `wizard`, y hacen lo mismo.

En cuanto salga del círculo, estará en tus programas con su nombre.

---
## Una clase vacía

Aquí hay un `Familiar` pequeño, escrito a la vista. La clase `Crow` está vacía, y aun así Vesso nace con su nombre: hereda el `__init__` de `Familiar`.

```python try
class Familiar:
    def __init__(self, name):
        self.name = name

class Crow(Familiar):
    pass

vesso = Crow("Vesso")
print(vesso.name)
```
