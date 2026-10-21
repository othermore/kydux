// The wizard's notebook: what the child's code holds in this level, and for
// each, the actions and attributes the level teaches, with an example to
// click and a sentence in the child's language (D30). Nothing the level does
// not teach yet is shown.

import type { LevelJson } from '../runtime/protocol';
import { t } from '../i18n';
import { element } from './dom';
import { withCode } from './outcome';

/** One member of kydux_world.api's table, as api.json has it. */
export interface ApiMember {
  name: string;
  kind: 'action' | 'attribute';
  example: string;
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

/** Every member the level teaches, for every object its code holds. */
export function notebookEntries(level: LevelJson, table: ApiTable): NotebookEntry[] {
  const api = (level.api as string[] | undefined) ?? [];
  const entries: NotebookEntry[] = [];
  for (const object of heldObjects(level, table)) {
    for (const member of table.roles[object.role] ?? []) {
      if (!allows(api, table, object.role, member.name)) continue;
      // The example names its own object first; the child's is named here.
      const example = member.example.replace(/^\w+(?=\.)/, object.name);
      entries.push({ object: object.name, role: object.role, member, example });
    }
  }
  return entries;
}

/** The words the notebook has for a member, from i18n (notebook.<role>.<member>). */
export function describe(role: string, member: string): string {
  return t(`notebook.${role}.${member}`);
}

export interface NotebookPanel {
  node: HTMLElement;
  readonly open: boolean;
  toggle(): void;
  close(): void;
  /** Draws the panel again in the language now set. */
  relabel(): void;
}

/** The panel: each object's actions, then its attributes, each with its example. */
export function notebookPanel(
  level: LevelJson,
  table: ApiTable,
  onExample: (example: string) => void,
): NotebookPanel {
  const node = element('aside', { id: 'notebook', className: 'notebook', hidden: true });
  node.setAttribute('aria-labelledby', 'notebook-title');
  const draw = () => {
    const entries = notebookEntries(level, table);
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
                element('span', { className: 'description' }, withCode(describe(entry.role, entry.member.name))),
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
    node.replaceChildren(
      element('header', {}, [element('h2', { id: 'notebook-title' }, [t('notebook.title')]), close]),
      ...(sections.length ? sections : [element('p', {}, [t('notebook.nothing')])]),
    );
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
