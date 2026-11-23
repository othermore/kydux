import { describe, expect, it, vi } from 'vitest';
import { loadStory, type StoryStep, storyEvents, themeAt } from './stories';

// Nuri is a ghost here: a ghost and a familiar alone fade in and out of sight (D322).
const world = { map: ['#####', '#S..#', '#...#', '#####'], actors: [{ id: 'nuri', kind: 'ghost', at: [3, 2] }] };

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

  it('lands the wizard who began a story in the air, the event the broom\'s as in a level (D185)', () => {
    const { events } = storyEvents({ world, flying: ['wizard'], steps: steps({ who: 'voice', by: 'wizard', do: { land: true } }) });
    const land = events.find((event) => event.kind === 'land');
    expect(land).toMatchObject({ actor: 'broom', data: { id: 'wizard' } });
  });

  it('has a figure step out from behind a thing when its appearing says from where (D128)', () => {
    const { events } = storyEvents({ world, steps: steps({ who: 'voice', by: 'nuri', do: { appear: [2, 1], from: [1, 1] } }) });
    expect(events[0]?.data).toEqual({ at: [2, 1], from: [1, 1] });
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

  it("says a figure's words as the step begins where it says meanwhile (D275)", () => {
    const { events, spans } = storyEvents({
      world,
      steps: steps({ who: 'nuri', meanwhile: true, do: { by: 'wizard', walk: [3, 1] } }, { who: 'nuri', meanwhile: true, do: null }),
    });
    expect(events.map((e) => [e.tick, e.actor, e.kind])).toEqual([
      [1, 'nuri', 'say'],
      [1, 'wizard', 'move'],
      [2, 'wizard', 'move'],
      // With nothing to play under them, the words have their own tick.
      [3, 'nuri', 'say'],
    ]);
    expect(spans).toEqual([
      { first: 1, last: 2 },
      { first: 3, last: 3 },
    ]);
  });

  it('turns at each tile of a walk, and a walk that leaves by the edge goes on two cells past it (D319)', () => {
    const lane = { map: ['#####', '....#', '#...#', '#####'], actors: [{ id: 'nuri', kind: 'friend', at: [3, 2] }] };
    const { events } = storyEvents({
      world: lane,
      steps: steps({ who: 'voice', by: 'nuri', do: { walk: [[3, 1], [0, 1]], leave: true } }, { who: 'voice', do: null }),
    });
    expect(events.map((e) => [e.tick, e.kind, e.data.facing ?? null, e.data.to ?? null])).toEqual([
      [1, 'move', 'up', [3, 1]],
      [2, 'move', 'left', [2, 1]],
      [3, 'move', 'left', [1, 1]],
      [4, 'move', 'left', [0, 1]],
      // Off the map, a move a tick as the walk's own, out of sight past the edge.
      [5, 'move', 'left', [-1, 1]],
      [6, 'move', 'left', [-2, 1]],
      // Gone the tick after, at once.
      [7, 'leave', null, null],
    ]);
  });

  // A yard of floor to its edges, five by four, and Teku out of it (D322).
  const yard = {
    map: ['.....', '.S...', '.....', '.....'],
    actors: [
      { id: 'teku', kind: 'friend' },
      { id: 'wenna', kind: 'friend' },
    ],
  };

  it.each([
    [[0, 2], [-2, 2], 'right'],
    [[2, 0], [2, -2], 'down'],
    [[4, 2], [6, 2], 'left'],
    [[2, 3], [2, 5], 'up'],
  ] as const)('brings a figure in by the edge at %j from two cells past it, a move a tick (D322)', (cell, from, facing) => {
    const { events } = storyEvents({
      world: yard,
      steps: steps({ who: 'voice', by: 'teku', do: [{ enter: [...cell] }, { face: 'left' }] }),
    });
    expect(events.map((e) => [e.tick, e.kind, e.data.at ?? e.data.to ?? null, e.data.facing ?? null])).toEqual([
      [1, 'enter', [...from], facing],
      [2, 'move', [(from[0] + cell[0]) / 2, (from[1] + cell[1]) / 2], facing],
      [3, 'move', [...cell], facing],
      // The figure's next doing follows at the next tick.
      [4, 'turn', null, 'left'],
    ]);
  });

  it('finds a figure seeked to inside its entrance where the step has it, past the edge or on its way (D322)', () => {
    const { events } = storyEvents({ world: yard, steps: steps({ who: 'voice', by: 'teku', do: { enter: [4, 2] } }) });
    // Where the scene puts Teku shown at once up to a tick: the last place an event gives.
    const at = (tick: number) =>
      events.filter((e) => e.tick <= tick && e.actor === 'teku').map((e) => e.data.at ?? e.data.to).at(-1);
    expect(at(1)).toEqual([6, 2]);
    expect(at(2)).toEqual([5, 2]);
    expect(at(3)).toEqual([4, 2]);
  });

  it('brings two by one cell in single file, the second a cell further and a tick later (D322)', () => {
    const { events } = storyEvents({
      world: yard,
      steps: steps({ who: 'voice', do: [{ by: 'teku', enter: [2, 3] }, { by: 'wenna', enter: [2, 3] }] }),
    });
    const of = (who: string) => events.filter((e) => e.actor === who).map((e) => [e.tick, e.kind, e.data.at ?? e.data.to]);
    expect(of('teku')).toEqual([
      [1, 'enter', [2, 5]],
      [2, 'move', [2, 4]],
      [3, 'move', [2, 3]],
    ]);
    expect(of('wenna')).toEqual([
      [1, 'enter', [2, 6]],
      [2, 'move', [2, 5]],
      [3, 'move', [2, 4]],
      [4, 'move', [2, 3]],
    ]);
  });

  it('brings a figure in through the air, its broom lifted first, and onto a way out at once (D322)', () => {
    const flown = storyEvents({
      world: yard,
      steps: steps({ who: 'voice', by: 'teku', do: { enter: [2, 0], flying: true } }),
    });
    expect(flown.events.map((e) => [e.tick, e.kind, e.data.flying ?? null])).toEqual([
      [1, 'fly', null],
      [2, 'enter', null],
      [3, 'move', true],
      [4, 'move', true],
    ]);
    const behind = storyEvents({
      world: { ...yard, out: [[4, 0]] },
      steps: steps({ who: 'voice', by: 'teku', do: [{ enter: [4, 0] }, { walk: [4, 1] }] }),
    });
    expect(behind.events.map((e) => [e.tick, e.kind, e.data.at ?? e.data.to])).toEqual([
      [1, 'enter', [4, 0]],
      [2, 'move', [4, 1]],
    ]);
  });

  it('ends a walk that leaves by a way out behind a cover on its cell, gone the tick after (D319)', () => {
    const hall = { ...world, out: [[2, 1]] };
    const { events } = storyEvents({
      world: hall,
      steps: steps({ who: 'voice', by: 'nuri', do: { walk: [[2, 2], [2, 1]], leave: true } }),
    });
    expect(events.map((e) => [e.tick, e.kind, e.data.to ?? null])).toEqual([
      [1, 'move', [2, 2]],
      [2, 'move', [2, 1]],
      [3, 'leave', null],
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


describe('a figure stamps and throws what it holds (D324)', () => {
  const room = {
    map: ['######', '#S...#', '#....#', '######'],
    actors: [{ id: 'rinlo', kind: 'friend', at: [1, 2], facing: 'right' }],
    things: [
      { kind: 'thread', id: 'thread_1', at: [2, 1], hidden: true },
      { kind: 'thread', id: 'thread_2', at: [4, 2], hidden: true },
    ],
  };

  it('plays a stamp a tick, and a throw as one event with every thing and its cell', () => {
    const { events, spans } = storyEvents({
      world: room,
      steps: steps({ who: 'voice', by: 'rinlo', do: [{ stamp: true }, { throw: ['thread_2', 'thread_1'] }] }),
    });
    expect(spans[0]).toEqual({ first: 1, last: 2 });
    expect(events.map((e) => [e.tick, e.actor, e.kind])).toEqual([
      [1, 'rinlo', 'stamp'],
      [2, 'rinlo', 'throw'],
    ]);
    expect(events[1]?.data).toEqual({
      ids: ['thread_2', 'thread_1'],
      at: [
        [4, 2],
        [2, 1],
      ],
    });
  });
});

describe('a familiar in a story walks at twice the pace (D277)', () => {
  const hall = {
    map: ['########', '#S.....#', '#......#', '########'],
    actors: [
      { id: 'nuri', kind: 'friend', at: [6, 2] },
      { id: 'familiar', kind: 'familiar', at: [6, 1] },
    ],
  };

  it("plays a step where a familiar walks in half ticks, a person's cell taking two", () => {
    const { events, spans, lengths } = storyEvents({
      world: hall,
      steps: steps({ who: 'voice', do: [{ walk: [4, 2], by: 'nuri' }, { walk: [2, 1], by: 'familiar' }] }),
    });
    const seen = events.map((e) => [e.tick, e.actor, e.kind, e.data.ticks ?? null]);
    expect(seen).toEqual([
      [1, 'nuri', 'move', 2],
      [1, 'familiar', 'move', null],
      [2, 'nuri', 'wait', null],
      [2, 'familiar', 'move', null],
      [3, 'nuri', 'move', 2],
      [3, 'familiar', 'move', null],
      [4, 'nuri', 'wait', null],
      [4, 'familiar', 'move', null],
    ]);
    // The familiar's four cells end with the person's two: each at its own pace.
    expect(spans[0]).toEqual({ first: 1, last: 4 });
    expect([...lengths]).toEqual([
      [1, 0.5],
      [2, 0.5],
      [3, 0.5],
      [4, 0.5],
    ]);
  });

  it('ends a step with a person still walking once its last cell is walked', () => {
    const { events, lengths } = storyEvents({
      world: hall,
      steps: steps(
        { who: 'voice', do: [{ walk: [4, 2], by: 'nuri' }, { walk: [5, 1], by: 'familiar' }] },
        { who: 'nuri', do: null },
      ),
    });
    const familiarLast = Math.max(...events.filter((e) => e.actor === 'familiar').map((e) => e.tick));
    const nuriLast = Math.max(...events.filter((e) => e.actor === 'nuri' && e.kind !== 'say').map((e) => e.tick));
    expect(familiarLast).toBe(1);
    expect(nuriLast).toBe(4);
    // The words of the next step come at a tick of the normal length.
    const said = events.find((e) => e.kind === 'say');
    expect(said?.tick).toBe(5);
    expect(lengths.has(5)).toBe(false);
  });

  it('keeps a step with no familiar walking at the normal pace', () => {
    const { events, lengths } = storyEvents({ world: hall, steps: steps({ who: 'voice', do: { walk: [4, 2], by: 'nuri' } }) });
    expect(events.map((e) => [e.tick, e.kind, e.data.ticks ?? null])).toEqual([
      [1, 'move', null],
      [2, 'move', null],
    ]);
    expect(lengths.size).toBe(0);
  });
});

describe('the words on the dark before a part that opens later (D309)', () => {
  it("are kept by the part's first step, counted from 0, and read as a text is", async () => {
    const files: Record<string, unknown> = {
      'story.json': { steps: [{ who: 'voice' }, { who: 'orla' }], world: { id: 'w' }, camera: [0, 0] },
      'text.es.json': { title: 'Una historia', steps: ['Uno.', 'Dos.'], later: { '2': 'Pasa un buen rato.' } },
    };
    vi.stubGlobal('fetch', async (url: string) => {
      const name = /[^/?]+(?=\?|$)/.exec(url)?.[0] ?? '';
      return { ok: name in files, headers: new Headers({ 'content-type': 'application/json' }), json: async () => files[name] };
    });
    try {
      const story = await loadStory('a-story', 'es');
      expect(story.later).toEqual({ 1: 'Pasa un buen rato.' });
      files['text.es.json'] = { title: 'Una historia', steps: ['Uno.', 'Dos.'] };
      expect((await loadStory('a-story', 'es')).later).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('the theme in force at a step (D314)', () => {
  const told = (...named: (string | undefined)[]) =>
    steps(...named.map((music) => ({ who: 'voice', do: null, ...(music ? { music } : {}) })));

  it("is the chapter's where neither the story nor a step names one", () => {
    expect(themeAt({ steps: told(undefined, undefined) }, 1, 'the-familiar')).toBe('the-familiar');
    expect(themeAt({ steps: told(undefined) }, 0, undefined)).toBeUndefined();
  });

  it("is the story's own from its first step, in the place of its chapter's", () => {
    expect(themeAt({ steps: told(undefined, undefined), music: 'the-truth' }, 0, 'the-familiar')).toBe('the-truth');
  });

  it('is the one a step names, from that step on; before it, the one before', () => {
    const story = { steps: told(undefined, undefined, 'the-truth', undefined) };
    expect(themeAt(story, 1, 'the-familiar')).toBe('the-familiar');
    expect(themeAt(story, 2, 'the-familiar')).toBe('the-truth');
    expect(themeAt(story, 3, 'the-familiar')).toBe('the-truth');
  });

  it('is the last of two named up to the step, and going back before the first brings the story\'s back', () => {
    const story = { steps: told(undefined, 'the-familiar', undefined, 'arrival'), music: 'the-truth' };
    expect(themeAt(story, 0, 'the-library')).toBe('the-truth');
    expect(themeAt(story, 2, 'the-library')).toBe('the-familiar');
    expect(themeAt(story, 3, 'the-library')).toBe('arrival');
    expect(themeAt(story, 9, 'the-library')).toBe('arrival');
  });

  it("is read from the story's staging: its top's and each step's", async () => {
    const files: Record<string, unknown> = {
      'story.json': {
        music: 'the-truth',
        steps: [{ who: 'voice' }, { who: 'voice', music: 'the-familiar' }],
        world: { id: 'w' },
        camera: [0, 0],
      },
      'text.es.json': { title: 'Una historia', steps: ['Uno.', 'Dos.'] },
    };
    vi.stubGlobal('fetch', async (url: string) => {
      const name = /[^/?]+(?=\?|$)/.exec(url)?.[0] ?? '';
      return { ok: name in files, headers: new Headers({ 'content-type': 'application/json' }), json: async () => files[name] };
    });
    try {
      const story = await loadStory('a-story', 'es');
      expect(story.music).toBe('the-truth');
      expect(story.steps.map((step) => step.music)).toEqual([undefined, 'the-familiar']);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
