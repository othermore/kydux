# Un si dentro del bucle

Dentro de un `for` puede ir un `if`, para que cada vuelta haga una cosa u otra según el valor de esa vuelta. Las líneas del `if` van metidas ocho espacios: cuatro por el `for` y cuatro por el `if`.

El atributo `knotted` de una escoba es `True` mientras su hilo negro sigue anudado. Desatar una escoba sin nudo es un error que detiene el programa, ¡así que nuestro programa debe mirar `knotted` antes de desatar!

```python try
nombres = ["Teku", "Nuri", "Bimo"]
for nombre in nombres:
    if nombre == "Bimo":
        print(nombre, "es un gato")
```
