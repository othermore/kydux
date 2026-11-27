# Un tipo de cosa

Desde el primer día sabes que en un programa todo es un objeto: tú, una puerta, una escoba. Lo que no te hemos contado es de dónde salen. Todas las puertas se abren y se pueden cerrar con llave; todas las escobas vuelan. Un día alguien describió qué es una puerta, y desde entonces cada puerta sale de esa descripción.

---
## La clase

En Python, la descripción de un tipo de cosa se llama una **clase**. Se escribe con `class`, un nombre que empieza por mayúscula y dos puntos. Debajo, metido hacia dentro, va lo que tiene ese tipo de cosa. Si todavía no tiene nada, se escribe `pass`, que quiere decir «aquí aún no hay nada».

La clase es como el molde de unas galletas: el molde no se come; lo que se come son las galletas que salen de él.

```python
class Crow:
    pass
```

---
## El objeto

Para hacer cosas de una clase, tenemos que construirlas, como conjurar a una criatura. Una cosa hecha con la clase es un **objeto**. Se hace escribiendo el nombre de la clase con paréntesis, y se guarda en una variable, como cualquier valor.

```python try
class Crow:
    pass

uno = Crow()
otro = Crow()
print(uno)
print(otro)
print(uno == otro)
```

Al imprimir un objeto, Python dice que es un `Crow` y añade un número largo, que es su sitio en la memoria. Los dos números son distintos, y la última línea da `False`: de una misma clase han salido dos objetos, y no son el mismo.

---
## Los familiares de primer curso

Las reglas en Arvelia son muy estrictas. Estos son los seis tipos de familiar permitidos para un alumno de primero: el zorro es `Fox`; el cuervo, `Crow`; el murciélago, `Bat`; la liebre, `Hare`; el ratón, `Mouse`, y la rana, `Frog`.

Para los niños de primero tenemos la descripción de un familiar, ya preparada para que sea más fácil describir vuestro familiar. Sirve para cualquier familiar, sea del tipo que sea. Su clase se llama `Familiar`.

---
## Tu clase y el hechizo

Por eso, cuando crees tu clase, la primera línea lleva además `(Familiar)`, así: `class Fox(Familiar):`. Con eso dices que tu zorro es un familiar de Arvelia. Lo que hay detrás de esos paréntesis te lo contaré más adelante.

Una vez tienes tu descripción escrita, el hechizo que llama al círculo lo que describes es *minka*: `wizard.cast("minka", ...)`, con el objeto que quieres llamar.
