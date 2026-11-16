# Para cada una

Si tenemos una lista de escobas, ¿cómo las usamos? Podemos escribir `for broom in brooms:` para ejecutar las líneas metidas debajo una vez por cada valor de la lista. ¡En cada vuelta, `broom` es la siguiente!

Es exactamente el bucle `for` que ya conoces, pero recorriendo cosas en vez de contar números. Las líneas de dentro, metidas con cuatro espacios, pueden usar `broom` para hacer algo con ella. Por ejemplo, si estás encima, `broom.untie()` desata su nudo.

```python try
nombres = ["Teku", "Nuri", "Bimo"]
for nombre in nombres:
    print(nombre)
```
