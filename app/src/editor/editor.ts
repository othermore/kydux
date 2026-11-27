// The child's editor: CodeMirror with Python, four spaces to an indent, the
// line being played lit, and the line of an error marked, each also in the
// gutter. A line too long for the editor wraps, and its wrapped part hangs under
// the line's first character that is not a space (D223). A line out of the editor's
// sight is brought into it on asking, the line that runs and the line an answer
// names (D363, D366).

import {
  autocompletion,
  type CompletionSource,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from '@codemirror/language';
import {
  EditorState,
  type Extension,
  Prec,
  RangeSet,
  StateEffect,
  StateField,
  type TransactionSpec,
} from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  EditorView,
  GutterMarker,
  gutter,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';

export interface Editor {
  getDoc(): string;
  setDoc(text: string): void;
  /** Lights a line, 1-based, as the one being played; null for none. */
  setRunningLine(line: number | null): void;
  /** Marks a line, 1-based, as the one an error came from; null for none. */
  setErrorLine(line: number | null): void;
  /** Brings a line, 1-based, into the editor's sight when it is not whole inside it,
   * scrolling by the least, with a line of margin where the code has one (D363, D366).
   * A line in sight, or one the document does not have, moves nothing; neither the
   * cursor nor the focus moves. */
  showLine(line: number): void;
  /** Puts `text` on a line of its own after the cursor's line, and the cursor after it. */
  insertLine(text: string): void;
  focus(): void;
  destroy(): void;
  readonly view: EditorView;
}

export interface EditorOptions {
  doc: string;
  onChange?: (doc: string) => void;
  /** Ctrl- or Cmd-Enter: run the program. */
  onRun?: () => void;
  /** The editor's name for screen readers. */
  label?: string;
  /** What to offer after a name and a dot; nothing else is completed. */
  complete?: CompletionSource;
}

class Mark extends GutterMarker {
  constructor(readonly kind: 'running' | 'error') {
    super();
  }
  override eq(other: GutterMarker): boolean {
    return other instanceof Mark && other.kind === this.kind;
  }
  override toDOM(): Node {
    const node = document.createElement('span');
    node.className = `cm-kydux-mark cm-kydux-mark-${this.kind}`;
    return node;
  }
}

/** A field holding one marked line, cleared by any change to the text. */
function markedLine(kind: 'running' | 'error') {
  const set = StateEffect.define<number | null>();
  const field = StateField.define<number | null>({
    create: () => null,
    update(line, tr) {
      let next = tr.docChanged ? null : line;
      for (const effect of tr.effects) if (effect.is(set)) next = effect.value;
      return next !== null && next >= 1 && next <= tr.state.doc.lines ? next : null;
    },
  });
  const decoration = Decoration.line({ class: `cm-kydux-${kind}-line` });
  const decorations = EditorView.decorations.compute([field], (state): DecorationSet => {
    const line = state.field(field);
    return line === null ? Decoration.none : Decoration.set([decoration.range(state.doc.line(line).from)]);
  });
  const marker = new Mark(kind);
  const markers = (state: EditorState): RangeSet<GutterMarker> => {
    const line = state.field(field);
    return line === null ? RangeSet.empty : RangeSet.of([marker.range(state.doc.line(line).from)]);
  };
  return { set, field, extension: [field, decorations] as Extension, markers };
}

/** The scroll that brings a line, 1-based, into sight by the least, `margin` pixels
 * clear of the editor's edge, or null for a line the document does not have. It moves no
 * selection (D363, D366). */
export function lineScroll(state: EditorState, line: number, margin: number): TransactionSpec | null {
  if (!Number.isInteger(line) || line < 1 || line > state.doc.lines) return null;
  return { effects: EditorView.scrollIntoView(state.doc.line(line).from, { y: 'nearest', yMargin: margin }) };
}

/** How far under a line's box its mark reaches, in pixels: the wavy line under the line
 * an answer names is drawn across the box's foot. */
const MARK_BELOW = 4;

/** Whether a line, 1-based, of the document lies whole inside what the editor shows,
 * with the mark under it. */
function wholeInSight(view: EditorView, line: number): boolean {
  const block = view.lineBlockAt(view.state.doc.line(line).from);
  const top = view.documentTop + block.top;
  const shown = view.scrollDOM.getBoundingClientRect();
  const foot = shown.top + view.scrollDOM.clientHeight;
  return top >= shown.top - 1 && top + block.height + MARK_BELOW <= foot + 1;
}

/** How many columns a line's leading spaces take, a tab to the next stop of four. */
export function leadingColumns(text: string): number {
  let columns = 0;
  for (const character of text) {
    if (character === ' ') columns += 1;
    else if (character === '\t') columns += 4 - (columns % 4);
    else break;
  }
  return columns;
}

/** One decoration for each depth: the line moved right by its leading columns, and
 * its first part moved back, so that only what wraps starts under the line's text. */
const hangs = new Map<number, Decoration>();
function hang(columns: number): Decoration {
  let decoration = hangs.get(columns);
  if (!decoration) {
    decoration = Decoration.line({
      attributes: { style: `padding-left: calc(${columns}ch + 6px); text-indent: -${columns}ch` },
    });
    hangs.set(columns, decoration);
  }
  return decoration;
}

function hanging(view: EditorView): DecorationSet {
  const ranges = [];
  for (const { from, to } of view.visibleRanges) {
    for (let at = from; at <= to; ) {
      const line = view.state.doc.lineAt(at);
      const columns = leadingColumns(line.text);
      if (columns > 0) ranges.push(hang(columns).range(line.from));
      at = line.to + 1;
    }
  }
  return Decoration.set(ranges);
}

/** The code's letter (D223): the page's --mono at its width, over CodeMirror's own
 * monospace, which a rule of the stylesheet cannot outweigh. */
const letter = EditorView.theme({
  '.cm-scroller': { fontFamily: 'var(--mono)', fontStretch: 'var(--mono-stretch)' },
});

/** The hanging indent of wrapped lines, for every line, code and comment alike. */
const hangingIndent = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = hanging(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) this.decorations = hanging(update.view);
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

export function createEditor(parent: HTMLElement, options: EditorOptions): Editor {
  const running = markedLine('running');
  const error = markedLine('error');

  const marks = gutter({
    class: 'cm-kydux-marks',
    markers: (view) => RangeSet.join([running.markers(view.state), error.markers(view.state)]),
    initialSpacer: () => new Mark('running'),
  });

  const run = Prec.highest(
    keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          options.onRun?.();
          return true;
        },
      },
    ]),
  );

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: options.doc,
      extensions: [
        run,
        marks,
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        // A long line goes on below, with no line number of its own, under its text.
        EditorView.lineWrapping,
        hangingIndent,
        letter,
        python(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        indentUnit.of('    '),
        EditorState.tabSize.of(4),
        ...(options.complete
          ? [autocompletion({ override: [options.complete], activateOnTyping: true })]
          : []),
        keymap.of([
          ...closeBracketsKeymap,
          ...completionKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
        ]),
        running.extension,
        error.extension,
        EditorView.contentAttributes.of({
          'aria-label': options.label ?? '',
          autocapitalize: 'off',
          autocorrect: 'off',
          spellcheck: 'false',
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) options.onChange?.(update.state.doc.toString());
        }),
      ],
    }),
  });

  return {
    view,
    getDoc: () => view.state.doc.toString(),
    setDoc(text) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
    },
    setRunningLine(line) {
      view.dispatch({ effects: running.set.of(line) });
    },
    setErrorLine(line) {
      view.dispatch({ effects: error.set.of(line) });
    },
    showLine(line) {
      const scroll = lineScroll(view.state, line, view.defaultLineHeight);
      if (scroll && !wholeInSight(view, line)) view.dispatch(scroll);
    },
    insertLine(text) {
      const line = view.state.doc.lineAt(view.state.selection.main.head);
      const blank = line.text.trim() === '';
      const indent = /^\s*/.exec(line.text)?.[0] ?? '';
      const insert = blank ? `${indent}${text}` : `\n${indent}${text}`;
      const from = blank ? line.from : line.to;
      const to = blank ? line.to : line.to;
      view.dispatch({ changes: { from, to, insert }, selection: { anchor: from + insert.length } });
      view.focus();
    },
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
