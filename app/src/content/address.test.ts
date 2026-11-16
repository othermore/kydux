import { describe, expect, it } from 'vitest';
import { contentUrl } from './address';

describe("a file of the content's address (D230)", () => {
  // The stamp's twelve digits are the build's (pack-world.mjs), held by the browser test
  // of the addresses (e2e/addresses.spec.ts): a clone not yet built has none.
  it('is the path under content/, after the base, with the world stamp', () => {
    expect(contentUrl('course.json')).toBe(`${import.meta.env.BASE_URL}content/course.json?v=${__WORLD_STAMP__}`);
    expect(contentUrl('art/things/ring.webp')).toBe(
      `${import.meta.env.BASE_URL}content/art/things/ring.webp?v=${__WORLD_STAMP__}`,
    );
  });
});
