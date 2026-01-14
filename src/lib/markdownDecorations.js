import { syntaxTree } from "@codemirror/language";
import { Decoration, ViewPlugin } from "@codemirror/view";

import { WidgetType } from "@codemirror/view";

class TaskWidget extends WidgetType {
  constructor(view, checked) {
    super();
    this.view = view;
    this.checked = checked;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-task-widget";
    span.textContent = this.checked ? "✅" : "🟩";

    span.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    span.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const view = this.view;
      const pos = view.posAtDOM(span);
      const line = view.state.doc.lineAt(pos);

      const match = line.text.match(/\[( |x|X)\]/);
      if (!match) return;

      const from = line.from + match.index;
      const to = from + match[0].length;

      view.dispatch({
        changes: {
          from,
          to,
          insert: this.checked ? "[ ]" : "[x]"
        }
      });
    };

    return span;
  }

  ignoreEvent() {
    return false;
  }
}

class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-bullet-widget";
    span.textContent = "•";
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

export const markdownDecorations = ViewPlugin.fromClass(
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

                    if (node.name === "ListItem") {
                        const isCursorInside = ranges.some(
                            r => r.from <= node.to && r.to >= node.from
                        );

                        if (!isCursorInside) {
                            const text = view.state.sliceDoc(node.from, node.to);

                            const taskMatch = text.match(/^(\s*[-*+]\s+)(\[[ xX]\])/);
                            if (taskMatch) {
                                const markerLen = taskMatch[1].length;
                                const boxLen = taskMatch[2].length;
                                const isChecked = taskMatch[2].toLowerCase().includes("x");

                                const boxFrom = node.form + markerLen;
                                const boxTo = boxFrom + boxLen;

                                decorations.push(
                                    Decoration.replace({
                                        widget: new TaskWidget(view, isChecked),
                                        inclusive: false
                                    }).range(node.from, node.from + markerLen + boxLen)
                                );

                                return;
                            }

                            const bulletMatch = text.match(/^(\s*[-*+])\s/);
                            if (bulletMatch) {
                            const markerLen = bulletMatch[1].length;

                            decorations.push(
                                Decoration.replace({
                                    widget: new BulletWidget(),
                                    inclusive: false
                                }).range(node.from, node.from + markerLen)
                            );
                            }
                        }
                    }

if (node.name === "InlineCode") return;

const text = view.state.sliceDoc(node.from, node.to);
const regex = /==([^\s=][^=]*?)==/g;

let match;
while ((match = regex.exec(text))) {
  const full = match[0];     // ==texto==
  const inner = match[1];   // texto

  // 🚫 ignora se terminar com espaço
  if (inner.endsWith(" ")) continue;

  const from = node.from + match.index;
  const to = from + full.length;

  decorations.push(
    Decoration.mark({ class: "cm-md-highlight" })
      .range(from, to)
  );

  const isCursorInside = ranges.some(r =>
    r.from <= to && r.to >= from
  );

  if (!isCursorInside) {
    // esconde os ==
    decorations.push(
      Decoration.mark({ class: "cm-md-hidden" })
        .range(from, from + 2)
    );
    decorations.push(
      Decoration.mark({ class: "cm-md-hidden" })
        .range(to - 2, to)
    );
  }
}

                },
            });

            decorations.sort((a, b) =>
              a.from === b.from ? a.startSide - b.startSide : a.from - b.from
            );

            return Decoration.set(decorations);
        }
    },
    {
        decorations: (v) => v.decorations,
    }
);
