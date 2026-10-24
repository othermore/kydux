# Repetir

Caminar por estos pasillos tan largos lleva muchos pasos. Hacer las mismas instrucciones muchas veces significa tener que escribirlas un montón de veces, ¡y eso es mucho trabajo!

Podemos pedirle al ordenador que repita las instrucciones una y otra vez por nosotros. Los programadores llaman a esto un bucle.

---
## Hacerlo otra vez

Escribimos un bucle con `for`. Escribimos `for step in range(8):` y, metidas debajo, las líneas a repetir, ocho veces.

La palabra `step` es solo una variable con la que el bucle cuenta. El ordenador ejecutará esas líneas con espacios una y otra vez hasta que termine de contar.

---
## Pruébalo

Vamos a hacer un bucle para caminar sin tener que escribir tantas líneas. ¡Las instrucciones de dentro ocurrirán tres veces seguidas!

```python try
for step in range(3):
    wizard.move_up()
    wizard.move_right()
```
