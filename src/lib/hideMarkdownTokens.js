import { syntaxTree } from "@codemirror/language";
import { Decoration, ViewPlugin } from "@codemirror/view";

export const hideMarkdownTokens = ViewPlugin.fromClass(
  class {
    decorations;

    constructor(view) {
      this.decorations = this.build(view);
    }

    update(update) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = this.build(update.view);
      }
    }

    build(view) {
      const decorations = [];
      const ranges = view.state.selection.ranges;

      syntaxTree(view.state).iterate({
        enter(node) {
          if (
            node.name === "EmphasisMark" ||
            node.name === "StrongEmphasisMark" ||
            node.name === "CodeMark" ||
            node.name === "HeaderMark"
          ) {
            const parent = node.node.parent;

            const checkRange = parent || node;

            const isCursorInside = ranges.some(r =>
              r.from <= checkRange.to && r.to >= checkRange.from
            );

            if (!isCursorInside) {
              decorations.push(
                Decoration.mark({ class: "cm-md-hidden" })
                  .range(node.from, node.to)
              );
            }
          }
        }
      });

      return Decoration.set(decorations);
    }
  },
  {
    decorations: v => v.decorations
  }
);
