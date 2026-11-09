# Lo que saben las cosas

Un objeto tiene métodos. Pero un objeto también sabe cosas sobre sí mismo, algo que los programadores llaman atributos.

Por ejemplo, tu {mago|maga} sabe qué lleva encima. Una puerta sabe si está cerrada con llave o no.

---
## Mirar un atributo

Para mirar el atributo de un objeto, escribimos un punto después de su nombre, pero sin paréntesis. ¡Dejamos los paréntesis fuera porque no estamos usando ningún método!

Simplemente escribimos `door.locked` o `wizard.items`.

---
## Mostrar el valor

Para verlo, usamos `print`. Es la forma que tiene Python de mostrar un valor, justo debajo del editor donde escribes tu código.

`print` muestra cualquier valor, no solo un atributo. Muestra un número, como el 7. Muestra una suma: Python la calcula primero y escribe el resultado. Y muestra una cadena, las palabras entre comillas, que aparece sin las comillas. Cada `print` escribe su propia línea. ¡Prueba a cambiar los números o la palabra, y vuelve a ejecutarlo!

```python try
print(7)
print(2 + 3)
print("Hola")
```

---
## Pruébalo

La puerta que os acabo de abrir es perfecta para comprobarlo. ¡Vamos a mirar su atributo!

```python try
print(door.locked)
```
