# Para cada una

Si tenemos una lista de escobas, ¿cómo las usamos? Podemos escribir `for escoba in escobas:` para ejecutar las líneas metidas debajo una vez por cada elemento de la lista. ¡En cada vuelta, `escoba` es la siguiente!

Es exactamente el bucle `for` que ya conoces, pero recorriendo cosas en vez de contar números. Las líneas de dentro, metidas con cuatro espacios, pueden usar `escoba` para hacer algo con ella. Por ejemplo, si estás debajo de una escoba colgada, `escoba.untie()` desata su nudo.

```python try
nombres = ["Teku", "Nuri", "Bimo"]
for nombre in nombres:
    print(nombre)
```

---
## Por su índice

También podemos hacer el mismo bucle sobre los índices de la lista: `for i in range(len(escobas)):`. Aquí la `i` es el índice que cuenta las vueltas, desde el 0, como hace `range`. Dentro del bucle usamos `escobas[i]` para conseguir la escoba de esa vuelta.

¿Cuándo es útil cada forma? La primera es muy cómoda para hacer algo con cada elemento. La segunda viene bien cuando el número de la vuelta también importa.

```python try
nombres = ["Teku", "Nuri", "Bimo"]
for i in range(len(nombres)):
    print(i, nombres[i])
```
