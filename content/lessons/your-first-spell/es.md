# Tu primer hechizo

Los hechizos se lanzan con una varita, y cuando se lanzan, ¡hacen algo! Un hechizo es una palabra de magia, una cadena, y si la dices sin una varita, es solo una palabra normal.

Lanzar un hechizo es una acción que la varita le da a {tu mago|tu maga}, `wizard.cast("zelim")`. ¡Sin la varita, tu personaje no puede lanzar hechizos!

---
## Qué hace un hechizo

Lo que hace un hechizo depende de dónde estés y de lo que tengas cerca, y puede que no haga nada en absoluto.

Nuestro primer hechizo es *zelim*. Este hechizo rompe el sello de una puerta que esté justo a tu lado. Puedes saber cuándo una puerta está sellada porque muestra una runa brillante.

---
## Pruébalo

¡Vamos a lanzar tu primer hechizo! Nos moveremos cerca de una puerta sellada y lanzaremos *zelim* para romper su sello.

```python try
wizard.move_left(2)
wizard.move_up(3)
wizard.cast("zelim")
```
