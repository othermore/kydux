# Encontrar cosas

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

---
## Hacer que brille

Para ver qué cosa guarda la variable y dónde está, `book.reveal()` hace que brille donde se encuentra. Brilla incluso a través de lo que la esconda, y a partir de entonces sabes adónde caminar.

---
## Pruébalo

Nuestra fantasma, Eldra, perdió uno de sus libros hace mucho tiempo. Está en un rincón de la biblioteca, junto a la pila de libros viejos, medio escondido detrás de ella. Un programa lo encuentra dondequiera que esté, ¡así que vamos a encontrarlo y a hacer que brille!

```python try
book = wizard.find_nearest("book")
book.reveal()
```
