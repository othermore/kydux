import { describe, expect, it } from 'vitest';
import { defaultProgress } from '../progress/store';
import { type Course, itemHash, next, parseItem, previous, stopState } from './course';

const COURSE: Course = {
  chapters: [
    { id: '01-arrival', items: ['lesson:01-a', 'level:01-b', 'lesson:02-c'] },
    { id: '02-library', items: ['level:02-d'] },
  ],
};

describe('the course', () => {
  it('reads an item', () => {
    expect(parseItem('level:01-the-corridor')).toEqual({ kind: 'level', id: '01-the-corridor' });
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
