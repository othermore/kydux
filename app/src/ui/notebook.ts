// The wizard's notebook: what the child's code holds in this level, and for
// each, the actions and attributes the course has taught up to here (D40),
// with an example to click and a sentence in the child's language (D30).
// Nothing not taught yet is shown, and no object that is not in the level.
// Once a lesson has taught any of Python's own words and signs, a tab Python lists
// them in the order taught, each as it is typed, with a line and an example to read
// (D60, D256); a tab of the spells and the words (passwords) known up to here, each
// with what it does, follows once the course has given any (D80). The bar of tabs
// shows once there are two.

import type { LevelJson, CourseGiven } from '../runtime/protocol';
import { type FamiliarTable, familiarTable } from '../content/familiar';
import type { ProgramLists as ReadLists } from '../editor/variables';
import { t } from '../i18n';
import { element } from './dom';
import { withCode } from './words';

/** The spells cast on a thing the child names (kydux_world.world.AIMED): fendra on a
 * book, minka on the familiar (D262). */
const AIMED = new Set(['fendra', 'minka']);

/** One member of kydux_world.api's table, as api.json has it. */
export interface ApiMember {
  name: string;
  kind: 'action' | 'attribute';
  example: string;
  /** The example with no argument, for before arguments are taught (D60). */
  simple?: string;
}

export interface ApiTable {
  roles: Record<string, ApiMember[]>;
  /** The roles that are things, and so have a thing's members. */
  thing_roles: string[];
}

export interface NotebookEntry {
  /** The name the child's code knows the object by: `wizard`, `door`. */
  object: string;
  role: string;
  member: ApiMember;
  /** The member's example with the object's own name: `left_door.open()`. */
  example: string;
  /** Whether the example and its words are the simple ones, with no argument (D60). */
  simple: boolean;
  /** A method of the child's own class, as the child wrote it (D269). */
  source?: string;
}

/** The familiar's name in the child's code (D266): the living familiar's, or the draft's,
 * in small letters, or the default's. */
export function familiarVar(level: LevelJson): string {
  const block = level.familiar as { living?: { name?: unknown }; draft?: { name?: unknown } } | undefined;
  const name = block?.living?.name ?? block?.draft?.name;
  return (typeof name === 'string' && name ? name : 'Pimu').toLowerCase();
}

/** A method of the living familiar's kept class, as the child wrote it (D269): its `def`
 * and the lines under it; null where the class has none of that name. */
export function ownMethod(level: LevelJson, method: string): string | null {
  const block = level.familiar as { stage?: string; from?: string; living?: { source?: unknown; learned?: unknown } } | undefined;
  const living = block?.living;
  if (block?.stage !== 'living' || !living) return null;
  const kept = typeof living.learned === 'string' && block.from === 'learned' ? living.learned : living.source;
  if (typeof kept !== 'string') return null;
  const lines = kept.split('\n');
  const start = lines.findIndex((line) => new RegExp(`^\\s*def ${method}\\(`).test(line));
  if (start < 0) return null;
  const indent = (lines[start]?.match(/^\s*/)?.[0] ?? '').length;
  const body = [lines[start] ?? ''];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() && (line.match(/^\s*/)?.[0] ?? '').length <= indent) break;
    body.push(line);
  }
  while (body.length > 1 && !body[body.length - 1]?.trim()) body.pop();
  return body.map((line) => line.slice(indent)).join('\n');
}

/** The role of an object of a kind, as kydux_world.api.role_of says. */
export function roleOf(kind: string, table: ApiTable): string {
  return kind === 'wizard' || kind in table.roles ? kind : 'thing';
}

/** Whether a level that teaches `api` lets an object of `role` use `member` (api.allows). */
export function allows(api: readonly string[], table: ApiTable, role: string, member: string): boolean {
  if (api.includes(`${role}.${member}`)) return true;
  const thingMembers = (table.roles.thing ?? []).map((m) => m.name);
  return table.thing_roles.includes(role) && thingMembers.includes(member) && api.includes(`thing.${member}`);
}

