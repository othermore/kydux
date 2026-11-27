// What a program has, read from its code as written (D346): the variables, functions and
// classes it declares, each as a chip of the list Tienes over the editor, and the kinds
// the level asks the child to find that no line keeps yet, the list Por encontrar. It is
// read on the tree of the editor's own Python parser, never from a run, by a closed
// table: a number or a string written by hand and assigned once, outside any loop, `if`
// or function, shows its value; a find kept shows its kind's picture, a list's in
// brackets, and so do a loop's variable over it, an element taken from it and a copy of
// a variable that holds one; anything else, its name alone. A statement with a syntax
// error in it counts for nothing. Pure: no DOM.

import { pythonLanguage } from '@codemirror/lang-python';
import type { SyntaxNode } from '@lezer/common';
import type { LevelJson } from '../runtime/protocol';

/** A chip of what the code declares (D346), in the order written. */
export interface DeclaredChip {
  /** The variable, function or class, as the code names it. */
  name: string;
  /** What the chip says: the name, or a function with its arguments, `volver(lejos)`. */
  label: string;
  /** What the name is. */
  sort: 'variable' | 'function' | 'class';
  /** The value written by hand, as the chip shows it: a number, a string with its
   * quotes; cut to 12 characters ending in `…`, a string keeping its closing quote. */
  value?: string;
  /** The value whole, for the chip's title. */
  whole?: string;
  /** The kind of thing the variable keeps, found by the program: its picture. */
  thing?: string;
  /** Whether it keeps a list of them, a `find_all`'s: the picture in brackets. */
  list?: boolean;
  /** For a variable born of a class the code describes (`pimu = Fox(...)`), the class. */
  of?: string;
}

/** What the lists over the editor hold that the code says (D346). */
export interface ProgramLists {
  declared: DeclaredChip[];
  /** The kinds of the level's `to_find` no line of the code keeps a find of yet. */
  toFind: string[];
}

/** The longest value a chip shows before it is cut (D346). */
export const VALUE_MOST = 12;

/** The finds of the wizard's that give one thing, and the one that gives a list. */
const FINDS_ONE = ['find_nearest', 'find_item'];
const FINDS_ALL = 'find_all';

/** A value as a chip shows it (D346): cut to VALUE_MOST characters ending in `…`, a
 * string keeping its closing quote. */
