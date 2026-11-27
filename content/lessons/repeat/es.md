# Repetir

Hacer las mismas instrucciones muchas veces significa tener que escribirlas una y otra vez, ¡y eso es mucho trabajo! Podemos decirle al ordenador que las repita por nosotros.

Los programadores llaman a esto un bucle. Escribimos `for vuelta in range(3):` y, metidas debajo con cuatro espacios, las líneas que queremos ejecutar tres veces.

---
## Las tres puertas

Mira las tres puertas que hay por el pasillo, una tras otra. Son exactamente iguales.

Para pasarlas, tendrías que escribir exactamente las mismas líneas para abrir una puerta y atravesarla, tres veces seguidas. ¡Un bucle hace eso por nosotros! La palabra `vuelta` es solo una variable con la que el bucle cuenta, y las líneas de dentro ni siquiera tienen que usarla.

---
## Pruébalo

Vamos a hacer un bucle para ver cómo cuenta.

Al igual que los números de una casilla, el bucle empieza a contar desde 0. ¡Las instrucciones de dentro se ejecutarán tres veces, y el ordenador imprimirá 0, 1 y 2!

```python try
for vuelta in range(3):
    print(vuelta)
```
