import { describe, expect, it } from 'vitest';
import { heldMs } from './story';

describe('the held moment before a story that goes on in place (D320)', () => {
  it('lasts as long as the music takes to turn, between one second and three', () => {
    expect(heldMs(0.4)).toBe(1000);
    expect(heldMs(2.1)).toBe(2100);
    expect(heldMs(4.7)).toBe(3000);
  });

  it('lasts a second and a half where no music turns', () => {
    expect(heldMs(null)).toBe(1500);
  });
});
