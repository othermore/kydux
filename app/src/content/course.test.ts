import { describe, expect, it } from 'vitest';
import { defaultProgress } from '../progress/store';
import { type Course, courseStart, itemHash, knownApi, next, parseItem, previous, stopState } from './course';

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
