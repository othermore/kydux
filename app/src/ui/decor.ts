// What decorates the start screen and the welcome page (D294): the school's people
// painted whole, head to feet, each in the colours the story first gives them, and, on
// the start screen, a painting of Arvelia on its hill and the village by the lake at
// dusk, fixed behind the page, with the people standing in two groups at the window's
// bottom corners, both groups looking at the page. All of it is decoration: it says
// nothing, takes no click and is hidden from a screen reader. The pictures are in
// app/public/decor/, with their origin.

import { element } from './dom';

function picture(name: string): string {
  return `${import.meta.env.BASE_URL}decor/${name}.webp`;
}

/** One of the school's people painted whole, looking to the left as it is painted, or
 * to the right when mirrored. */
export function figure(who: string, mirrored = false): HTMLImageElement {
  const shown = element('img', {
    className: mirrored ? 'figure mirrored' : 'figure',
    src: picture(who),
    alt: '',
    draggable: false,
  });
  shown.dataset.who = who;
  return shown;
}

/** Some of the school's people standing together, from the back of the group to its
 * front, each placed by the page's styles. */
export function group(name: string, people: string[], mirrored = false): HTMLElement {
  const node = element(
    'div',
    { className: `figures ${name}` },
    people.map((who) => figure(who, mirrored)),
  );
  node.setAttribute('aria-hidden', 'true');
  return node;
}

/** The two groups at the start screen's corners, from the back of each to its front. */
const LEFT = ['eldra', 'orla', 'ilda', 'nuri', 'teku', 'bimo'];
const RIGHT = ['baro', 'dask', 'wenna', 'rinlo', 'zarek'];

/** The start screen's backdrop: the painting behind the page and the two groups. */
export function backdrop(): HTMLElement {
  const painting = element('img', { className: 'backdrop-painting', src: picture('backdrop'), alt: '' });
  const node = element('div', { className: 'backdrop' }, [
    painting,
    group('backdrop-left', LEFT, true),
    group('backdrop-right', RIGHT),
  ]);
  node.setAttribute('aria-hidden', 'true');
  return node;
}
