// The dark of a passage a figure walks into (the owner's choice, 2026-10-28): the
// entrance's arches open onto dark corridors, and a figure going in is drawn
// darker the deeper it goes, its head darker than its feet, until it is hardly
// seen. Kept apart from scene.ts so that it is tested without Phaser.

/** A scene's dark passages: the columns each spans, first and last; the row a
 * figure's feet are on, in cells down the scene, where its dark begins, and the row
 * where it is darkest; and how dark it is there, from 0 to 1. */
export type Dark = { columns: [number, number]; from: number; to: number; most: number }[];

/** How much darker a figure's head is than its feet, as a part of their dark: the
 * passage's dark comes down from its vault. */
const HEAD = 0.5;

/** How dark a figure is drawn at its head and at its feet, its feet's point at
 * (x, y) in cells: none outside every passage. */
export function shadeAt(dark: Dark | undefined, [x, y]: [number, number]): [number, number] {
  const passage = dark?.find(({ columns: [left, right] }) => x >= left && x < right + 1);
  if (!passage) return [0, 0];
  const { from, to, most } = passage;
  const feet = most * Math.min(1, Math.max(0, (from - y) / (from - to)));
  return [Math.min(most, feet * (1 + HEAD)), feet];
}

/** The tint that draws a figure `shade` darker, from 0 (as it is) to 1 (black). */
export function tintOf(shade: number): number {
  const level = Math.round(255 * (1 - shade));
  return (level << 16) | (level << 8) | level;
}