export function shownValue(value: string): string {
  if ([...value].length <= VALUE_MOST) return value;
  const quote = /^(["'])[\s\S]*\1$/.exec(value)?.[1];
  const chars = [...value];
  return quote ? `${chars.slice(0, VALUE_MOST - 2).join('')}…${quote}` : `${chars.slice(0, VALUE_MOST - 1).join('')}…`;
}

/** The kinds of thing a level has: its things', what the wizard carries, and its
 * `to_find`. */
function levelKinds(level: LevelJson): Set<string> {
  const kinds = new Set<string>();
  for (const thing of (level.things as { kind?: unknown }[] | undefined) ?? []) {
    if (typeof thing.kind === 'string') kinds.add(thing.kind);
  }
  for (const carried of (level.carrying as unknown[] | undefined) ?? []) {
    const kind = typeof carried === 'string' ? carried : (carried as { kind?: unknown } | null)?.kind;
    if (typeof kind === 'string') kinds.add(kind);
  }
  for (const kind of (level.to_find as unknown[] | undefined) ?? []) if (typeof kind === 'string') kinds.add(kind);
  return kinds;
}

/** Whether a node or anything in it is a syntax error. */
function broken(node: SyntaxNode): boolean {
  if (node.type.isError) return true;
  let found = false;
  node.toTree().iterate({
    enter(inner) {
      if (inner.type.isError) found = true;
      return !found;
    },
  });
  return found;
}

/** What one assignment gives its name. */
type Given =
  | { as: 'literal'; text: string }
  | { as: 'found'; kind: string | null; list: boolean }
  | { as: 'copy'; from: string; index: boolean }
  | { as: 'born'; of: string }
  | { as: 'other' };

interface Assigned {
  given: Given;
  /** Inside a loop or an `if`. */
  nested: boolean;
}

export function readVariables(code: string, level: LevelJson): ProgramLists {
  const tree = pythonLanguage.parser.parse(code);
  const text = (node: SyntaxNode | null | undefined) => (node ? code.slice(node.from, node.to) : '');
  const kinds = levelKinds(level);
  const toFind = ((level.to_find as unknown[] | undefined) ?? []).filter((k): k is string => typeof k === 'string');
  const kept = new Set<string>();
  // Every name declared, in the order of its first declaration, with what each gives it.
  const order: string[] = [];
  const assigned = new Map<string, Assigned[]>();
  const functions = new Map<string, string>();
  const classes = new Set<string>();

  const declare = (name: string, one: Assigned) => {
    if (!assigned.has(name) && !functions.has(name) && !classes.has(name)) order.push(name);
    assigned.set(name, [...(assigned.get(name) ?? []), one]);
  };

  /** A find of the wizard's with a word in quotes: the word, and whether it gives a list. */
  const findOf = (node: SyntaxNode | null): { word: string; list: boolean } | null => {
    if (node?.name !== 'CallExpression') return null;
    const callee = node.firstChild;
    if (callee?.name !== 'MemberExpression') return null;
    const owner = callee.firstChild;
    const member = callee.lastChild;
    if (text(owner) !== 'wizard' || member?.name !== 'PropertyName') return null;
    const method = text(member);
    if (!FINDS_ONE.includes(method) && method !== FINDS_ALL) return null;
    const args = node.getChild('ArgList');
    const word = args?.getChildren('String') ?? [];
    if (word.length !== 1) return null;
    const quoted = text(word[0]);
    return { word: quoted.slice(1, -1), list: method === FINDS_ALL };
  };

  /** What a value gives the name it is assigned to. */
  const givenBy = (value: SyntaxNode | null): Given => {
    if (!value) return { as: 'other' };
    if (value.name === 'Number' || value.name === 'String') return { as: 'literal', text: text(value) };
    if (value.name === 'UnaryExpression' && /^-\s*\d/.test(text(value)) && value.lastChild?.name === 'Number') {
      return { as: 'literal', text: text(value).replace(/\s+/g, '') };
    }
    const found = findOf(value);
    if (found) {
      if (kinds.has(found.word)) kept.add(found.word);
      return { as: 'found', kind: kinds.has(found.word) ? found.word : null, list: found.list };
    }
    if (value.name === 'VariableName') return { as: 'copy', from: text(value), index: false };
    if (value.name === 'MemberExpression' && value.getChild('[') && value.firstChild?.name === 'VariableName') {
      return { as: 'copy', from: text(value.firstChild), index: true };
    }
    if (value.name === 'CallExpression' && value.firstChild?.name === 'VariableName') {
      return { as: 'born', of: text(value.firstChild) };
    }
    return { as: 'other' };
  };

  const visit = (node: SyntaxNode, nested: boolean) => {
    for (let child = node.firstChild; child; child = child.nextSibling) statement(child, nested);
  };

  const statement = (node: SyntaxNode, nested: boolean) => {
    switch (node.name) {
      case 'AssignStatement': {
        if (broken(node)) return;
        const targets: SyntaxNode[] = [];
        let value: SyntaxNode | null = null;
        let afterOp = false;
        const values: SyntaxNode[] = [];
        for (let part = node.firstChild; part; part = part.nextSibling) {
          if (part.name === 'AssignOp') {
            afterOp = true;
            continue;
          }
          if (part.name === ',') continue;
          if (afterOp) values.push(part);
          else targets.push(part);
        }
        value = values.length === 1 ? (values[0] ?? null) : null;
        const names = targets.filter((target) => target.name === 'VariableName');
        // `self.color = color`, an element or an attribute assigned: no chip.
        if (names.length !== targets.length || names.length === 0) return;
        if (names.length === 1) {
          declare(text(names[0]), { given: givenBy(value), nested });
          return;
        }
        // `a, b = 4, 3`: a chip each, names only.
        for (const name of names) declare(text(name), { given: { as: 'other' }, nested });
        return;
      }
      case 'UpdateStatement': {
        if (broken(node)) return;
        const target = node.firstChild;
        if (target?.name === 'VariableName') declare(text(target), { given: { as: 'other' }, nested });
        return;
      }
      case 'ForStatement': {
        const body = node.getChild('Body');
        // The loop's own line: its variables and what it walks, read unless it is broken.
        const head: SyntaxNode[] = [];
        for (let part = node.firstChild; part && part.name !== 'Body'; part = part.nextSibling) head.push(part);
        if (!head.some((part) => broken(part))) {
          const inAt = head.findIndex((part) => part.name === 'in');
          const targets = head.slice(1, inAt).filter((part) => part.name === 'VariableName');
          const walked = head[inAt + 1] ?? null;
          const found = findOf(walked);
          let given: Given = { as: 'other' };
          if (found?.list) {
            if (kinds.has(found.word)) kept.add(found.word);
            given = { as: 'found', kind: kinds.has(found.word) ? found.word : null, list: false };
          } else if (walked?.name === 'VariableName') {
            given = { as: 'copy', from: text(walked), index: true };
          }
          if (targets.length === 1) declare(text(targets[0]), { given, nested: true });
          else for (const target of targets) declare(text(target), { given: { as: 'other' }, nested: true });
        }
        if (body) visit(body, true);
        return;
      }
      case 'WhileStatement':
      case 'IfStatement':
      case 'TryStatement':
      case 'WithStatement': {
        for (let part = node.firstChild; part; part = part.nextSibling) if (part.name === 'Body') visit(part, true);
        return;
      }
      case 'FunctionDefinition': {
        const name = node.getChild('VariableName');
        const params = node.getChild('ParamList');
        if (!name || !params || broken(params)) return;
        const args = params.getChildren('VariableName').map((param) => text(param));
        if (!assigned.has(text(name)) && !functions.has(text(name)) && !classes.has(text(name))) order.push(text(name));
        functions.set(text(name), `${text(name)}(${args.join(', ')})`);
        return;
      }
      case 'ClassDefinition': {
        const name = node.getChild('VariableName');
        if (!name) return;
        if (!assigned.has(text(name)) && !functions.has(text(name)) && !classes.has(text(name))) order.push(text(name));
        classes.add(text(name));
        return;
      }
      default:
        return;
    }
  };
  visit(tree.topNode, false);

  /** What a variable keeps, followed through copies: a kind and whether a list. */
  const thingOf = (name: string, seen: Set<string> = new Set()): { kind: string; list: boolean } | null => {
    if (seen.has(name)) return null;
    seen.add(name);
    const all = assigned.get(name) ?? [];
    if (all.length === 0) return null;
    let found: { kind: string; list: boolean } | null = null;
    for (const { given } of all) {
      let one: { kind: string; list: boolean } | null = null;
      if (given.as === 'found' && given.kind) one = { kind: given.kind, list: given.list };
      else if (given.as === 'copy') {
        const from = thingOf(given.from, seen);
        if (from) one = given.index ? (from.list ? { kind: from.kind, list: false } : null) : from;
      }
      // A variable given a found thing and, on another line, something else: its name.
      if (!one || (found && (found.kind !== one.kind || found.list !== one.list))) return null;
      found = one;
    }
    return found;
  };

  const declared: DeclaredChip[] = [];
  for (const name of order) {
    if (functions.has(name)) {
      declared.push({ name, label: functions.get(name) ?? name, sort: 'function' });
      continue;
    }
    if (classes.has(name)) {
      declared.push({ name, label: name, sort: 'class' });
      continue;
    }
    const all = assigned.get(name) ?? [];
    const chip: DeclaredChip = { name, label: name, sort: 'variable' };
    const thing = thingOf(name);
    const only = all.length === 1 ? all[0] : undefined;
    if (thing) {
      chip.thing = thing.kind;
      if (thing.list) chip.list = true;
    } else if (only && !only.nested && only.given.as === 'literal') {
      chip.whole = only.given.text;
      chip.value = shownValue(only.given.text);
    } else if (only?.given.as === 'born' && classes.has(only.given.of)) {
      chip.of = only.given.of;
    }
    declared.push(chip);
  }
  return { declared, toFind: toFind.filter((kind) => !kept.has(kind)) };
}