/** The first year's familiars a pupil may describe (D298), where the level's block
 * describes one (stage `trial` or `birth`): the six kinds in the table's order, each with
 * its colours once the level teaches `familiar.color`, the colours offered to the child
 * and not the friend's grey; null elsewhere. */
export function familiarsListed(
  level: LevelJson,
  table: FamiliarTable | null,
): { kind: string; colours: string[] }[] | null {
  const stage = (level.familiar as { stage?: unknown } | undefined)?.stage;
  if (!table || (stage !== 'trial' && stage !== 'birth')) return null;
  const colours = ((level.api as string[] | undefined) ?? []).includes('familiar.color');
  return Object.entries(table.kinds).map(([kind, offered]) => ({ kind, colours: colours ? [...offered] : [] }));
}

/** The kinds of thing a program starts with by their ids (D344), as
 * kydux_world.level.VARIABLE_KINDS: every other thing is found first and kept. */
export const VARIABLE_KINDS: readonly string[] = ['door', 'hole', 'bed', 'plate'];

/** The kinds a level asks the child to find (D344), `to_find` of its level.json. */
export function toFind(level: LevelJson): string[] {
  const kinds = level.to_find;
  return Array.isArray(kinds) ? kinds.filter((kind): kind is string => typeof kind === 'string') : [];
}

/** The things a program starts with as variables (D344), as kydux_world's
 * `Level.variables`: each door, hole, bed and plate that does not say `"variable": false` and
 * whose kind the level does not ask the child to find. */
export function variableThings(level: LevelJson): { id: string; kind: string }[] {
  const things = (level.things as { id: string; kind: string; variable?: boolean }[] | undefined) ?? [];
  const finding = toFind(level);
  return things.filter(
    (thing) => VARIABLE_KINDS.includes(thing.kind) && thing.variable !== false && !finding.includes(thing.kind),
  );
}

/** What the child's code holds in a level (D344): the wizard, then its doors, holes, beds
 * and plates that are variables and its actors, and in a level with a familiar, the familiar by
 * its name (D266); someone else's familiar is not the child's to name, and no other
 * thing is a variable until the program finds it and keeps it. */
export function heldObjects(level: LevelJson, table: ApiTable): { name: string; role: string }[] {
  const listed = (key: string) => (level[key] as { id: string; kind: string }[] | undefined) ?? [];
  return [
    { name: 'wizard', role: 'wizard' },
    ...variableThings(level).map((t) => ({ name: t.id, role: roleOf(t.kind, table) })),
    ...listed('actors')
      .filter((a) => a.kind !== 'familiar')
      .map((a) => ({ name: a.id, role: roleOf(a.kind, table) })),
    ...(level.familiar ? [{ name: familiarVar(level), role: 'familiar' }] : []),
  ];
}

/** The kinds whose Spanish word is feminine, said with the feminine sentences of the
 * notebook's part of what is to find (D347): *una llave*, *una escoba*, *una puerta*. */
export const FEMININE_KINDS: readonly string[] = ['key', 'broom', 'door'];

/** What the child's code keeps, as the lists over the editor read it (D346): each
 * variable that keeps a found thing, by its name, with the thing's role, and the child's
 * familiar by the variable it was born into; not a list, nor a name alone. */
export function keptObjects(
  level: LevelJson,
  table: ApiTable,
  program?: ReadLists,
): { name: string; role: string; kind: string }[] {
  const held = new Set(heldObjects(level, table).map((object) => object.name));
  const found: { name: string; role: string; kind: string }[] = [];
  for (const chip of program?.declared ?? []) {
    if (chip.sort !== 'variable' || held.has(chip.name) || found.some((one) => one.name === chip.name)) continue;
    if (chip.thing && !chip.list) found.push({ name: chip.name, role: roleOf(chip.thing, table), kind: chip.thing });
    else if (chip.of && level.familiar) found.push({ name: chip.name, role: 'familiar', kind: 'familiar' });
  }
  return found;
}

