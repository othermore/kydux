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

  it('plays two figures at once, the longer walk going on alone (D103)', () => {
    const { events, spans } = storyEvents({
      world,
      steps: steps({
        who: 'voice',
        by: 'wizard',
        do: [
          { by: 'wizard', walk: [3, 1] },
          { by: 'nuri', walk: [1, 2] },
        ],
      }),
    });
    expect(events.map((e) => [e.tick, e.actor, e.kind])).toEqual([
      [1, 'wizard', 'move'],
      [1, 'nuri', 'move'],
      [2, 'wizard', 'move'],
      [2, 'nuri', 'move'],
    ]);
    expect(spans[0]).toEqual({ first: 1, last: 2 });
    // The step is the wizard's: nuri's walk is aside, for the camera to keep with the wizard.
    expect(events[1]?.data).toEqual({ from: [3, 2], to: [2, 2], facing: 'left', aside: true });
    expect(events[0]?.data).toEqual({ from: [1, 1], to: [2, 1], facing: 'right' });
  });

  it('turns at each tile of a walk, and a walk may end out of sight', () => {
    const { events } = storyEvents({
      world,
      steps: steps({ who: 'voice', by: 'nuri', do: { walk: [[3, 1], [1, 1]], vanish: true } }),
    });
    expect(events.map((e) => [e.tick, e.kind, e.data.facing ?? null])).toEqual([
      [1, 'move', 'up'],
      [2, 'move', 'left'],
      [3, 'move', 'left'],
      [4, 'vanish', null],
    ]);
  });

  it('opens and closes a door, each figure doing its own in turn', () => {
    const { events } = storyEvents({
      world,
      steps: steps({
        who: 'nuri',
        do: [{ open: 'gate' }, { walk: [3, 1] }, { close: 'gate' }, { by: 'wizard', face: 'right' }],
      }),
    });
    expect(events.map((e) => [e.tick, e.actor, e.kind, e.data.id ?? null])).toEqual([
      [1, 'nuri', 'open', 'gate'],
      [1, 'wizard', 'turn', null],
      [2, 'nuri', 'move', null],
      [3, 'nuri', 'close', 'gate'],
      [4, 'nuri', 'say', null],
    ]);
  });

  it('moves whoever stands on an opening door\'s leaf aside along the row, away from it (D125)', () => {
    const corridor = {
      map: ['#######', '###S###', '#.....#', '#.....#', '#######'],
      things: [{ kind: 'door', id: 'door', at: [3, 1], covers: { open: [[2, 2]] } }],
      actors: [{ id: 'nuri', kind: 'friend', at: [2, 2] }],
    };
    const { events } = storyEvents({
      world: corridor,
      steps: steps({ who: 'voice', by: 'wizard', do: { open: 'door' } }, { who: 'nuri', do: { walk: [1, 3] } }),
    });
    expect(events.map((e) => [e.tick, e.actor, e.kind])).toEqual([
      [1, 'wizard', 'open'],
      [1, 'door', 'shoved'],
      [2, 'nuri', 'move'],
      [3, 'nuri', 'say'],
    ]);
    expect(events[1]?.data).toEqual({ id: 'nuri', from: [2, 2], to: [1, 2], by: 'door' });
    // The walk after it starts where the leaf moved nuri to.
    expect(events[2]?.data).toEqual({ from: [1, 2], to: [1, 3], facing: 'down' });
    // Shut, the door's leaf moves no one.
    const shut = storyEvents({ world: corridor, steps: steps({ who: 'nuri', do: { walk: [4, 2] } }) });
    expect(shut.events.some((e) => e.kind === 'shoved')).toBe(false);
  });

  it('keeps the speaker who goes till the next step, in a list as alone', () => {
    const { events } = storyEvents({
      world,
      steps: steps({ who: 'nuri', do: [{ vanish: true }, { by: 'wizard', walk: [2, 1] }] }, { who: 'voice', do: null }),
    });
    expect(events.map((e) => [e.tick, e.actor, e.kind])).toEqual([
      [1, 'wizard', 'move'],
      [2, 'nuri', 'say'],
      [3, 'nuri', 'vanish'],
    ]);
  });
});

