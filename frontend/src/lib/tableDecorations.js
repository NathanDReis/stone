import { StateField } from "@codemirror/state";
import { EditorView, Decoration } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TableWidget } from "./widgets/TableWidget";

export const tableDecorations = StateField.define({
  create(state) {
    return buildDecorations(state);
  },

  update(deco, tr) {
    if (tr.docChanged || tr.selection || tr.reconfigured) {
      return buildDecorations(tr.state);
    }
    return deco;
  },

  provide: f => EditorView.decorations.from(f),
});

function buildDecorations(state) {
  const decorations = [];
  const ranges = state.selection.ranges;

  syntaxTree(state).iterate({
    enter(node) {
      if (node.name !== "Table") return;

      const cursorInside = ranges.some(
        r => r.from >= node.from && r.to <= node.to
      );
      if (cursorInside) return;

      const text = state.sliceDoc(node.from, node.to);
      const rows = text
        .trim()
        .split("\n")
        .filter(l => !/^\|\s*-+/.test(l))
        .map(line =>
          line
            .slice(1, -1)
            .split("|")
            .map(c => c.trim())
        );

      if (!rows.length) return;

      const from = state.doc.lineAt(node.from).from;
      const to = state.doc.lineAt(node.to).to;

      decorations.push(
        Decoration.replace({
          widget: new TableWidget(rows, from, to, state.readOnly),
          block: true,
        }).range(from, to)
      );
    },
  });

  return Decoration.set(decorations, true);
}