/** The variable an example gives a thing to (D345): the child's own variable that keeps
 * a found thing, the first one, or the notebook's word for a variable of one's own. */
function aVariable(program?: ReadLists): string {
  const kept = program?.declared.find((chip) => chip.sort === 'variable' && chip.thing && !chip.list);
  return kept?.name ?? t('notebook.your_variable');
}

/** An example with the thing it is given named by a variable (D345): the wizard gives,
 * and counts its steps to, a thing the program keeps, never a word to search with. */
function namedExample(example: string, program?: ReadLists): string {
  return example.replace(/^(wizard\.(?:give|distance_to))\((\w+)\)$/, (_whole, call: string) => `${call}(${aVariable(program)})`);
}

/** The entries of one object, every member its role has that the level teaches. */
function entriesOf(
  object: { name: string; role: string },
  level: LevelJson,
  table: ApiTable,
  course?: CourseGiven,
  program?: ReadLists,
): NotebookEntry[] {
  const api = (level.api as string[] | undefined) ?? [];
  const concepts = course?.concepts ?? ['arguments'];
  const entries: NotebookEntry[] = [];
  // A position's two numbers are shown under the wizard's attributes (D153).
  for (const role of object.role === 'wizard' ? [object.role, 'position'] : [object.role]) {
    for (const member of table.roles[role] ?? []) {
      if (!allows(api, table, role, member.name)) continue;
      const simple = member.simple !== undefined && !concepts.includes('arguments');
      // The example names its own object first; the child's is named here.
      const example = namedExample((simple ? (member.simple ?? '') : member.example).replace(/^\w+(?=\.)/, object.name), program);
      entries.push({ object: object.name, role, member, example, simple });
    }
  }
  return entries;
}

/** Every member the level teaches, for every object its code holds, and for every found
 * thing the child's code keeps (D347); before the course has taught arguments
 * (`concepts` of the level, D60), an action that can go without one is shown without
 * one. */
export function notebookEntries(
  level: LevelJson,
  table: ApiTable,
  course?: CourseGiven,
  program?: ReadLists,
): NotebookEntry[] {
  const api = (level.api as string[] | undefined) ?? [];
  const concepts = course?.concepts ?? ['arguments'];
  const entries: NotebookEntry[] = [];
  for (const object of keptObjects(level, table, program)) entries.push(...entriesOf(object, level, table, course, program));
  for (const object of heldObjects(level, table)) {
    // A position's two numbers are shown under the wizard's attributes (D153).
    for (const role of object.role === 'wizard' ? [object.role, 'position'] : [object.role]) {
      for (const member of table.roles[role] ?? []) {
        if (!allows(api, table, role, member.name)) continue;
        const simple = member.simple !== undefined && !concepts.includes('arguments');
        // The example names its own object first; the child's is named here.
        const example = namedExample((simple ? (member.simple ?? '') : member.example).replace(/^\w+(?=\.)/, object.name), program);
        entries.push({ object: object.name, role, member, example, simple });
      }
    }
    // In a living level, the living familiar's own method, as the child wrote it (D269).
    const own = object.role === 'familiar' ? ownMethod(level, 'go_to') : null;
    if (own) {
      const member: ApiMember = { name: 'go_to', kind: 'action', example: `${object.name}.go_to(13, 4)` };
      entries.push({ object: object.name, role: 'familiar', member, example: member.example, simple: false, source: own });
    }
  }
  return entries;
}

/** A word or sign of Python on the notebook's page (D256): the concept a lesson marks
 * (D60) and how it is typed. Its line and its example are
 * `notebook_python.<concept>.does` and `.example`, or `<key>` for an entry that goes with
 * another's concept, an object with the class and `self` with `__init__` (D272). */
export interface PythonEntry {
  concept: string;
  shown: string;
  key?: string;
}

