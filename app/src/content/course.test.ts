import { describe, expect, it } from 'vitest';
import { defaultProgress } from '../progress/store';
import {
  type Course,
  chapterStandings,
  chapterThemeOf,
  courseStart,
  goOnAt,
  itemHash,
  knownApi,
  levelAfter,
  next,
  parseItem,
  previous,
  stopState,
  themeOf,
} from './course';

const COURSE: Course = {
  chapters: [
    { id: '01-arrival', items: ['lesson:01-a', 'level:01-b', 'lesson:02-c'] },
    { id: '02-library', items: ['level:02-d'] },
  ],
};

describe('the course', () => {
  it('reads an item', () => {
    expect(parseItem('level:the-long-corridor')).toEqual({ kind: 'level', id: 'the-long-corridor' });
    expect(parseItem('nonsense')).toBeNull();
    expect(itemHash('lesson:01-a')).toBe('#lesson/01-a');
  });

  it('goes from one item to the next, across chapters', () => {
    expect(next(COURSE, 'lesson:01-a')).toBe('level:01-b');
    expect(next(COURSE, 'lesson:02-c')).toBe('level:02-d');
    expect(next(COURSE, 'level:02-d')).toBeNull();
    expect(previous(COURSE, 'level:01-b')).toBe('lesson:01-a');
    expect(previous(COURSE, 'lesson:01-a')).toBeNull();
  });

  it('tries a lesson in the first level after it, past a lesson between them (D142)', () => {
    const course: Course = {
      chapters: [{ id: '01', items: ['lesson:a', 'lesson:b', 'level:c', 'lesson:d'] }],
    };
    expect(levelAfter(course, 'lesson:a')).toBe('c');
    expect(levelAfter(course, 'lesson:b')).toBe('c');
    expect(levelAfter(course, 'lesson:d')).toBeNull();
    expect(levelAfter(course, 'lesson:unknown')).toBeNull();
  });

  it('opens the first item, and the one after each done item (D34)', () => {
    const progress = defaultProgress();
    expect(stopState(COURSE, 'lesson:01-a', progress)).toBe('open');
    expect(stopState(COURSE, 'level:01-b', progress)).toBe('locked');
    progress.lessons['01-a'] = { read: true };
    expect(stopState(COURSE, 'lesson:01-a', progress)).toBe('done');
    expect(stopState(COURSE, 'level:01-b', progress)).toBe('open');
    progress.levels['01-b'] = { won: true, stars: 2 };
    expect(stopState(COURSE, 'level:01-b', progress)).toBe('done');
    expect(stopState(COURSE, 'lesson:02-c', progress)).toBe('open');
    expect(stopState(COURSE, 'level:02-d', progress)).toBe('locked');
  });

  it('does not count a level tried but not won as done', () => {
    const progress = defaultProgress();
    progress.lessons['01-a'] = { read: true };
    progress.levels['01-b'] = { tried: true };
    expect(stopState(COURSE, 'lesson:02-c', progress)).toBe('locked');
  });
});

describe('what the child knows (D40)', () => {
  it('is what the course has taught, or the level\'s own api outside the course', () => {
    const course: Course = { ...COURSE, known: { '02-d': ['wizard.move_right', 'wizard.wait'] } };
    expect(knownApi(course, '02-d', ['wizard.wait'])).toEqual(['wizard.move_right', 'wizard.wait']);
    expect(knownApi(course, 'elsewhere', ['wizard.wait'])).toEqual(['wizard.wait']);
  });
});

describe('the opening in chapter 1 (D78)', () => {
  const course = {
    chapters: [{ id: '01-arrival', items: ['story:the-letter', 'story:at-the-gate', 'lesson:a'] }],
    opening: 'story:the-letter',
  };

  it('starts the course after the opening', () => {
    expect(courseStart(course)).toBe('story:at-the-gate');
  });

  it('counts the opening done once a wizard is made, so that nothing after it is locked', () => {
    const progress = { ...defaultProgress(), wizard: { name: 'Ana', gender: 'girl' as const, look: 'teal' } };
    expect(stopState(course, 'story:the-letter', progress)).toBe('done');
    expect(stopState(course, 'story:at-the-gate', progress)).toBe('open');
    expect(stopState(course, 'story:at-the-gate', defaultProgress())).toBe('locked');
  });
});

describe("the map's chapters (D200)", () => {
  const course: Course = {
    chapters: [
      { id: '01', items: ['lesson:a', 'level:b', 'level:c'] },
      { id: '02', items: ['lesson:d', 'level:e'] },
      { id: '03', items: ['level:f'] },
    ],
  };
  const standing = (progress = defaultProgress()) =>
    chapterStandings(course, progress, 3).map(({ id, finished, locked, current }) => ({ id, finished, locked, current }));

  it('stands the first chapter current and the rest locked before anything is done', () => {
    expect(standing()).toEqual([
      { id: '01', finished: false, locked: false, current: true },
      { id: '02', finished: false, locked: true, current: false },
      { id: '03', finished: false, locked: true, current: false },
    ]);
  });

  it("finishes a chapter whose every stop is done, counts its stars, and moves on to the next", () => {
    const progress = {
      ...defaultProgress(),
      lessons: { a: { read: true } },
      levels: { b: { won: true, stars: 3 }, c: { won: true, stars: 2 } },
    };
    expect(standing(progress)).toEqual([
      { id: '01', finished: true, locked: false, current: false },
      { id: '02', finished: false, locked: false, current: true },
      { id: '03', finished: false, locked: true, current: false },
    ]);
    expect(chapterStandings(course, progress, 3)[0]).toMatchObject({ stars: 5, starsMost: 6 });
  });

  it('keeps the last chapter current once every one is finished', () => {
    const progress = {
      ...defaultProgress(),
      lessons: { a: { read: true }, d: { read: true } },
      levels: { b: { won: true }, c: { won: true }, e: { won: true }, f: { won: true } },
    };
    expect(standing(progress).map((chapter) => chapter.current)).toEqual([false, false, true]);
  });
});

