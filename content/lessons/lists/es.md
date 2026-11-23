# Las listas

Tenemos que revisar todas las escobas, pero ¿cuántas son? Y ¿cómo las encontramos? Hay una manera de encontrar todas las cosas del mismo tipo. Os la enseñaré.

A veces queremos que una variable guarde varios valores a la vez, todos en orden. Los ponemos entre corchetes y los separamos por comas, así: `nombres = ["Teku", "Nuri", "Bimo"]`. Si le dices al ordenador que imprima con `print(nombres)`, ¡enseña todo el grupo!

Los programadores llaman a esto una lista.

---
## Encontrarlas todas

¿Cómo sabemos cuántos valores tiene una lista? `len(nombres)` dice el número.

Igual que `find_nearest` nos daba una sola cosa, `wizard.find_all("broom")` nos da la lista de todas las escobas que puedes encontrar desde donde estás, la más cercana primero. ¡Recuerda que junto a la pared encontrarás las colgadas, y en la paja las tiradas! Cada valor de esa lista es un objeto escoba, con sus propios atributos como su `position`.

```python try
nombres = ["Teku", "Nuri", "Bimo"]
print(nombres)
print(len(nombres))
```

---
## Uno de la lista

¿Y si queremos solo uno de los valores de la lista? Cada valor de una lista es un elemento.

Podemos pedir un elemento de la lista por su lugar, que los programadores llaman un índice. `nombres[0]` es el primero, ya que una lista cuenta desde el 0, igual que las casillas. ¡El tercero sería `nombres[2]`!

Pedir uno que la lista no tiene, como `nombres[3]` en una lista de tres, es un error, y el juego te lo dirá: «La lista no tiene tantos: tiene 3, y pediste el 4.º».

```python try
nombres = ["Teku", "Nuri", "Bimo"]
print(nombres[0])
print(nombres[2])
```
