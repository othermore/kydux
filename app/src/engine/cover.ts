// How much of a figure the painted images in front of it cover, for the
// wizard's outline (silhouette.ts): counted on the figure's own pixels, one in
// every STEP×STEP, against the solid pixels of those images where they fall.

/** How much of the figure must be covered for its outline to show. */
export const HIDDEN_SHARE = 0.25;
/** One pixel counted in every STEP×STEP of the figure's. */
const STEP = 2;

/** A texture's pixels, row by row, 1 where solid and 0 where not. */
export interface Solid {
  width: number;
  solid: Uint8Array;
}

/** What is read of a sprite or an image: where it stands, and its frame. */
export interface Placed {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  displayOriginX: number;
  displayOriginY: number;
  texture: { key: string };
  frame: { cutX: number; cutY: number; cutWidth: number; cutHeight: number };
}

function boundsOf(placed: Placed): { left: number; top: number; right: number; bottom: number } {
  const left = placed.x - placed.displayOriginX * placed.scaleX;
  const top = placed.y - placed.displayOriginY * placed.scaleY;
  return {
    left,
    top,
    right: left + placed.frame.cutWidth * placed.scaleX,
    bottom: top + placed.frame.cutHeight * placed.scaleY,
  };
}

function solidAt(placed: Placed, solid: Solid, x: number, y: number): boolean {
  const frame = placed.frame;
  const ix = Math.floor((x - placed.x) / placed.scaleX + placed.displayOriginX);
  const iy = Math.floor((y - placed.y) / placed.scaleY + placed.displayOriginY);
  if (ix < 0 || iy < 0 || ix >= frame.cutWidth || iy >= frame.cutHeight) return false;
  return solid.solid[(frame.cutY + iy) * solid.width + frame.cutX + ix] === 1;
}

/** The covered share of a figure, from 0 to 1: of its solid pixels counted, those
 * on which a solid pixel of one of the images in front falls. */
export function coveredShare(figure: Placed, front: Placed[], solidOf: (key: string) => Solid | null): number {
  const sheet = solidOf(figure.texture.key);
  if (!sheet || front.length === 0) return 0;
  const own = boundsOf(figure);
  // Only the images whose bounds meet the figure's are looked at.
  const near = front.flatMap((image) => {
    const bounds = boundsOf(image);
    const meets =
      bounds.right > own.left && bounds.left < own.right && bounds.bottom > own.top && bounds.top < own.bottom;
    const solid = meets ? solidOf(image.texture.key) : null;
    return solid ? [{ image, solid }] : [];
  });
  if (near.length === 0) return 0;
  const frame = figure.frame;
  let counted = 0;
  let covered = 0;
  for (let fy = 0; fy < frame.cutHeight; fy += STEP) {
    for (let fx = 0; fx < frame.cutWidth; fx += STEP) {
      if (!sheet.solid[(frame.cutY + fy) * sheet.width + frame.cutX + fx]) continue;
      counted += 1;
      const [x, y] = [own.left + fx * figure.scaleX, own.top + fy * figure.scaleY];
      if (near.some(({ image, solid }) => solidAt(image, solid, x, y))) covered += 1;
    }
  }
  return counted === 0 ? 0 : covered / counted;
}
