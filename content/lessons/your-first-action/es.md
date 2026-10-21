# Objetos y acciones

En un programa, las cosas de las que habla son **objetos**.
{El mago|La maga} es un objeto.
En el código, su nombre es `wizard`.

Un objeto puede hacer cosas.
Lo que puede hacer son sus **acciones**.

---

## Cómo se escribe una acción

Para que {el mago|la maga} haga una acción, escribe su nombre, un punto y la acción:

```python
wizard.move_right()
```

El punto dice: esta acción es {del mago|de la maga}.
Los paréntesis del final dicen: hazlo ahora.

{El mago|La maga} tiene cuatro formas de andar:
`move_right`, `move_left`, `move_up` y `move_down`.

---

## Una línea, un paso

Cada línea es una instrucción.
Cada una de estas acciones da un paso.
Así que más líneas dan más pasos:

```python
wizard.move_right()
wizard.move_down()
```

Este programa da un paso a la derecha, y luego un paso hacia abajo.

---

## Pruébalo

El próximo pasillo dobla una esquina.
Cuenta las casillas: ¿cuántas a la derecha, y cuántas hacia abajo?

```python try
wizard.move_right()
wizard.move_down()
```
