import { describe, expect, it } from 'vitest';
import {
  AFTER_BUMP_MS,
  type Box,
  bubbleBelow,
  bubbleBeside,
  bubbleHeld,
  bubbleMiddle,
  bubbleRoom,
  bubbleReach,
  bubbleShift,
  bubbleTip,
  bubbleWrap,
  readingMs,
  readingTicks,
  roomTop,
  settleMs,
  type ThoughtRoom,
  thoughtPlace,
  wordsOver,
} from './bubble';
import { FLY_LIFT, RING_RAISE } from './flight';

const box = (left: number, top: number, right: number, bottom: number): Box => ({ left, top, right, bottom });

describe('a speaker\'s bubble', () => {
  it('is at most a third of the scene wide, and otherwise as wide as the page asks', () => {
    expect(bubbleWrap(6, 12)).toBe(4);
    expect(bubbleWrap(6, 25)).toBe(6);
    expect(bubbleWrap(4, 20)).toBe(4);
  });

  it('stays inside the scene, and inside what a story step frames of it (D199)', () => {
    expect(bubbleRoom(768, null)).toEqual([0, 768]);
    // The shed framed on rows 3 to 10 of sixteen: no bubble under the frame's bottom.
    expect(bubbleRoom(768, [120, 560])).toEqual([120, 560]);
    // A frame wider than the scene shows its margin: the scene's own sides hold.
    expect(bubbleRoom(576, [-40, 620])).toEqual([0, 576]);
  });

  it('stays whole inside what a framing shows as who says it walks out of the frame (D319)', () => {
    // The entrance framed from row 5: the words under who speaks, 70 pixels tall with
    // their tail, follow down to the frame's top and stay there.
    expect(bubbleHeld(300, 0, 70, [240, 960])).toBe(300);
    expect(bubbleHeld(190, 0, 70, [240, 960])).toBe(240);
    // Words over who walks out by the frame's foot stay over it; over who walks up to
    // its top, they keep under it.
    expect(bubbleHeld(1010, 70, 0, [240, 960])).toBe(960);
    expect(bubbleHeld(280, 70, 0, [240, 960])).toBe(310);
    // Words under who walks out by the foot keep their box over it.
    expect(bubbleHeld(950, 0, 70, [240, 960])).toBe(890);
    // A room shorter than the box keeps the box's top.
    expect(bubbleHeld(100, 0, 70, [240, 290])).toBe(240);
  });

  it('is held in from the sides of the scene, and of what a framing shows of it (D199)', () => {
    // Over who speaks where there is room on both sides.
    expect(bubbleMiddle(900, 150, [0, 2016])).toBe(900);
    // By the scene's side, its half kept inside.
    expect(bubbleMiddle(60, 150, [0, 2016])).toBe(150);
    expect(bubbleMiddle(2000, 150, [0, 2016])).toBe(1866);
    // The finish under the race course's wide framing, which ends short of the scene's
    // right side: the friend's words, drawn larger zoomed out, end at the frame's.
    const sides = bubbleRoom(2016, [125, 1858]);
    expect(bubbleMiddle(1656, 277, sides)).toBe(1581);
    // Wider than what is shown: from its left side.
    expect(bubbleMiddle(400, 500, [100, 900])).toBe(600);
  });

  it('keeps its tail over who speaks where its box is held in or moved, at any scale', () => {
    // The box over who speaks: the tail at its middle.
    expect(bubbleTip(0, 1, 300)).toBe(0);
    // The box held 75 pixels of the scene to the left: the tip as far to the right.
    expect(bubbleTip(75, 1, 300)).toBe(75);
    // Drawn at 1.8, zoomed out: the same pixels of the scene are fewer of the box's own.
    expect(bubbleTip(75, 1.8, 300)).toBeCloseTo(41.67, 2);
    // Never on the box's round corners.
    expect(bubbleTip(400, 1, 300)).toBe(138);
    expect(bubbleTip(-400, 2, 300)).toBe(-138);
  });

  const above = box(100, 0, 300, 80);
  const below = box(100, 120, 300, 200);

  it('goes above who speaks when it covers no one there', () => {
    expect(bubbleBelow(above, below, [box(400, 0, 440, 80)], true)).toBe(false);
  });

  it('goes below when above it would cover another figure, as in the first story', () => {
    expect(bubbleBelow(above, below, [box(180, 40, 220, 100)], true)).toBe(true);
  });

  it('stays above when it would cover someone on either side', () => {
    expect(bubbleBelow(above, below, [box(180, 40, 220, 100), box(180, 130, 220, 180)], true)).toBe(false);
  });

  it('goes below when there is no room above, whoever stands there', () => {
    expect(bubbleBelow(above, below, [box(180, 130, 220, 180)], false)).toBe(true);
  });

  it('moves to the nearer side that clears who it would cover, and stays in the scene', () => {
    const figure = box(150, 40, 190, 100);
    expect(bubbleShift(above, [figure], 800)).toBe(196 - 100);
    // Against the scene's right side it goes the other way.
    expect(bubbleShift(above, [box(250, 40, 290, 100)], 300)).toBe(250 - 6 - 300);
    expect(bubbleShift(above, [], 800)).toBe(0);
  });

  it('stays where it is when no side clears everyone', () => {
    expect(bubbleShift(box(0, 0, 200, 80), [box(90, 10, 110, 70)], 200)).toBe(0);
  });
});

