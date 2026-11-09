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
## Encontrar cosas

Algunos métodos hacen algo en el mundo, como moverse o recoger cosas. ¡Otros te devuelven algo, como un valor!

El método `wizard.find_nearest("book")` te da el libro más cercano. Te da la cosa en sí, incluso si está muy lejos.

---
## Una variable

Para guardar un valor, le damos un nombre, algo que los programadores llaman una variable. Una variable puede guardar un número o una cadena.

Se escribe con `=`: el nombre a la izquierda, el valor a la derecha, como en `edad = 9` y `nombre = "Marta"`. El signo `=` simplemente pone el valor en una variable para que podamos usarlo. ¡No comprueba si son iguales!

Si usamos `print` con el nombre de una variable, muestra lo que guarda: el 9 o Marta, no la palabra `edad` ni `nombre`. ¡Prueba a cambiar el número y la palabra!

```python try
edad = 9
nombre = "Marta"
print(edad)
print(nombre)
```

---
## Sumar variables

Una variable que guarda un número se puede usar igual que ese número. Por eso podemos sumar dos variables y guardar la suma en una tercera: `total = a + b`. Si `a` guarda 4 y `b` guarda 3, `total` guarda 7, y `print(total)` lo muestra.

¡Prueba a cambiar `a` y `b`, y prueba también `a - b` en lugar de `a + b`!

```python try
a = 4
b = 3
total = a + b
print(total)
```

---
## Guardar lo que devuelve un método

Al escribir `book = wizard.find_nearest("book")`, la variable `book` guarda el libro que devuelve el método, y el programa puede usarlo después.

Si no hay ningún libro, el valor es `None`, que es la palabra de Python para decir nada.

Para ver qué cosa guarda la variable y dónde está, `book.reveal()` hace que brille donde se encuentra. Brilla incluso a través de lo que la esconda, y a partir de entonces sabes adónde caminar.

---
## Pruébalo

¡La puerta que os acabo de abrir es la más cercana, así que es perfecta para comprobarlo! La primera línea encuentra la puerta más cercana y la guarda en la variable `door`, y la segunda línea mira su atributo `locked` y lo imprime. Como os acabo de abrir esta puerta, no está cerrada con llave, así que la respuesta que imprimirá será `False`.

```python try
door = wizard.find_nearest("door")
print(door.locked)
```
