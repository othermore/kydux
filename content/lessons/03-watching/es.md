# Mirar y esperar

Un objeto también sabe cosas de sí mismo.
Esas cosas son sus **atributos**.

Un atributo no lleva paréntesis, porque no es una acción.
Es algo por lo que puedes preguntar:

```python
print(teacher.facing)
```

Esta línea escribe hacia dónde mira el profesor: `"left"` o `"right"`.

---

## Esperar el momento justo

{El mago|La maga} puede quedarse quiet{o|a} mientras el mundo sigue:

```python
wizard.wait()
```

Un bucle `while` hace algo una y otra vez, mientras algo sea verdad.
Así {el mago|la maga} puede esperar mientras el profesor mire hacia donde está.

---

## Pruébalo

Primero, mira hacia dónde mira el profesor.
Luego espera un tick, y vuelve a mirar.

```python try
print(teacher.facing)
wizard.wait()
print(teacher.facing)
```
