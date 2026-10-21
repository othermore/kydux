# Tu primer hechizo

Un hechizo es una palabra mágica.
Si la dice cualquiera, es solo una palabra.
Lanzada con una varita, hace algo.

Cada hechizo hace una cosa, justo donde está {el mago|la maga}.

---

## El hechizo zelim

Algunas puertas de Arvelia están selladas.
Brilla una runa en ellas, y ninguna mano las puede abrir.

El hechizo `zelim` rompe un sello.
Funciona con una puerta sellada que esté justo al lado {del mago|de la maga}.

---

## Lanzar un hechizo

```python
wizard.cast("zelim")
```

`cast` es la acción de la varita.
{El mago|La maga} solo puede hacerla mientras lleva la varita.
Sin la varita, no conoce esta acción.

El nombre del hechizo es una cadena, entre comillas, como las palabras que dice.

---

## Pruébalo

En la sala siguiente, la varita está en el suelo, y espera una puerta sellada.
Coge primero la varita.
Luego acércate hasta el lado de la puerta, y lanza el hechizo.

```python try
wizard.move_right()
wizard.pick_up()
wizard.cast("zelim")
```