describe('the words read to their end (D175)', () => {
  it('stay 0.8 seconds and 50 thousandths for each character, three ticks at least', () => {
    expect(readingMs('Hola')).toBe(1000);
    expect(readingTicks('Hola', 400)).toBe(3);
    // The threshold's sentence, 58 characters: 3.7 seconds, ten ticks of 400.
    const sentence = 'No entres todavía: quédate en el umbral, pasada la puerta.';
    expect([...sentence]).toHaveLength(58);
    expect(readingMs(sentence)).toBe(3700);
    expect(readingTicks(sentence, 400)).toBeGreaterThanOrEqual(9);
    expect(readingTicks(sentence, 400)).toBeLessThanOrEqual(10);
  });

  it('stay as long where a tick is played in a third (D225): three times the ticks', () => {
    // A ring's wrong way, 60 characters: 3.8 seconds, 29 ticks of a third of 400.
    const thought = 'Este aro se cruza hacia arriba, desde abajo. ¡Así no cuenta!';
    expect(readingMs(thought)).toBe(3800);
    expect(readingTicks(thought, 400)).toBe(10);
    expect(readingTicks(thought, 400 / 3)).toBe(29);
  });

  it('settle when the last of them is read, at once with none, and never for ever', () => {
    expect(settleMs([], 1000)).toBe(0);
    expect(settleMs([1500, 4700], 1000)).toBe(3700);
    expect(settleMs([900], 1000)).toBe(0);
    expect(settleMs([Number.POSITIVE_INFINITY], 1000)).toBe(0);
    expect(settleMs([Number.POSITIVE_INFINITY, 2200], 1000)).toBe(1200);
  });
});

describe('words over a figure in the air (D237)', () => {
  // The scene's headroom: a figure's height, 1.02 cells, and 4 pixels, at 48 a cell.
  const headroom = 48 * 1.02 + 4;

  it('puts the words 1.10 cells over the feet on the ground, 1.60 in the air and 1.95 in a ring', () => {
    expect(wordsOver(headroom, 0, 48).toFixed(2)).toBe('1.10');
    expect(wordsOver(headroom, FLY_LIFT * 48, 48).toFixed(2)).toBe('1.60');
    expect(wordsOver(headroom, (FLY_LIFT + RING_RAISE) * 48, 48).toFixed(2)).toBe('1.95');
  });

  it('shows a thought about a bump half a second after it', () => {
    expect(AFTER_BUMP_MS).toBe(500);
  });
});

describe('words under the goals box (D240)', () => {
  const cover = { left: 0, top: 0, right: 400, bottom: 60 };

  it('keeps the room\'s own top where nothing lies over the scene', () => {
    expect(roomTop(0, 100, 200, 90, null)).toBe(0);
  });

  it('keeps it where the box lies beside the words', () => {
    expect(roomTop(0, 400, 520, 90, cover)).toBe(0);
    expect(roomTop(0, 420, 540, 90, cover)).toBe(0);
  });

  it('takes the box\'s foot where the words would be under it', () => {
    expect(roomTop(0, 100, 200, 90, cover)).toBe(60);
    expect(roomTop(0, 390, 510, 30, cover)).toBe(60);
  });

  it('keeps the room\'s top where it is lower than the box\'s foot', () => {
    expect(roomTop(120, 100, 200, 200, cover)).toBe(120);
  });

  it('keeps it where the box lies under the words, off the scene', () => {
    expect(roomTop(0, 100, 200, 300, { left: 0, top: 600, right: 400, bottom: 700 })).toBe(0);
  });
});

