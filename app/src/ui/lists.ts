// The two lists over a level's editor (D346): Tienes, what the program has, a solid
// box; Por encontrar, what the level asks the child to find that no line keeps yet, a
// dashed one, gone with its title while it is empty. Each is one row of long chips, a
// kind's picture at the left and the name at the right in a letter smaller than the
// code's; a row with more chips than fit scrolls sideways (wheel, drag, finger), with
// faded edges and its two arrows, and moves by itself to a chip just added. The lists
// are read from the code as written (editor/variables.ts), half a second after the last
// key; nothing glows or moves at a run.

import { readVariables, type DeclaredChip } from '../editor/variables';
import { t } from '../i18n';
import type { LevelJson } from '../runtime/protocol';
import { element } from './dom';
import { kindPicture } from './pictures';

/** How long after the last key the lists are read again (D346). */
export const READ_AFTER = 500;

/** A variable the level gives, green in Tienes: its name and, for a thing, its kind. */
export interface GivenChip {
  name: string;
  thing?: string;
}

/** A chip of Tienes as it is drawn: given by the level or declared by the code. */
export type HaveChip = (GivenChip & { given: true }) | (DeclaredChip & { given: false });

export interface ListsParts {
  level: LevelJson;
  given: GivenChip[];
  /** A chip of Tienes pressed: the notebook at its object's page. */
  onHave: (chip: HaveChip) => void;
  /** A kind of Por encontrar pressed: the notebook at what is to find. */
  onFind: (kind: string) => void;
}

export interface ProgramLists {
  node: HTMLElement;
  /** Reads the code now: the lists as it says. */
  show(code: string): void;
  /** Reads the code half a second after the last key. */
  changed(code: string): void;
  /** What the lists hold now: the variables of the code, and the kinds still to find. */
  readonly declared: DeclaredChip[];
  readonly toFind: string[];
  relabel(): void;
  destroy(): void;
}

/** The index of the last element that passes, or -1. */
function lastIndex<T>(all: readonly T[], passes: (one: T) => boolean): number {
  for (let index = all.length - 1; index >= 0; index -= 1) if (passes(all[index] as T)) return index;
  return -1;
}

/** A row of chips that scrolls sideways, with its two arrows and faded edges. */
function strip(id: string): { node: HTMLElement; list: HTMLElement; update: () => void; relabel: () => void; reveal: (chip: HTMLElement) => void } {
  const list = element('ul', { id, className: 'chips' });
  const before = element('button', { type: 'button', className: 'chips-scroll before', tabIndex: -1 }, ['‹']);
  const after = element('button', { type: 'button', className: 'chips-scroll after', tabIndex: -1 }, ['›']);
  const node = element('div', { className: 'chips-strip' }, [before, list, after]);
  const update = () => {
    const most = list.scrollWidth - list.clientWidth;
    const scrolls = most > 1;
    node.dataset.scrolls = String(scrolls);
    before.hidden = !scrolls;
    after.hidden = !scrolls;
    before.disabled = list.scrollLeft <= 1;
    after.disabled = list.scrollLeft >= most - 1;
    node.classList.toggle('fade-before', scrolls && list.scrollLeft > 1);
    node.classList.toggle('fade-after', scrolls && list.scrollLeft < most - 1);
  };
  const by = (direction: number) => {
    list.scrollBy({ left: direction * Math.max(40, list.clientWidth * 0.7) });
  };
  before.addEventListener('click', () => by(-1));
  after.addEventListener('click', () => by(1));
  list.addEventListener('scroll', update, { passive: true });
  // A wheel turned over the row moves it sideways.
  list.addEventListener(
    'wheel',
    (event) => {
      if (list.scrollWidth <= list.clientWidth || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      list.scrollLeft += event.deltaY;
    },
    { passive: false },
  );
  // Dragged with the mouse; a finger scrolls it as any row does.
  let dragging: { x: number; left: number; moved: boolean } | null = null;
  list.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || list.scrollWidth <= list.clientWidth) return;
    dragging = { x: event.clientX, left: list.scrollLeft, moved: false };
  });
  list.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const moved = event.clientX - dragging.x;
    if (Math.abs(moved) > 4) dragging.moved = true;
    list.scrollLeft = dragging.left - moved;
  });
  const drop = () => {
    const was = dragging;
    dragging = null;
    // A drag is no click on the chip it ended over.
    if (was?.moved) list.addEventListener('click', (event) => event.stopPropagation(), { capture: true, once: true });
  };
  list.addEventListener('pointerup', drop);
  list.addEventListener('pointercancel', drop);
  const relabel = () => {
    before.setAttribute('aria-label', t('level.scroll_left'));
    before.title = t('level.scroll_left');
    after.setAttribute('aria-label', t('level.scroll_right'));
    after.title = t('level.scroll_right');
  };
  relabel();
  // A chip just added is brought into sight, the row moved along itself only.
  const reveal = (chip: HTMLElement) => {
    const left = chip.offsetLeft - list.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left < list.scrollLeft) list.scrollLeft = left;
    else if (right > list.scrollLeft + list.clientWidth) list.scrollLeft = right - list.clientWidth;
    update();
  };
  return { node, list, update, relabel, reveal };
}

