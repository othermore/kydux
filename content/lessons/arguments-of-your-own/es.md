# Argumentos propios

Entre los paréntesis del `def` van nombres, que son los argumentos de la función. Al llamarla le damos valores en el mismo orden, ¡exactamente como `move_right(3)` recibe su 3!

Dentro de la función, esos nombres valen los valores que les dimos. Por eso, ¡la misma función sirve para cosas parecidas pero no iguales, como pasar por dos aros a distancias distintas!

```python try
def saludar(nombre):
    print("Hola", nombre)

saludar("Teku")
saludar("Nuri")
```
