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
import { t } from '../i18n';
import { element } from './dom';
import { withCode } from './words';

/** The spells cast on a thing the child names (kydux_world.world.AIMED). */
const AIMED = new Set(['fendra']);

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

/** What the child's code holds in a level: the wizard, then its things and actors. */
export function heldObjects(level: LevelJson, table: ApiTable): { name: string; role: string }[] {
  const listed = (key: string) => (level[key] as { id: string; kind: string }[] | undefined) ?? [];
  return [
    { name: 'wizard', role: 'wizard' },
    ...listed('things').map((t) => ({ name: t.id, role: roleOf(t.kind, table) })),
    ...listed('actors').map((a) => ({ name: a.id, role: roleOf(a.kind, table) })),
  ];
}

/** Every member the level teaches, for every object its code holds; before the
 * course has taught arguments (`concepts` of the level, D60), an action that can
 * go without one is shown without one. */
export function notebookEntries(level: LevelJson, table: ApiTable, course?: CourseGiven): NotebookEntry[] {
  const api = (level.api as string[] | undefined) ?? [];
  const concepts = course?.concepts ?? ['arguments'];
  const entries: NotebookEntry[] = [];
  for (const object of heldObjects(level, table)) {
    // A position's two numbers are shown under the wizard's attributes (D153).
    for (const role of object.role === 'wizard' ? [object.role, 'position'] : [object.role]) {
      for (const member of table.roles[role] ?? []) {
        if (!allows(api, table, role, member.name)) continue;
        const simple = member.simple !== undefined && !concepts.includes('arguments');
        // The example names its own object first; the child's is named here.
        const example = (simple ? (member.simple ?? '') : member.example).replace(/^\w+(?=\.)/, object.name);
        entries.push({ object: object.name, role, member, example, simple });
      }
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
}

/** The panel: each object's actions, then its attributes, each with its example to
 * click; Python's words with their examples to read (D256); the spells and words. */
export function notebookPanel(
  level: LevelJson,
  table: ApiTable,
  onExample: (example: string) => void,
  course?: CourseGiven,
): NotebookPanel {
  const node = element('aside', { id: 'notebook', className: 'notebook', hidden: true });
  node.setAttribute('aria-labelledby', 'notebook-title');
  let tab: NotebookTab = 'actions';
  // A spell or a word, in italics as a word to type, with what it does, and its
  // example to click: `wizard.cast("zelim")`, `wizard.say("ambrel")`; a spell cast
  // on a thing names it, `wizard.cast("fendra", book)`.
  const magic = (word: string, key: string, action: string) => {
    const said = AIMED.has(word) ? `wizard.${action}("${word}", book)` : `wizard.${action}("${word}")`;
    const example = element('button', { type: 'button', className: 'example' }, [element('code', {}, [said])]);
    example.dataset.example = said;
    example.addEventListener('click', () => onExample(said));
    return element('li', {}, [
      example,
      element('span', { className: 'description' }, [element('em', {}, [word]), `: ${t(`${key}.${word}`)}`]),
    ]);
  };
  const draw = () => {
    const entries = notebookEntries(level, table, course);
    const close = element('button', { id: 'notebook-close', type: 'button', className: 'close' }, [
      t('notebook.close'),
    ]);
    close.addEventListener('click', () => panel.close());
    const sections: HTMLElement[] = [];
    for (const object of heldObjects(level, table)) {
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
              ]);
            }),
          ),
        ];
      };
      sections.push(
        element('section', { className: 'notebook-object' }, [
          element('h3', {}, [element('code', {}, [object.name])]),
          ...group('action', t('notebook.actions')),
          ...group('attribute', t('notebook.attributes')),
        ]),
      );
    }
    const actions = sections.length ? sections : [element('p', {}, [t('notebook.nothing')])];
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
  };
  return panel;
}
