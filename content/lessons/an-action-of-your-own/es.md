# Una acción propia

¿Y si queremos hacer una maniobra especial una y otra vez? Si escribimos `def two_rings():` y, metidas debajo, unas líneas de código, ¡le damos un nombre a esas líneas! Los programadores lo llaman una función.

Escribir el nombre con paréntesis, como `two_rings()`, las ejecuta donde se escriba y tantas veces como se escriba. Las líneas del `def` no se ejecutan hasta que alguien llama a la función.

---
## Mejor que un bucle

Un bucle repite lo mismo seguido. Una función se usa donde haga falta, ¡incluso con otras cosas en medio!

Además, el programa se lee mucho mejor. En lugar de escribir cuatro movimientos, una línea simplemente dice *dos aros*, así que cualquiera que lea tu código sabe exactamente qué estás haciendo.

```python try
def saludar():
    print("¡Hola!")
    print("¡Bienvenidos a Arvelia!")

saludar()
print("Y ahora...")
saludar()
```
