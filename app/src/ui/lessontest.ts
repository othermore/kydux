// Whether a lesson's page has had its test, and what is said while it has not (D354).
// A page's block says its test on its fence (content/lessons.ts): `try`, the block run
// once, an error counting; `change`, a code other than the given one run, an error
// counting; `rename`, a run with no error in which the given variable's name is nowhere
// as a whole word, its comments and strings aside; `rename_error`, that and a run that
// ended on the answer to a name the program has not, in either order; what is missing
// is said in the page's order, the answer first. The game never checks that a change
// is the one the page asks for. Pure: no DOM.

import type { LessonTest } from '../content/lessons';

/** A run of a page's block: the code run, and how it ended, with the kind of its
 * error's explanation when it ended in one. */
export interface LessonRun {
  code: string;
  error: boolean;
  explained?: string;
}

/** The explanations of a name the program has not (D349): the answer the fourth kind of
 * test asks to see. */
const UNKNOWN_NAME = ['unknown_name', 'search_word', 'search_word_kept'];

/** The variable a block gives: the name its first assignment assigns. */
export function givenVariable(code: string): string | null {
  for (const line of code.split('\n')) {
    const assigned = /^\s*([A-Za-z_]\w*)\s*=(?!=)/.exec(stripped(line));
    if (assigned) return assigned[1] ?? null;
  }
  return null;
}

/** A line of code with its comment and what stands in quotes taken out. */
function stripped(line: string): string {
  let out = '';
  let quote: string | null = null;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index] ?? '';
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '#') break;
    if (char === '"' || char === "'") {
      quote = char;
      out += ' ';
      continue;
    }
    out += char;
  }
  return out;
}

/** Whether a name is in a code as a whole word, outside its comments and strings. */
export function names(code: string, name: string): boolean {
  const word = new RegExp(`(^|[^\\w])${name.replace(/[^\w]/g, '')}(?![\\w])`);
  return code.split('\n').some((line) => word.test(stripped(line)));
}

/** Whether the code, read without what does not run, is the given one. */
function same(code: string, given: string): boolean {
  return code.trim() === given.trim();
}

/** What is due of a page's test: null when it is done, else the key of the words that
 * say what is missing (`lesson.*`). */
export function lessonTestDue(test: LessonTest, given: string, runs: readonly LessonRun[]): string | null {
  switch (test) {
    case 'try':
      return runs.length > 0 ? null : 'lesson.not_run';
    case 'change':
      if (runs.length === 0) return 'lesson.trial_not_started';
      return runs.some((run) => !same(run.code, given)) ? null : 'lesson.trial_not_changed';
    case 'rename':
    case 'rename_error': {
      const name = givenVariable(given);
      const renamed = runs.some((run) => !run.error && (name === null || !names(run.code, name)));
      if (test === 'rename') return renamed ? null : 'lesson.trial_not_renamed';
      // What is missing is said in the page's order: the answer first, then the name
      // changed on every line.
      const seen = runs.some((run) => run.error && UNKNOWN_NAME.includes(run.explained ?? ''));
      if (!seen) return 'lesson.trial_error_not_seen';
      return renamed ? null : 'lesson.trial_not_renamed';
    }
  }
}
