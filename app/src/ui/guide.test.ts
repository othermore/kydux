import { describe, expect, it } from 'vitest';
import { edgeToward, placeCard } from './guide';

const WINDOW: [number, number] = [1000, 700];
const CARD: [number, number] = [300, 120];

describe('the guide', () => {
  it('leaves a box where the line from its middle to a point crosses its edge', () => {
    const box = { left: 100, top: 100, width: 200, height: 100 };
    expect(edgeToward(box, [500, 150])).toEqual([300, 150]);
    expect(edgeToward(box, [200, 0])).toEqual([200, 100]);
    // A point inside the box is where the line ends.
    expect(edgeToward(box, [210, 160])).toEqual([210, 160]);
  });

  it('puts the card to the right of a wide part, its arrow level with its middle', () => {
    const place = placeCard({ left: 50, top: 200, width: 400, height: 200 }, CARD, WINDOW);
    expect(place).toMatchObject({ side: 'right', left: 466 });
    expect(place.top + place.arrow).toBe(300);
  });

  it('puts the card to the left of a wide part at the window\'s right', () => {
    expect(placeCard({ left: 600, top: 200, width: 380, height: 200 }, CARD, WINDOW).side).toBe('left');
  });

  it('puts the card above a part narrower than it, or below when there is no room above', () => {
    const button = { left: 450, top: 500, width: 80, height: 40 };
    expect(placeCard(button, CARD, WINDOW)).toMatchObject({ side: 'above', top: 500 - 16 - 120 });
    expect(placeCard({ ...button, top: 20 }, CARD, WINDOW)).toMatchObject({ side: 'below', top: 76 });
  });

  it('keeps the card inside the window beside a part at its edge', () => {
    const corner = { left: 960, top: 640, width: 30, height: 30 };
    const place = placeCard(corner, CARD, WINDOW);
    expect(place.side).toBe('above');
    expect(place.left + CARD[0]).toBeLessThanOrEqual(WINDOW[0] - 8);
    expect(place.arrow).toBeLessThanOrEqual(CARD[0] - 16);
  });
});
