// Kydux's mark (D193): a pointed hat and a wand, in ink and gold, drawn as an inline SVG
// beside the name in the header; app/public/favicon.svg is the same drawing.

const SVG = 'http://www.w3.org/2000/svg';
const INK = '#2b2533';
const GOLD = '#d49b2a';

/** The shapes of the mark, in a 32 by 32 box: each its tag and its attributes. */
export const MARK_SHAPES: [string, Record<string, string>][] = [
  ['path', { d: 'M6.5 24.5 L14.6 3.2 Q15.6 1.6 16.6 3.4 L21.5 24.5 Z', fill: INK }],
  ['path', { d: 'M7.6 20.6 L20.6 20.6 L21.3 23.6 L6.7 23.6 Z', fill: GOLD }],
  ['ellipse', { cx: '14', cy: '25.4', rx: '12.5', ry: '3.2', fill: INK }],
  ['path', { d: 'M22.4 30 L29.2 15.6', stroke: INK, 'stroke-width': '2.4', 'stroke-linecap': 'round' }],
  ['path', { d: 'M29.6 9.2 L30.6 12.4 L33.8 13.4 L30.6 14.4 L29.6 17.6 L28.6 14.4 L25.4 13.4 L28.6 12.4 Z', fill: GOLD }],
];

/** The mark, `size` pixels square, hidden from a screen reader: the name beside it says it. */
export function markSvg(size = 28): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 34 32');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('class', 'mark');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attributes] of MARK_SHAPES) {
    const shape = document.createElementNS(SVG, tag);
    for (const [name, value] of Object.entries(attributes)) shape.setAttribute(name, value);
    svg.append(shape);
  }
  return svg;
}
