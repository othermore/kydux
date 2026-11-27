# Un nombre para un valor

Un programa puede guardar un valor y darle un nombre. ¡Pero primero vamos a ver cómo se muestra un valor! Para verlo, usamos `print`. Es la forma que tiene Python de mostrar un valor, justo debajo del editor donde escribes tu código.

`print` muestra cualquier valor. Muestra un número, como el 7. Muestra una suma: Python la calcula primero y escribe el resultado. Y muestra una cadena, las palabras entre comillas, que aparece sin las comillas. Cada `print` escribe su propia línea. ¡Prueba a cambiar los números o la palabra, y vuelve a ejecutarlo!

```python try
print(7)
print(2 + 3)
print("Hola")
```

---
## Una variable

Para guardar un valor, le damos un nombre, algo que los programadores llaman una variable. Una variable puede guardar cualquier cosa. Por ejemplo, un número o una cadena.

Para crear una variable, la definimos. Eso lo hacemos con `=`: el nombre de la variable a la izquierda y el valor a la derecha, como en `edad = 9` y `nombre = "Marta"`.

Si usamos `print` con una variable, muestra lo que guarda: el 9 o Marta, no la palabra `edad` ni `nombre`. ¡Prueba a cambiar el número y la palabra!

```python try change
edad = 9
nombre = "Marta"
print(edad)
print(nombre)
```

---
## Puede cambiar

¿Por qué se llama variable? Porque lo que guarda puede variar, es decir, cambiar. Si el programa define otra vez la misma variable con otro valor, la variable guarda el nuevo y olvida el anterior.

```python try
edad = 9
print(edad)
edad = 10
print(edad)
```

El programa imprime primero 9 y después 10. Es la misma variable, pero su valor ha cambiado. ¡Prueba a poner otro número en la tercera línea!

---
## El nombre lo eliges tú

El nombre de una variable lo elige quien escribe el programa; a Python le da igual cuál sea, solo le importa que se escriba igual cada vez. Un nombre usa letras, números y la línea baja `_`, sin espacios, y nunca empieza por un número. ¡Un buen nombre dice qué es el valor!

Ejecuta este código. Luego, cambia el nombre en **ambas** líneas por uno tuyo y vuelve a ejecutarlo: imprime lo mismo. Después, cámbialo en una sola línea y mira qué responde el juego. El programa solo conoce un valor por el nombre de la variable donde se guardó.

```python try rename error
caramelos = 12
print(caramelos)
```

---
## Una variable entre los paréntesis

Una variable que guarda un número puede ir en cualquier sitio donde iría un número, ¡también como argumento de un movimiento!

```python
pasos = 2
wizard.move_left(pasos)
```

Con estas dos líneas, tu {mago|maga} camina dos pasos a la izquierda. ¿Para qué sirve? Cuando varios movimientos necesitan el mismo número, el programa dice el número una sola vez. Y si el número debe cambiar algún día, ¡se cambia en un solo lugar! La sala de lectura que tenemos delante es el lugar perfecto para probarlo.
