// What the editor offers after a name and a dot (D348): for a variable the level gives,
// its members the level teaches; for a variable the code keeps a found thing in, a loop's
// over a list of them, one taken from a list or another variable, the members the level
// teaches of that kind; for the child's familiar by the variable it was born into, the
// familiar's; each with the notebook's words. Nothing for a variable with a name alone,
// for a list, nor for a search word written as a name; nothing before a dot, and nothing
// inside quotes or a comment.

import { syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import { readVariables } from '../editor/variables';
import type { CourseGiven, LevelJson } from '../runtime/protocol';
import { type ApiTable, describe, notebookEntries } from './notebook';

/** What is offered at a place of the code: where the member typed so far begins, and
 * each member with its kind and words; or null. */
export interface Offered {
  from: number;
  options: { label: string; type: 'method' | 'property'; detail: string }[];
}

/** Whether a place of the code is inside quotes or a comment. */
export function quoted(state: EditorState, at: number): boolean {
  for (let node: { name: string; parent: unknown } | null = syntaxTree(state).resolveInner(at, 1); node; ) {
    if (/String|Comment/.test(node.name)) return true;
    node = node.parent as typeof node;
  }
  return false;
}

export function offered(
  state: EditorState,
  at: number,
  level: LevelJson,
  table: ApiTable,
  course?: CourseGiven,
): Offered | null {
  const line = state.doc.lineAt(at);
  const before = /\b(\w+)\.(\w*)$/.exec(line.text.slice(0, at - line.from));
  if (!before) return null;
  const from = at - (before[2] ?? '').length;
  if (quoted(state, from - 1)) return null;
  const object = before[1] ?? '';
  const program = readVariables(state.doc.toString(), level);
  const own = notebookEntries(level, table, course, program).filter((entry) => entry.object === object);
  if (own.length === 0) return null;
  return {
    from,
    options: own.map((entry) => ({
      label: entry.member.name,
      type: entry.member.kind === 'action' ? 'method' : 'property',
      detail: describe(entry.role, entry.member.name, entry.simple),
    })),
  };
}
