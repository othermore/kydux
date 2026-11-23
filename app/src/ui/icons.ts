// The small drawings a button shows in place of words, drawn as inline SVG in the
// colour of the button's text. A button that shows one says what it does in its
// label and its title.

const SVG = 'http://www.w3.org/2000/svg';

/** The shapes of the pencil, in a 24 by 24 box: its body with its point, and the
 * line where the wood begins. */
const PENCIL_PATHS = ['M16 3.5 L20.5 8 L8.5 20 L3 21 L4 15.5 Z', 'M13.4 6.1 L17.9 10.6'];

/** The shapes of the gear, in a 24 by 24 box: its eight teeth and its hub. */
const GEAR_PATHS = [
  'M10.2 5.2 L10.6 2.5 L13.4 2.5 L13.8 5.2 L15.5 5.9 L17.7 4.3 L19.7 6.3 L18.1 8.5 L18.8 10.2 L21.5 10.6 L21.5 13.4 L18.8 13.8 L18.1 15.5 L19.7 17.7 L17.7 19.7 L15.5 18.1 L13.8 18.8 L13.4 21.5 L10.6 21.5 L10.2 18.8 L8.5 18.1 L6.3 19.7 L4.3 17.7 L5.9 15.5 L5.2 13.8 L2.5 13.4 L2.5 10.6 L5.2 10.2 L5.9 8.5 L4.3 6.3 L6.3 4.3 L8.5 5.9 Z',
  'M15.2 12 A3.2 3.2 0 1 1 8.8 12 A3.2 3.2 0 1 1 15.2 12 Z',
];

function icon(paths: string[], size: number): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  for (const d of paths) {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

/** A pencil, `size` pixels square, hidden from a screen reader. */
export function pencilIcon(size = 22): SVGSVGElement {
  return icon(PENCIL_PATHS, size);
}

/** A gear, `size` pixels square, hidden from a screen reader. */
export function gearIcon(size = 26): SVGSVGElement {
  return icon(GEAR_PATHS, size);
}