export function programLists(parts: ListsParts): ProgramLists {
  const { level } = parts;
  const haveTitle = element('span', { className: 'program-list-title' });
  const findTitle = element('span', { className: 'program-list-title' });
  const have = strip('have-chips');
  const find = strip('find-chips');
  const haveBox = element('section', { id: 'have', className: 'program-list have' }, [haveTitle, have.node]);
  const findBox = element('section', { id: 'to-find', className: 'program-list to-find' }, [findTitle, find.node]);
  const node = element('div', { id: 'program-lists', className: 'program-lists' }, [haveBox, findBox]);
  let declared: DeclaredChip[] = [];
  let toFind: string[] = [];
  let shownHave: string[] = [];
  let shownFind: string[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  /** A kind's picture in the chip, when the level's art has one. */
  const picture = (kind: string, list = false): HTMLElement => {
    const holder = element('span', { className: list ? 'chip-picture chip-list' : 'chip-picture' });
    holder.dataset.kind = kind;
    const image = element('img', { alt: '', className: 'chip-image' });
    image.hidden = true;
    holder.append(...(list ? ['[', image, ']'] : [image]));
    void kindPicture(level, kind).then((source) => {
      if (!source) return;
      image.src = source;
      image.hidden = false;
    });
    return holder;
  };

  const haveChip = (chip: HaveChip): HTMLElement => {
    const value = !chip.given && chip.value !== undefined ? chip.value : null;
    const whole = !chip.given && chip.whole !== undefined ? `${chip.name} = ${chip.whole}` : chip.given ? chip.name : chip.label;
    const button = element('button', { type: 'button', className: chip.given ? 'chip given' : 'chip own' }, [
      ...(chip.thing ? [picture(chip.thing, !chip.given && chip.list === true)] : []),
      element('span', { className: 'chip-name' }, [chip.given ? chip.name : chip.label]),
      ...(value !== null ? [element('span', { className: 'chip-value' }, [value])] : []),
    ]);
    button.title = whole;
    button.dataset.name = chip.name;
    if (value !== null) button.dataset.value = value;
    const list = !chip.given && chip.list === true;
    if (chip.thing) button.dataset.thing = list ? `[${chip.thing}]` : chip.thing;
    button.addEventListener('click', () => parts.onHave(chip));
    return element('li', {}, [button]);
  };

  const findChip = (kind: string): HTMLElement => {
    const word = `"${kind}"`;
    const button = element('button', { type: 'button', className: 'chip to-find' }, [
      picture(kind),
      element('span', { className: 'chip-name' }, [word]),
    ]);
    button.title = word;
    button.dataset.name = kind;
    button.addEventListener('click', () => parts.onFind(kind));
    return element('li', {}, [button]);
  };

  const draw = () => {
    const chips: HaveChip[] = [
      ...parts.given.map((chip) => ({ ...chip, given: true as const })),
      ...declared.map((chip) => ({ ...chip, given: false as const })),
    ];
    const haveKeys = chips.map((chip) => `${chip.given ? 'g' : 'o'}:${chip.name}`);
    const added = lastIndex(haveKeys, (key) => !shownHave.includes(key));
    have.list.replaceChildren(...chips.map(haveChip));
    find.list.replaceChildren(...toFind.map(findChip));
    // Por encontrar goes, with its title, while it is empty; Tienes takes the width.
    findBox.hidden = toFind.length === 0;
    node.dataset.toFind = String(toFind.length > 0);
    requestAnimationFrame(() => {
      have.update();
      find.update();
      const chip = added >= 0 && shownHave.length > 0 ? have.list.children[added] : undefined;
      if (chip instanceof HTMLElement) have.reveal(chip);
      const newKind = lastIndex(toFind, (kind) => !shownFind.includes(kind));
      const kindChip = newKind >= 0 ? find.list.children[newKind] : undefined;
      if (kindChip instanceof HTMLElement && shownFind.length > 0) find.reveal(kindChip);
      shownHave = haveKeys;
      shownFind = [...toFind];
    });
  };

  const read = (code: string) => {
    const lists = readVariables(code, level);
    declared = lists.declared;
    toFind = lists.toFind;
    draw();
  };

  const relabel = () => {
    haveTitle.textContent = t('level.have');
    findTitle.textContent = t('level.to_find');
    have.relabel();
    find.relabel();
  };
  relabel();
  const resized = new ResizeObserver(() => {
    have.update();
    find.update();
  });
  resized.observe(node);

  return {
    node,
    show(code) {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      read(code);
    },
    changed(code) {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        read(code);
      }, READ_AFTER);
    },
    get declared() {
      return declared;
    },
    get toFind() {
      return toFind;
    },
    relabel,
    destroy() {
      if (timer !== null) clearTimeout(timer);
      resized.disconnect();
    },
  };
}
