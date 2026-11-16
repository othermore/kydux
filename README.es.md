# Kydux

[English version](README.md)

**Kydux es un juego para aprender a programar en Python.** Un joven mago, recién
llegado a un colegio de magia, tiene que encontrar su varita, aprender hechizos,
ganarse una escoba y abrirse paso por los pasillos y pasadizos secretos del
castillo, y cada paso exige un poco de Python de verdad. Cada lección explica una
idea de la programación, y el nivel que la sigue pide al jugador que la use.

Forma parte de la familia de [Kidux](https://kidux.org/es/) y, como Kidux, es
software libre bajo la Licencia Pública General de GNU, versión 3 o posterior.

## Cómo se juega

Kydux funciona en un navegador web. Todavía no hay nada que instalar: por
ahora solo funciona desde este repositorio, como explica
`docs/dev/dev-environment.md`.

La primera vez, el juego se abre en su página de bienvenida. Cuenta qué
es el juego, para quién es y cómo se juega, con imágenes del juego. Su
botón grande, *Empieza a jugar*, empieza el juego. El enlace *Qué es
Kydux*, arriba en cada pantalla, vuelve a abrirla después.

El juego empieza con una historia. Una carta te invita a
Arvelia, un colegio de magia, y viajas hasta su puerta. Después creas tu
personaje. Le pones un nombre, eliges si es una maga o un mago, y escoges
su aspecto. Después, el juego te llama por ese nombre.

A partir de ahí, el juego se abre en su pantalla de inicio. *Continuar* te
lleva a donde lo dejaste. La primera vez, eso es la puerta, donde te
encuentras con un amigo o una amiga que te enseña los primeros pasos. Es
Nuri, una chica, si tu personaje es un mago, y Teku, un chico, si tu
personaje es una maga.

Cada capítulo empieza y acaba con una historia, contada sobre la propia
escena: los personajes caminan y hablan en bocadillos, y un narrador habla
bajo la imagen. *Siguiente*, o la tecla Intro, sigue adelante. Entre las
historias vienen lecciones y niveles. Cada historia, lección y nivel va
numerado dentro de su capítulo: *Capítulo 1 · Historia 1*, *Capítulo 1 ·
Lección 1*, y así. Una lección son
unas pocas páginas cortas, que enseña un personaje de la historia, de pie
junto al texto. Cada página explica una idea, con un ejemplo. En la última página, *Probar* abre el
nivel que viene después, donde escribes tu propio programa. La
mayoría de los niveles son prácticas, una pantalla que resolver. Un
*arreglo* te da un programa que no funciona, para repararlo. Una *mejora*
te da uno que funciona, para hacerlo mejor.

Los niveles de un capítulo ocurren todos en un mismo lugar, una escena:
donde acaba un nivel empieza el siguiente, y el amigo que te enseña está a
tu lado. La escena está pintada, y una fina rejilla a lápiz encima te ayuda
a contar pasos. La escena sigue a tu personaje mientras camina. Los
botones *+* y *−*, o la rueda del ratón, la acercan y la alejan, y puedes
arrastrarla para mirar alrededor; *Buscar a mi maga*, o *a mi mago*, la devuelve a tu
lado.

En un nivel, escribes Python en el editor, a la derecha. *Ejecutar* empieza
el nivel otra vez y hace que tu personaje haga lo que dice tu código, a la
izquierda. Una marca redonda que late en el suelo enseña a dónde debe
llegar tu personaje. Los objetivos, en la esquina, se marcan solos cuando
los cumples. Si algo sale
mal, el juego dice por qué, y *Pista* te da una ayuda. El primer nivel te
enseña cada parte de la pantalla, una a una; el botón *?* lo enseña otra
vez. *Cuaderno* enseña lo que sabe hacer tu personaje, cada cosa con un
ejemplo que se puede pulsar. Cuando ya sabes un hechizo o una contraseña,
su segunda pestaña, *Hechizos y palabras*, los enseña también, con lo que
hace cada uno. *Lección* vuelve a leer la lección del nivel, y *Mapa* abre el mapa
encima del nivel.

Gana el nivel, y el juego te da hasta tres estrellas, y te dice por qué.
Te quedas con las tres si no necesitas pistas, no chocas nunca contra una
pared y cumples el objetivo extra, o ganas al primer intento cuando no lo
hay. Jugar otra vez un nivel nunca te quita estrellas. *Siguiente* te lleva
más allá. El mapa enseña el curso
entero: lo que ya has hecho, lo que está abierto y lo que sigue cerrado.

El juego guarda tu partida en el navegador mientras juegas. Guarda varias
partidas, una por personaje: *Cargar una partida*, en la pantalla de
inicio, las enseña, con dónde está cada una y cuánto se ha jugado.
*Partida nueva* empieza otra vez la historia para un personaje nuevo.
*Exportar* guarda la partida que juegas en un fichero, e *Importar* la
recupera en otro ordenador.

## Lecciones

El curso se cuenta como una historia. Tu personaje, una maga o un mago,
llega a Arvelia, un colegio de magia en un castillo antiguo, y aprende su
magia, que se hace escribiendo Python.

Cada lección explica una idea, empezando por qué es y para qué sirve. Los
niveles que vienen después practican esa idea, y nada que no se haya
explicado todavía.

Hay tres capítulos listos. El primero, *La llegada*, va desde qué es un
programa hasta las acciones, los números, las palabras, las cosas que se
llevan y el primer hechizo. El segundo, *La biblioteca*, trae los nombres
para los valores, lo que saben las cosas, cómo encontrarlas, las llaves y
un hechizo que alcanza. El tercero, *Los pasadizos*, trae lo verdadero y
lo falso, elegir con `if` y `else`, y repetir con `for` y `while`. Los
capítulos siguientes traen las listas, las acciones propias y, al final,
los objetos propios. Llegan de capítulo en capítulo.

## Licencia

El código, los niveles, los textos y los dibujos de Kydux son software libre:
puedes redistribuirlos y modificarlos según los términos de la Licencia Pública
General de GNU, versión 3 o posterior (`LICENSE`).