/** The page of Python (D256), block by block, in the order the course teaches each
 * block's first entry. A block's entries stand side by side, as the two `for` and the
 * two `def` do; in a `joined` block the last entry taught stands for them all, as `<`
 * and `>` join `==` in one entry of comparisons. A list's entry says `len` too, taught
 * with it. A comment, a string and `print` have no entry: the programs on the screen
 * show them. */
export const PYTHON: readonly { entries: readonly PythonEntry[]; joined?: boolean }[] = [
  { entries: [{ concept: 'variables', shown: '=' }] },
  { entries: [{ concept: 'arithmetic', shown: '+  -' }] },
  {
    entries: [
      { concept: 'equal', shown: '==' },
      { concept: 'less_greater', shown: '==  <  >' },
    ],
    joined: true,
  },
  { entries: [{ concept: 'not', shown: 'not' }] },
  {
    entries: [
      { concept: 'if', shown: 'if' },
      { concept: 'else', shown: 'else' },
    ],
  },
  {
    entries: [
      { concept: 'for_range', shown: 'for … in range()' },
      { concept: 'for_each', shown: 'for … in …' },
    ],
  },
  { entries: [{ concept: 'while', shown: 'while' }] },
  { entries: [{ concept: 'lists', shown: '[ ]  len()' }] },
  {
    entries: [
      { concept: 'def', shown: 'def' },
      { concept: 'def_arguments', shown: 'def …(…)' },
    ],
  },
  {
    entries: [
      { concept: 'class', shown: 'class' },
      { concept: 'class', key: 'object', shown: 'Crow()' },
    ],
  },
  { entries: [{ concept: 'attributes', shown: '.name =' }] },
  {
    entries: [
      { concept: 'init', shown: '__init__' },
      { concept: 'init', key: 'self', shown: 'self' },
    ],
  },
  { entries: [{ concept: 'inherit', shown: 'class …(…)' }] },
  { entries: [{ concept: 'methods', shown: 'def …(self)' }] },
];

/** The page of Python's blocks at a level: of each block, the entries its concepts hold,
 * the last of them alone in a joined block; a block with none is left out. Every entry
 * for a level outside the course, which knows them all (D60, D256). */
export function pythonBlocks(course?: CourseGiven): PythonEntry[][] {
  const concepts = course?.concepts;
  return PYTHON.map((block) => {
    const known = concepts ? block.entries.filter((entry) => concepts.includes(entry.concept)) : [...block.entries];
    return block.joined ? known.slice(-1) : known;
  }).filter((entries) => entries.length > 0);
}

/** The notebook's tabs, in their order (D80, D256): what the objects can do, Python's
 * words, and the spells and words. */
export type NotebookTab = 'actions' | 'python' | 'spells';

/** The tabs a level's notebook has: those with something in them, in their order; the
 * first is always there. */
export function notebookTabs(level: LevelJson, course?: CourseGiven): NotebookTab[] {
  const { spells, words } = spellsAndWords(level, course);
  return [
    'actions',
    ...(pythonBlocks(course).length > 0 ? ['python' as const] : []),
    ...(spells.length > 0 || words.length > 0 ? ['spells' as const] : []),
  ];
}

/** The spells and the words the tab of spells lists (D80): the spells known up to the
 * level once the wizard can cast, and the words given once the wizard can speak. */
export function spellsAndWords(level: LevelJson, course?: CourseGiven): { spells: string[]; words: string[] } {
  const api = (level.api as string[] | undefined) ?? [];
  return {
    spells: api.includes('wizard.cast') ? ((level.spells as string[] | undefined) ?? []) : [],
    words: api.includes('wizard.say') ? (course?.knownWords ?? []) : [],
  };
}

/** A kind the level asks the child to find, as the notebook's second part gives it
 * (D347): its search word, the line that finds it and keeps it in a variable of one's
 * own, with `find_item` where the kind is only carried, and the methods it will know
 * once kept, written with that variable. */
