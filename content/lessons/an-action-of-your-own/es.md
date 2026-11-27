# Una función propia

¿Y si queremos hacer una maniobra especial una y otra vez? Si escribimos `def quick_fly():` y, metidas debajo, unas líneas de código, ¡le damos un nombre a esas líneas! Los programadores lo llaman una función.

```python
def quick_fly():
    wizard.cast("drevo")
    wizard.move_right(2)
    wizard.move_up(2)
    wizard.move_left(2)
    wizard.move_down(2)
    wizard.cast("drevo")

quick_fly()
```

Escribir el nombre con paréntesis, como `quick_fly()`, ejecuta esas líneas donde se escriba y tantas veces como se escriba. Las líneas del `def` no se ejecutan hasta que alguien llama a la función.

---
## Mejor que un bucle

Un bucle repite lo mismo seguido. Una función se usa donde haga falta, ¡incluso con otras cosas en medio!

Además, el programa se lee mucho mejor. En lugar de escribir seis líneas, una línea simplemente dice *vuelo rápido*, así que cualquiera que lea tu código sabe exactamente qué estás haciendo.

```python try
def saludar():
    print("¡Hola!")
    print("¡Bienvenidos a Arvelia!")

saludar()
print("Y ahora...")
saludar()
```
