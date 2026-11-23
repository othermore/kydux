# Lo que hereda

Mira esta descripción de {familiar_a_kind}. En la primera línea hay algo de lo que no te he contado mucho todavía: `Familiar`.

```python
{familiar_source}

{familiar_var} = {familiar_class}("{familiar}", "{familiar_color}")
```

---
## La clase `Familiar`

Con la primera línea dices que un `{familiar_class}` es un `Familiar`. `Familiar` es otra clase, y está escrita en este libro desde mucho antes de que tú llegaras: describe lo imprescindible para todo familiar de Arvelia, y así os ponemos las cosas un poco más fáciles a los de primer curso.

Una clase que dice que es de otra tiene todo lo que tiene la otra, sin escribirlo. Eso se llama **heredar**.

---
## Lo que hereda tu familiar

Tu familiar sabe dónde está, `position`, y sabe andar, con `move_up`, `move_down`, `move_left` y `move_right`. Son los mismos nombres que usa tu `wizard`, y hacen lo mismo. También sabe recoger lo que tiene debajo, con `pick_up`.

En cuanto salga del círculo, tu familiar pasará a ser un objeto que estará en tus programas con su nombre, igual que está `wizard`.

---
## Una clase vacía

Aquí hay dos clases que no son de familiares. `Person` describe a una persona, que tiene un nombre. `Student`, la de un alumno, dice que es una `Person`, y está vacía.

Aun así, Tavi se crea con su nombre: `Student` hereda el `__init__` de `Person`.

```python try
class Person:
    def __init__(self, name):
        self.name = name

class Student(Person):
    pass

tavi = Student("Tavi")
print(tavi.name)
```
