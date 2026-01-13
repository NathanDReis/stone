import { syntaxTree } from "@codemirror/language";
import { Decoration, ViewPlugin } from "@codemirror/view";

import { WidgetType } from "@codemirror/view";

class TaskWidget extends WidgetType {
  constructor(checked) {
    super();
    this.checked = checked;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-task-widget";
    span.textContent = this.checked ? "✅" : "🟩";
    return span;
  }

  ignoreEvent() {
    return true;
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

                            decorations.push(
                                Decoration.replace({
                                widget: new TaskWidget(isChecked),
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
                },
            });

            return Decoration.set(decorations);
        }
    },
    {
        decorations: (v) => v.decorations,
    }
);
