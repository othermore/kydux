// The child's editor: CodeMirror with Python, four spaces to an indent, the
// line being played lit, and the line of an error marked, each also in the
// gutter.

import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from '@codemirror/language';
import { EditorState, type Extension, Prec, RangeSet, StateEffect, StateField } from '@codemirror/state';
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
} from '@codemirror/view';

export interface Editor {
  getDoc(): string;
  setDoc(text: string): void;
  /** Lights a line, 1-based, as the one being played; null for none. */
  setRunningLine(line: number | null): void;
  /** Marks a line, 1-based, as the one an error came from; null for none. */
  setErrorLine(line: number | null): void;
  focus(): void;
  destroy(): void;
  readonly view: EditorView;
}

export interface EditorOptions {
  doc: string;
  onChange?: (doc: string) => void;
  onCast?: () => void;
  /** The editor's name for screen readers. */
  label?: string;
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

export function createEditor(parent: HTMLElement, options: EditorOptions): Editor {
  const running = markedLine('running');
  const error = markedLine('error');

  const marks = gutter({
    class: 'cm-kydux-marks',
    markers: (view) => RangeSet.join([running.markers(view.state), error.markers(view.state)]),
    initialSpacer: () => new Mark('running'),
  });

  const cast = Prec.highest(
    keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          options.onCast?.();
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
        cast,
        marks,
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        python(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        indentUnit.of('    '),
        EditorState.tabSize.of(4),
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
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
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
