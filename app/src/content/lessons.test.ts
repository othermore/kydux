import { describe, expect, it } from 'vitest';
import { pageParts, readLesson } from './lessons';

describe("a lesson's blocks to try (D142, D354)", () => {
  it('reads the test each of the four fences says', () => {
    const page = [
      'Words.',
      '```python try\nprint(7)\n```',
      '```python try change\nage = 9\n```',
      '```python try rename\nmine = 1\n```',
      '```python try rename error\nsweets = 12\nprint(sweets)\n```',
      'More words.',
    ].join('\n\n');
    expect(pageParts(page)).toEqual([
      { markdown: 'Words.\n\n' },
      { code: 'print(7)\n', test: 'try' },
      { code: 'age = 9\n', test: 'change' },
      { code: 'mine = 1\n', test: 'rename' },
      { code: 'sweets = 12\nprint(sweets)\n', test: 'rename_error' },
      { markdown: '\n\nMore words.' },
    ]);
  });

  it('leaves a fence with other words, and a plain one, as code to read', () => {
    const page = 'Read.\n\n```python try banana\nprint(1)\n```\n\n```python\nprint(2)\n```';
    expect(pageParts(page)).toEqual([{ markdown: page }]);
  });

  it("takes the last page's block, under any fence, as the lesson's example", () => {
    const lesson = readLesson('# Title\n\nOne.\n\n---\n## Two\n\n```python try rename\nmine = 1\n```\n');
    expect(lesson.title).toBe('Title');
    expect(lesson.tryCode).toBe('mine = 1\n');
  });
});
