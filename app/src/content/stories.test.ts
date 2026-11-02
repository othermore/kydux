import { describe, expect, it } from 'vitest';
import { type StoryStep, storyEvents } from './stories';

const world = { map: ['#####', '#S..#', '#...#', '#####'], actors: [{ id: 'nuri', kind: 'friend', at: [3, 2] }] };

function steps(...list: Omit<StoryStep, 'text'>[]): StoryStep[] {
  return list.map((step, index) => ({ ...step, text: `words ${index}` }));
}

describe('a story as the scene\'s events (D74)', () => {
  it('plays a walk as a move a tile, then the words, each on a tick of its own', () => {
    const { events, spans } = storyEvents({
      world,
      steps: steps({ who: 'voice', do: null }, { who: 'nuri', do: { walk: [1, 2] } }),
    });
    // The voice's words are the band's, not the scene's: the first step has no tick.
    expect(spans[0]).toEqual({ first: 1, last: 0 });
    expect(spans[1]).toEqual({ first: 1, last: 3 });
    expect(events.map((e) => [e.tick, e.actor, e.kind])).toEqual([
      [1, 'nuri', 'move'],
      [2, 'nuri', 'move'],
      [3, 'nuri', 'say'],
    ]);
    expect(events[0]?.data).toEqual({ from: [3, 2], to: [2, 2], facing: 'left' });
  });

  it('lets the voice tell what another does, and a figure goes after its words', () => {
    const { events, spans } = storyEvents({
      world,
      steps: steps(
        { who: 'voice', do: { face: 'up' }, by: 'wizard' },
        { who: 'nuri', do: { vanish: true } },
        { who: 'voice', do: null },
      ),
    });
    expect(events.map((e) => [e.tick, e.actor, e.kind])).toEqual([
      [1, 'wizard', 'turn'],
      [2, 'nuri', 'say'],
      [3, 'nuri', 'vanish'],
    ]);
    expect(spans).toEqual([
      { first: 1, last: 1 },
      { first: 2, last: 2 },
      { first: 3, last: 3 },
    ]);
  });

  it('lets a figure the voice tells of go at once, before the words', () => {
    const { events } = storyEvents({
      world,
      steps: steps({ who: 'voice', do: { vanish: true }, by: 'nuri' }),
    });
    expect(events.map((e) => [e.tick, e.actor, e.kind])).toEqual([[1, 'nuri', 'vanish']]);
  });

  it('lays a figure down in a bed and gets it up again, the bed found by its id (D91)', () => {
    const { events } = storyEvents({
      world: { ...world, things: [{ id: 'bed_1', kind: 'bed', at: [3, 1] }] },
      steps: steps(
        { who: 'voice', do: { sleep: 'bed_1' }, by: 'nuri' },
        { who: 'nuri', do: { wake: true } },
      ),
    });
    expect(events.map((e) => [e.tick, e.actor, e.kind, e.data])).toEqual([
      [1, 'nuri', 'sleep', { id: 'bed_1', at: [3, 2], bed: [3, 1] }],
      [2, 'nuri', 'wake', { at: [3, 2] }],
      [3, 'nuri', 'say', { text: 'words 1' }],
    ]);
  });

  it('places an appearing figure where the step says', () => {
    const { events } = storyEvents({ world, steps: steps({ who: 'nuri', do: { appear: [2, 1] } }) });
    expect(events[0]).toMatchObject({ actor: 'nuri', kind: 'appear', data: { at: [2, 1] } });
  });
});