describe('a thought beside the head where there is no room above (D245)', () => {
  // A view of 800 by 500; a cloud of 120 by 50; a head 24 wide, its top at 200.
  const view = box(0, 0, 800, 500);
  const room = (change: Partial<ThoughtRoom> = {}): ThoughtRoom => ({
    width: 120,
    height: 50,
    head: { middle: 400, top: 200, left: 388, right: 412 },
    feet: 260,
    facing: 'right',
    view,
    cover: null,
    heads: [],
    ...change,
  });
  const atTop = (top: number, middle = 400) => ({ middle, top, left: middle - 12, right: middle + 12 });
  const near = (placing: ReturnType<typeof thoughtPlace>, x: number, y: number) =>
    Math.hypot(placing.dots[1].x - x, placing.dots[1].y - y);

  it('goes over the head where there is room', () => {
    expect(thoughtPlace(room()).place).toBe('above');
  });

  it('goes beside the head, raised, behind a figure that faces right or left', () => {
    // A head at 60: over it the cloud would start at -8; beside it, raised, at 10.
    const right = thoughtPlace(room({ head: atTop(60) }));
    expect(right.place).toBe('left');
    expect(right.cloud.bottom).toBe(60);
    expect(thoughtPlace(room({ head: atTop(60), facing: 'left' })).place).toBe('right');
  });

  it('goes toward the middle of the view for a figure that faces up or down', () => {
    expect(thoughtPlace(room({ head: atTop(60, 200), facing: 'up' })).place).toBe('right');
    expect(thoughtPlace(room({ head: atTop(60, 600), facing: 'down' })).place).toBe('left');
  });

  it('takes the other side where another head is on the first', () => {
    const placing = thoughtPlace(room({ head: atTop(60), heads: [box(250, 20, 290, 50)] }));
    expect(placing.place).toBe('right');
  });

  it('slides down beside the head, on the first side, where neither side has room raised', () => {
    // The view's top at 20: a raised cloud, from 10 to 60, has none.
    const placing = thoughtPlace(room({ head: atTop(60), view: box(0, 20, 800, 500) }));
    expect(placing.place).toBe('left');
    expect(placing.cloud.top).toBe(24);
    expect(placing.cloud.top).toBeLessThanOrEqual(60);
  });

  it('goes under the feet where neither side has room', () => {
    const placing = thoughtPlace(room({ head: atTop(20), view: box(0, 0, 440, 500), heads: [box(260, 0, 380, 80)] }));
    expect(placing.place).toBe('below');
  });

  it('puts the dots between the cloud and the head, the last by the head', () => {
    for (const placing of [
      thoughtPlace(room({ head: atTop(60) })),
      thoughtPlace(room({ head: atTop(60), facing: 'left' })),
      thoughtPlace(room({ head: atTop(60), view: box(0, 20, 800, 500) })),
    ]) {
      const side = placing.place === 'left' ? 388 : 412;
      const edge = placing.place === 'left' ? placing.cloud.right : placing.cloud.left;
      for (const dot of placing.dots) {
        expect(Math.min(edge, side) <= dot.x && dot.x <= Math.max(edge, side)).toBe(true);
      }
      expect(near(placing, side, placing.dots[1].y)).toBeLessThan(6);
      expect(placing.dots[0].radius).toBeGreaterThan(placing.dots[1].radius);
    }
  });
});

describe('words told in the circle keep off it (D284)', () => {
  // The circle of El círculo, its cells 8 to 11 across and 6 to 8 down, at 96 a cell.
  const circle = { left: 768, top: 576, right: 1152, bottom: 864 };

  it('go beside who speaks, away from the circle, where below would cover it', () => {
    // Orla at (11, 4): her bubble under her feet reaches the circle's top row.
    const below = { left: 950, top: 493, right: 1250, bottom: 600 };
    expect(bubbleBeside(below, circle, 1104)).toBe('right');
    expect(bubbleBeside(below, circle, 700)).toBe('left');
  });

  it('stay where they are where they cover nothing of it, or where there is none', () => {
    const clear = { left: 950, top: 400, right: 1250, bottom: 470 };
    expect(bubbleBeside(clear, circle, 1104)).toBeNull();
    expect(bubbleBeside({ left: 950, top: 493, right: 1250, bottom: 600 }, null, 1104)).toBeNull();
  });
});

describe("a bubble's tail is over who speaks (D306)", () => {
  // The trail, step 8: the friend speaks at (7, 9), the wizard stands at (10, 10), the
  // camera's fit [[4, 2], [15, 11]] twelve cells wide, so the words wrap at four cells:
  // a box some 208 pixels wide over the friend, which a figure under its middle meets,
  // the wizard further right.
  const TILE = 48;
  const box = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    right: left + width,
    bottom: top + height,
  });
  const width = 4 * TILE + 16;
  const friend = 7.5 * TILE;
  const above = box(friend - width / 2, 6 * TILE, width, 3 * TILE);
  const wizard = box(10.5 * TILE - 18, 9 * TILE, 36, 44 + TILE);
  const between = box(8 * TILE - 18, 7.5 * TILE, 36, 44 + TILE);

  it('moves the box off the wizard no farther than its tail reaches the friend', () => {
    const free = bubbleShift(above, [between, wizard], 20 * TILE);
    expect(Math.abs(free)).toBeGreaterThan(width / 2 - 12);
    const reach = bubbleReach(width, 1, 0);
    const shift = bubbleShift(above, [between, wizard], 20 * TILE, reach);
    expect(shift).not.toBe(0);
    expect(Math.abs(shift)).toBeLessThanOrEqual(reach);
    // The tail's tip, drawn from the box's middle, is over the friend.
    expect(bubbleTip(-shift, 1, width)).toBe(-shift);
  });

  it("takes from the reach what the scene's side already took", () => {
    expect(bubbleReach(208, 1, 0)).toBe(92);
    expect(bubbleReach(208, 1.5, 0)).toBe(138);
    expect(bubbleReach(208, 1, -40)).toBe(52);
    expect(bubbleReach(208, 1, 200)).toBe(0);
  });

  it('keeps a shift that clears within the reach', () => {
    const near = box(friend + 60, 7 * TILE, 36, 44);
    const shift = bubbleShift(above, [near], 20 * TILE, 92);
    expect(Math.abs(shift)).toBeLessThanOrEqual(92);
  });
});
