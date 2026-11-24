// The pencil a painted scene's grid is drawn with (D76, D337): the common one, a
// dark brown seen on grass, sand and pale stone, or a scene's own, where the floor
// hides it. Kept apart from painted.ts so that it is tested without Phaser.

/** A scene's own pencil, from its art.json: its colour, `#rrggbb`, and how many
 * times the common pencil's strength its lines are drawn at; either may be left to
 * the common one. */
export interface Pencil {
  colour?: string;
  strength?: number;
}

/** The common pencil's colour. */
const COMMON = 0x3b2f1e;
/** The grid's breath with the common pencil: the layer's alpha at its faintest and
 * at its strongest. */
const BREATH: [number, number] = [0.18, 0.32];

/** The colour a scene's grid is drawn in and its breath, the faintest and the
 * strongest alpha of its layer: the common pencil's, or the scene's own colour and
 * the common breath times its strength, never past opaque. */
export function pencilOf(pencil: Pencil = {}): { colour: number; breath: [number, number] } {
  const strength = pencil.strength ?? 1;
  return {
    colour: pencil.colour ? Number.parseInt(pencil.colour.slice(1), 16) : COMMON,
    breath: [Math.min(1, BREATH[0] * strength), Math.min(1, BREATH[1] * strength)],
  };
}
