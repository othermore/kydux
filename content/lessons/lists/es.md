# Las listas

A veces queremos que una variable guarde varios valores a la vez, todos en orden. Los ponemos entre corchetes y los separamos por comas, así: `nombres = ["Teku", "Nuri", "Bimo"]`. Si le dices al ordenador que imprima con `print(nombres)`, ¡enseña todo el grupo!

Los programadores llaman a esto una lista.

---
## Encontrarlas todas

¿Cómo sabemos cuántos valores tiene una lista? `len(nombres)` dice el número.

Igual que `find_nearest` nos daba una sola cosa, `wizard.find_all("broom")` nos da la lista de todas las escobas del sitio, la más cercana primero. ¡El ordenador nos las enseña incluso donde la paja las tapa! Cada valor de esa lista es un objeto escoba, con sus propios atributos como su `position`.

```python try
nombres = ["Teku", "Nuri", "Bimo"]
print(nombres)
print(len(nombres))
```