export interface ToFindPart {
  kind: string;
  feminine: boolean;
  line: string;
  methods: NotebookEntry[];
}

/** The kinds still to find, each as the notebook's second part gives it (D347): the
 * level's `to_find` less what the code keeps a find of. */
export function toFindParts(level: LevelJson, table: ApiTable, course?: CourseGiven, program?: ReadLists): ToFindPart[] {
  const yours = t('notebook.your_variable');
  const lying = new Set(((level.things as { kind?: string }[] | undefined) ?? []).map((thing) => thing.kind));
  return (program?.toFind ?? toFind(level)).map((kind) => ({
    kind,
    feminine: FEMININE_KINDS.includes(kind),
    line: `${yours} = wizard.${lying.has(kind) ? 'find_nearest' : 'find_item'}("${kind}")`,
    methods: entriesOf({ name: yours, role: roleOf(kind, table) }, level, table, course).filter(
      (entry) => entry.member.kind === 'action',
    ),
  }));
}

/** The words the notebook has for a member, from i18n: notebook.<role>.<member>,
 * or notebook_simple.<role>.<member> for its simple example (D60). */
export function describe(role: string, member: string, simple = false): string {
  return t(`${simple ? 'notebook_simple' : 'notebook'}.${role}.${member}`);
}

export interface NotebookPanel {
  node: HTMLElement;
  readonly open: boolean;
  toggle(): void;
  close(): void;
  /** Draws the panel again in the language now set. */
  relabel(): void;
  /** Draws it again for what the code keeps now (D347). */
  refresh(): void;
  /** Opens it at an object's page, at its first tab's top when it has none (D346). */
  showObject(name: string): void;
  /** Opens it at what is to find (D346). */
  showToFind(): void;
}

/** The panel: each object's actions, then its attributes, each with its example to
 * click; Python's words with their examples to read (D256); the spells and words. */