describe('the theme a screen opens to (D192, D314)', () => {
  const course: Course = {
    chapters: [
      { id: '04-the-broom', items: ['level:a'], music: 'the-broom' },
      { id: '05-the-familiar', items: ['story:b', 'level:c', 'story:d'], music: 'the-familiar' },
    ],
    music: { 'story:d': 'the-truth' },
  };

  it("is a story's own where the course has one, else its chapter's, else the first chapter's", () => {
    expect(themeOf(course, 'story:d')).toBe('the-truth');
    expect(themeOf(course, 'story:b')).toBe('the-familiar');
    expect(themeOf(course, 'level:a')).toBe('the-broom');
    expect(themeOf(course, 'level:z')).toBe('the-broom');
    expect(themeOf(course, null)).toBe('the-broom');
    expect(themeOf({ chapters: course.chapters }, 'story:d')).toBe('the-familiar');
  });

  it("is the chapter's for the map and the start screen, whatever story the child read last", () => {
    expect(chapterThemeOf(course, 'story:d')).toBe('the-familiar');
    expect(chapterThemeOf(course, 'level:c')).toBe('the-familiar');
  });
});

describe('a saved game on a course that has grown (D356)', () => {
  // The course a game was made on, and the same course with two stops put in before the
  // place the child had reached, as chapter 2 grows in sprint 61.
  const before: Course = {
    chapters: [
      { id: '01', items: ['story:the-letter', 'lesson:a', 'level:b'] },
      { id: '02', items: ['story:c', 'lesson:old', 'level:d', 'lesson:e', 'level:f'] },
      { id: '03', items: ['lesson:g', 'level:h'] },
      { id: '04', items: ['lesson:i', 'level:j', 'level:k'] },
      { id: '05', items: ['story:l'] },
    ],
    opening: 'story:the-letter',
  };
  const grown: Course = {
    ...before,
    chapters: [
      before.chapters[0]!,
      { id: '02', items: ['story:c', 'lesson:new', 'level:new-level', 'level:d', 'lesson:e', 'level:f'] },
      ...before.chapters.slice(2),
    ],
  };
  /** A game in chapter 4, made on the course before: every stop up to lesson i done. */
  const inChapter4 = () => ({
    ...defaultProgress(),
    wizard: { name: 'Ana', gender: 'girl' as const, look: 'teal' },
    stories: { c: { read: true } },
    lessons: { a: { read: true }, old: { read: true }, e: { read: true }, g: { read: true }, i: { read: true } },
    levels: { b: { won: true, stars: 3 }, d: { won: true, stars: 2 }, f: { won: true, stars: 3 }, h: { won: true, stars: 1 } },
    current: 'level:j',
  });

  it('shows the stops put in as not done and open, and closes nothing reached', () => {
    const progress = inChapter4();
    expect(stopState(grown, 'lesson:new', progress)).toBe('open');
    expect(stopState(grown, 'level:new-level', progress)).toBe('open');
    for (const item of ['story:c', 'level:d', 'lesson:e', 'level:f', 'lesson:g', 'level:h', 'lesson:i']) {
      expect(stopState(grown, item, progress)).toBe('done');
    }
    expect(stopState(grown, 'level:j', progress)).toBe('open');
    expect(stopState(grown, 'level:k', progress)).toBe('locked');
    expect(stopState(grown, 'story:l', progress)).toBe('locked');
  });

  it('keeps the chapter the child had reached as the current one', () => {
    const standings = chapterStandings(grown, inChapter4(), 3);
    expect(standings.map(({ id, finished, locked, current }) => ({ id, finished, locked, current }))).toEqual([
      { id: '01', finished: true, locked: false, current: false },
      { id: '02', finished: false, locked: false, current: false },
      { id: '03', finished: true, locked: false, current: false },
      { id: '04', finished: false, locked: false, current: true },
      { id: '05', finished: false, locked: true, current: false },
    ]);
    // The chapter's stars count the level put in, once it is played.
    expect(standings[1]).toMatchObject({ stars: 5, starsMost: 9 });
  });

  it('goes on where the game was, when the course has that stop open', () => {
    expect(goOnAt(grown, inChapter4())).toBe('level:j');
    expect(goOnAt(before, inChapter4())).toBe('level:j');
  });

  it('goes on at the first stop not done when the stop kept is no more, or is locked', () => {
    const gone = { ...inChapter4(), current: 'lesson:old' };
    expect(goOnAt(grown, gone)).toBe('lesson:new');
    const locked = { ...inChapter4(), current: 'level:k' };
    expect(goOnAt(grown, locked)).toBe('lesson:new');
  });

  it('never goes on at the opening, and starts a new game at the course start', () => {
    const fresh = { ...defaultProgress(), wizard: { name: 'Ana', gender: 'girl' as const, look: 'teal' } };
    expect(goOnAt(grown, fresh)).toBe('lesson:a');
    expect(goOnAt(grown, { ...fresh, current: 'story:the-letter' })).toBe('lesson:a');
  });
});
