import { StateField } from "@codemirror/state";
import { EditorView, Decoration } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TableWidget } from "./widgets/TableWidget";

export const tableDecorations = StateField.define({
  create(state) {
    return build(state);
  },

  update(deco, tr) {
    if (tr.docChanged || tr.selection) {
      return build(tr.state);
    }
    return deco;
  },

  provide: f => EditorView.decorations.from(f)
});

function build(state) {
  const decorations = [];
  const ranges = state.selection.ranges;

  syntaxTree(state).iterate({
    enter(node) {
      if (node.name !== "Table") return;

      const cursorInside = ranges.some(r =>
        r.from >= node.from && r.to <= node.to
      );
      if (cursorInside) return;

      const text = state.sliceDoc(node.from, node.to);

      const rows = text
        .trim()
        .split("\n")
        .filter(l => !/^\|\s*-+/.test(l))
        .map(row =>
          row
            .slice(1, -1)
            .split("|")
            .map(c => c.trim())
        );

      const startLine = state.doc.lineAt(node.from);

      decorations.push(
        Decoration.widget({
          widget: new TableWidget(rows),
          block: true
        }).range(startLine.from)
      );

      let pos = node.from;
      while (pos < node.to) {
        const line = state.doc.lineAt(pos);

        decorations.push(
          Decoration.line({
            attributes: { class: "cm-md-table-hidden" }
          }).range(line.from)
        );

        pos = line.to + 1;
      }
    }
  });

  return Decoration.set(decorations, true);
}