export function notebookPanel(
  level: LevelJson,
  table: ApiTable,
  onExample: (example: string) => void,
  course?: CourseGiven,
  /** What the code keeps, as the lists over the editor read it (D346). */
  program: () => ReadLists | undefined = () => undefined,
): NotebookPanel {
  const node = element('aside', { id: 'notebook', className: 'notebook', hidden: true });
  node.setAttribute('aria-labelledby', 'notebook-title');
  let tab: NotebookTab = 'actions';
  // A spell or a word, in italics as a word to type, with what it does, and its
  // example to click: `wizard.cast("zelim")`, `wizard.say("ambrel")`; a spell cast
  // on a thing names it by a variable, `wizard.cast("fendra", tu_variable)` (D345).
  const magic = (word: string, key: string, action: string) => {
    const aimed = word === 'minka' ? familiarVar(level) : aVariable(program());
    const said = AIMED.has(word) ? `wizard.${action}("${word}", ${aimed})` : `wizard.${action}("${word}")`;
    const example = element('button', { type: 'button', className: 'example' }, [element('code', {}, [said])]);
    example.dataset.example = said;
    example.addEventListener('click', () => onExample(said));
    return element('li', {}, [
      example,
      element('span', { className: 'description' }, [element('em', {}, [word]), `: ${t(`${key}.${word}`)}`]),
    ]);
  };
  const draw = () => {
    const kept = program();
    const entries = notebookEntries(level, table, course, kept);
    const close = element('button', { id: 'notebook-close', type: 'button', className: 'close' }, [
      t('notebook.close'),
    ]);
    close.addEventListener('click', () => panel.close());
    const sections: HTMLElement[] = [];
    for (const object of [...heldObjects(level, table), ...keptObjects(level, table, kept)]) {
      const own = entries.filter((e) => e.object === object.name);
      if (own.length === 0) continue;
      const group = (kind: ApiMember['kind'], heading: string) => {
        const items = own.filter((e) => e.member.kind === kind);
        if (items.length === 0) return [];
        return [
          element('h4', {}, [heading]),
          element(
            'ul',
            {},
            items.map((entry) => {
              const example = element('button', { type: 'button', className: 'example' }, [
                element('code', {}, [entry.example]),
              ]);
              example.dataset.example = entry.example;
              example.addEventListener('click', () => onExample(entry.example));
              return element('li', {}, [
                example,
                element('span', { className: 'description' }, withCode(describe(entry.role, entry.member.name, entry.simple))),
                // The child's own method, as written (D269).
                ...(entry.source
                  ? [element('pre', { className: 'syntax-example own-method' }, [element('code', {}, [entry.source])])]
                  : []),
              ]);
            }),
          ),
        ];
      };
      const section = element('section', { className: 'notebook-object' }, [
        element('h3', {}, [element('code', {}, [object.name])]),
        ...group('action', t('notebook.actions')),
        ...group('attribute', t('notebook.attributes')),
      ]);
      section.dataset.object = object.name;
      sections.push(section);
    }
    // The six kinds a pupil may describe, after the wizard's actions (D298): each a button
    // that writes the kind, as an example does, with its word and, once colours are taught,
    // its colours as the strings to write.
    const listed = familiarsListed(level, familiarTable());
    if (listed) {
      const coloured = listed.some((entry) => entry.colours.length > 0);
      const kinds = listed.map(({ kind, colours }) => {
        const button = element('button', { type: 'button', className: 'example' }, [element('code', {}, [kind])]);
        button.dataset.example = kind;
        button.addEventListener('click', () => onExample(kind));
        const item = element('li', {}, [
          button,
          element('span', { className: 'description' }, [t(`familiars.${kind}.kind`)]),
          ...colours.map((colour) => element('code', { className: 'familiar-colour' }, [`"${colour}"`])),
        ]);
        item.dataset.kind = kind;
        return item;
      });
      const familiars = element('section', { id: 'notebook-familiars', className: 'notebook-object' }, [
        element('h3', {}, [t('notebook.familiars.title')]),
        element('p', {}, [t(coloured ? 'notebook.familiars.text_colours' : 'notebook.familiars.text')]),
        element('ul', {}, kinds),
      ]);
      sections.splice(sections.length > 0 ? 1 : 0, 0, familiars);
    }
    // What is to find before it is used (D347): each kind's word, the line that finds it
    // and keeps it, which a click writes, and its methods dimmed, which write nothing.
    const finding = toFindParts(level, table, course, kept).map((part) => {
      const line = element('button', { type: 'button', className: 'example' }, [element('code', {}, [part.line])]);
      line.dataset.example = part.line;
      line.addEventListener('click', () => onExample(part.line));
      const item = element('section', { className: 'notebook-object notebook-find' }, [
        element('h3', {}, [element('code', {}, [`"${part.kind}"`]), ' ', t(`notebook.find.${part.kind}`)]),
        element('p', {}, [t(part.feminine ? 'notebook.find_line_f' : 'notebook.find_line')]),
        line,
        ...(part.methods.length
          ? [
              element('p', {}, [t(part.feminine ? 'notebook.find_methods_f' : 'notebook.find_methods')]),
              element(
                'ul',
                { className: 'dimmed' },
                part.methods.map((entry) =>
                  element('li', {}, [
                    element('code', { className: 'example dimmed' }, [entry.example]),
                    element('span', { className: 'description' }, withCode(describe(entry.role, entry.member.name, entry.simple))),
                  ]),
                ),
              ),
            ]
          : []),
      ]);
      item.dataset.find = part.kind;
      return item;
    });
    const have = sections.length ? sections : [element('p', {}, [t('notebook.nothing')])];
    // The two parts, what the program has and what is to find, in a level with something
    // still to find; else what the program has alone (D347).
    const actions = finding.length
      ? [
          element('section', { id: 'notebook-have', className: 'notebook-part' }, [
            element('h3', { className: 'notebook-part-title' }, [t('notebook.part_have')]),
            ...have,
          ]),
          element('section', { id: 'notebook-to-find', className: 'notebook-part' }, [
            element('h3', { className: 'notebook-part-title' }, [t('notebook.part_to_find')]),
            ...finding,
          ]),
        ]
      : have;
    // Python's words (D256): each as it is typed, its line, and its example to read, which
    // is no button: it names things of other programs. A block's entries stand side by
    // side.
    const python = element('section', { className: 'notebook-python' }, [
      element(
        'ul',
        { className: 'notebook-syntax' },
        pythonBlocks(course).map((entries) =>
          element(
            'li',
            { className: entries.length > 1 ? 'syntax-block side-by-side' : 'syntax-block' },
            entries.map((entry) => {
              const key = entry.key ?? entry.concept;
              const item = element('div', { className: 'syntax-entry' }, [
                element('code', { className: 'syntax-word' }, [entry.shown]),
                element('span', { className: 'description' }, withCode(t(`notebook_python.${key}.does`))),
                element('pre', { className: 'syntax-example' }, [
                  element('code', {}, [t(`notebook_python.${key}.example`)]),
                ]),
              ]);
              item.dataset.concept = key;
              return item;
            }),
          ),
        ),
      ),
    ]);
    const header = element('header', {}, [element('h2', { id: 'notebook-title' }, [t('notebook.title')]), close]);
    const { spells, words } = spellsAndWords(level, course);
    const present = notebookTabs(level, course);
    if (!present.includes(tab)) tab = 'actions';
    if (present.length === 1) {
      node.dataset.tab = tab;
      node.replaceChildren(header, ...actions);
      return;
    }
    const tabs = present.map((key) => {
      const button = element('button', { id: `notebook-tab-${key}`, type: 'button', className: 'notebook-tab' }, [
        t(`notebook.tab_${key}`),
      ]);
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(tab === key));
      button.addEventListener('click', () => {
        tab = key;
        draw();
      });
      return button;
    });
    const tabList = element('div', { className: 'notebook-tabs' }, tabs);
    tabList.setAttribute('role', 'tablist');
    const magicList = [
      ...(spells.length
        ? [element('h4', {}, [t('notebook.spells')]), element('ul', {}, spells.map((s) => magic(s, 'spells', 'cast')))]
        : []),
      ...(words.length
        ? [element('h4', {}, [t('notebook.words')]), element('ul', {}, words.map((w) => magic(w, 'words', 'say')))]
        : []),
    ];
    const shown = element('div', { id: 'notebook-shown', className: 'notebook-shown' }, [
      ...(tab === 'actions'
        ? actions
        : tab === 'python'
          ? [python]
          : [element('section', { className: 'notebook-magic' }, magicList)]),
    ]);
    shown.setAttribute('role', 'tabpanel');
    node.dataset.tab = tab;
    node.replaceChildren(header, tabList, shown);
  };
  draw();
  /** Opens the notebook at its first tab and brings `target` to its top, or its top. */
  const openAt = (target: () => HTMLElement | null) => {
    if (tab !== 'actions') {
      tab = 'actions';
    }
    draw();
    node.hidden = false;
    const found = target();
    node.scrollTop = 0;
    if (found) node.scrollTop = found.getBoundingClientRect().top - node.getBoundingClientRect().top - 8;
  };
  const panel: NotebookPanel = {
    node,
    get open() {
      return !node.hidden;
    },
    toggle() {
      node.hidden = !node.hidden;
    },
    close() {
      node.hidden = true;
    },
    relabel: draw,
    refresh: draw,
    showObject(name) {
      openAt(() => node.querySelector<HTMLElement>(`.notebook-object[data-object="${CSS.escape(name)}"]`));
    },
    showToFind() {
      openAt(() => node.querySelector<HTMLElement>('#notebook-to-find'));
    },
  };
  return panel;
}
