# Cosas que llevar

Las cosas son objetos, al igual que los personajes, {tu mago|tu maga} entre ellos. Cada cosa tiene el nombre por el que el código la conoce, como `key` o `book`.

¡Tu personaje puede recoger cosas! El método `wizard.pick_up()` recoge una cosa, pero la cosa debe estar en tu casilla o justo a tu lado.

---
## Qué cosa recoger

Cuando hay varias cosas cerca de ti, debes decirle al ordenador exactamente cuál quieres. Haces esto dando el nombre de la cosa como argumento, como `wizard.pick_up(key)`.

He dejado mi varita de repuesto sobre una piedra plana, al otro lado de la verja, para que la recojas. ¡Solo es prestada, así que tendremos que devolverla algún día!

---
## Pruébalo

Vamos a caminar y recoger la varita. ¡Primero nos movemos, y luego usamos el método para recogerla!

```python try
wizard.move_right(3)
wizard.pick_up()
```
