# Encontrar cosas

Algunos métodos hacen algo en el mundo, como moverse o recoger cosas. Otros te devuelven algo, ¡un valor!

Por ejemplo, `wizard.find_nearest("book")` te devuelve el libro más cercano, incluso si está muy lejos.

---
## Si no lo guardas, se pierde

Una línea que solo sea `wizard.find_nearest("book")` encuentra el libro y lo olvida al instante: el programa no lo ha guardado en ninguna variable, y en la línea siguiente ya no puede usarlo.

Para guardarlo, ponemos delante una variable y `=`: `tesoro = wizard.find_nearest("book")`. Puedes darle el nombre que quieras. Yo, por ejemplo, la llamo `tesoro` porque, para una bibliotecaria, ¡cada libro es un tesoro!

---
## La palabra del juego y la variable

En esa línea, una palabra es del juego y la otra no. `"book"`, entre comillas, es la palabra del juego: dice qué tipo de cosa buscar, y debe escribirse exactamente así, con sus comillas.

En cambio, `tesoro` es la variable, y su nombre lo elige quien escribe el programa: `libro_viejo` o `mi_hallazgo` servirían igual de bien. A partir de esa línea, el libro está en esa variable y podemos usarla en otros sitios.

---
## Los métodos de lo que encuentras

Cuando usamos `find_nearest` y guardamos en una variable lo que encuentra, lo que se encontró es un objeto y, al igual que la puerta, tiene sus propios métodos. Por ejemplo, `tesoro.reveal()` hace que brille, para que se vea dondequiera que esté.

La variable va antes del punto, exactamente igual que `door` en `door.open()`. Por eso no podemos escribir `wizard.reveal(tesoro)`: `reveal` es el método de la cosa, no de tu {mago|maga}.

---
## Pruébalo

El libro más cercano es este del suelo. Ejecuta el código para ver cómo el programa imprime `<book at 3, 15>`. Esta es la forma que tiene el juego de escribir una cosa: su tipo y la casilla donde está (ya aprenderéis a leer esos dos números).

Ahora, cambia el nombre de la variable en ambas líneas por uno tuyo y vuelve a ejecutarlo. ¡Encuentra el mismo libro!

```python try rename
tesoro = wizard.find_nearest("book")
print(tesoro)
```
