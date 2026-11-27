import { describe, expect, it } from 'vitest';
import { givenVariable, type LessonRun, lessonTestDue, names } from './lessontest';

const ran = (code: string, error = false, explained?: string): LessonRun =>
  explained ? { code, error, explained } : { code, error };

describe("a lesson's page passed by trying it (D354)", () => {
  const given = 'print(7)\n';

  it('try: done once the block has run, an error counting', () => {
    expect(lessonTestDue('try', given, [])).toBe('lesson.not_run');
    expect(lessonTestDue('try', given, [ran(given)])).toBeNull();
    expect(lessonTestDue('try', given, [ran('print(', true, 'unclosed')])).toBeNull();
  });

  it('change: done once a code other than the given one has run, an error counting', () => {
    const age = 'edad = 9\nprint(edad)\n';
    expect(lessonTestDue('change', age, [])).toBe('lesson.trial_not_started');
    expect(lessonTestDue('change', age, [ran(age)])).toBe('lesson.trial_not_changed');
    expect(lessonTestDue('change', age, [ran(`${age}\n`)])).toBe('lesson.trial_not_changed');
    expect(lessonTestDue('change', age, [ran(age), ran('edad = 10\nprint(edad)\n')])).toBeNull();
    expect(lessonTestDue('change', age, [ran('edad = \nprint(edad)\n', true, 'syntax')])).toBeNull();
  });

  it('rename: done once a run with no error has the given name nowhere', () => {
    const found = 'tesoro = wizard.find_nearest("book")\nprint(tesoro)\n';
    expect(lessonTestDue('rename', found, [])).toBe('lesson.trial_not_renamed');
    expect(lessonTestDue('rename', found, [ran(found)])).toBe('lesson.trial_not_renamed');
    // Renamed on one line only: an error, not done.
    const half = 'mio = wizard.find_nearest("book")\nprint(tesoro)\n';
    expect(lessonTestDue('rename', found, [ran(half, true, 'unknown_name')])).toBe('lesson.trial_not_renamed');
    expect(lessonTestDue('rename', found, [ran('mio = wizard.find_nearest("book")\nprint(mio)\n')])).toBeNull();
  });

  it('rename: the old name left in a comment, or inside another word, is no name of the code', () => {
    const found = 'tesoro = wizard.find_nearest("book")\nprint(tesoro)\n';
    const commented = '# antes era tesoro\nmio = wizard.find_nearest("book")\nprint(mio)\n';
    expect(lessonTestDue('rename', found, [ran(commented)])).toBeNull();
    const inside = 'tesoros = wizard.find_nearest("book")\nprint(tesoros)\n';
    expect(lessonTestDue('rename', found, [ran(inside)])).toBeNull();
    expect(names('print("tesoro")', 'tesoro')).toBe(false);
    expect(names('print(tesoro)', 'tesoro')).toBe(true);
  });

  it('rename error: done once renamed and an unknown name has been answered, in either order', () => {
    const sweets = 'caramelos = 12\nprint(caramelos)\n';
    const renamed = ran('dulces = 12\nprint(dulces)\n');
    const answered = ran('dulces = 12\nprint(caramelos)\n', true, 'unknown_name');
    // What is missing is said in the page's order: the answer first, then the name.
    expect(lessonTestDue('rename_error', sweets, [])).toBe('lesson.trial_error_not_seen');
    expect(lessonTestDue('rename_error', sweets, [renamed])).toBe('lesson.trial_error_not_seen');
    expect(lessonTestDue('rename_error', sweets, [answered])).toBe('lesson.trial_not_renamed');
    expect(lessonTestDue('rename_error', sweets, [renamed, answered])).toBeNull();
    expect(lessonTestDue('rename_error', sweets, [answered, renamed])).toBeNull();
    // Another error is not the answer to an unknown name.
    expect(lessonTestDue('rename_error', sweets, [renamed, ran('print(', true, 'unclosed')])).toBe(
      'lesson.trial_error_not_seen',
    );
  });

  it('reads the given variable from the first assignment', () => {
    expect(givenVariable('# a comment\ncaramelos = 12\nprint(caramelos)')).toBe('caramelos');
    expect(givenVariable('print(7)')).toBeNull();
    expect(givenVariable('if a == 3:\n    b = 1')).toBe('b');
  });
});
