import { syntaxTree } from "@codemirror/language";
import { Decoration, ViewPlugin } from "@codemirror/view";
import {
  BulletWidget,
  ImageWidget,
  LinkWidget,
  TaskWidget,
} from "./widgets";

const linesTitles = ["ATXHeading1","ATXHeading2","ATXHeading3","ATXHeading4","ATXHeading5","ATXHeading6"];
const linesMark = ["EmphasisMark","StrongEmphasisMark","CodeMark","HeaderMark"];

function safeMark(from, to, className) {
  if (from >= to) return null;
  return Decoration.mark({ class: className }).range(from, to);
}

function pushSafe(arr, deco) {
  if (deco) arr.push(deco);
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
                    if (node.name === "InlineCode") return;

                    if (linesMark.includes(node.name)) {
                        const parent = node.node.parent;

                        const checkRange = parent || node;

                        const isCursorInside = ranges.some(r =>
                          r.from <= checkRange.to && r.to >= checkRange.from
                        );

                        if (!isCursorInside) {
                          pushSafe(decorations, safeMark(node.from, node.to, "cm-md-hidden"));
                        }
                    }

                    if (linesTitles.includes(node.name)) {
                      const line = view.state.doc.lineAt(node.from);

                      decorations.push(
                        Decoration.line({
                          attributes: {
                            class: "cm-heading-line"
                          }
                        }).range(line.from)
                      );
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

                            const line = view.state.doc.lineAt(node.from);

                            const contentFrom = node.from + markerLen + boxLen + 1;
                            const contentTo = line.to;

                            decorations.push(
                              Decoration.replace({
                                widget: new TaskWidget(view, isChecked),
                                inclusive: false
                              }).range(node.from, node.from + markerLen + boxLen)
                            );

                            if (isChecked) {
                              pushSafe(decorations, safeMark(contentFrom, contentTo, "cm-md-strike"));
                            }

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
                  
                  if (node.name === "Image") {
                    const text = view.state.sliceDoc(node.from, node.to);
                    const match = /!\[([^\]]*)\]\(([^)]+)\)/.exec(text);
                    if (!match) return;

                    const src = match[2];

                    const isCursorInside = ranges.some(r =>
                      r.from <= node.to && r.to >= node.from
                    );

                    if (!isCursorInside) {
                      decorations.push(
                        Decoration.replace({
                          widget: new ImageWidget(src),
                          inclusive: false
                        }).range(node.from, node.to)
                      );
                    }
                  }

                  if (node.name === "Link") {
                    const text = view.state.sliceDoc(node.from, node.to);

                    const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(text);
                    if (!match) return;

                    const label = match[1];
                    const href = match[2];

                    const isCursorInside = ranges.some(r =>
                      r.from <= node.to && r.to >= node.from
                    );

                    if (!isCursorInside) {
                      // Substitui tudo pelo texto clicável
                      decorations.push(
                        Decoration.replace({
                          widget: new LinkWidget(view, label, href),
                          inclusive: false
                        }).range(node.from, node.to)
                      );
                    }

                    return;
                  }

                  const text = view.state.sliceDoc(node.from, node.to);
                  let regex = /==([^\s=][^=]*?)==/g;

                  let match;
                  while ((match = regex.exec(text))) {
                    const full = match[0];
                    const inner = match[1];

                    if (inner.endsWith(" ")) continue;

                    const from = node.from + match.index;
                    const to = from + full.length;

                    pushSafe(decorations, safeMark(from, to, "cm-md-highlight"));

                    const isCursorInside = ranges.some(r =>
                      r.from <= to && r.to >= from
                    );

                    if (!isCursorInside) {
                      pushSafe(decorations, safeMark(from, from + 2, "cm-md-hidden"));
                      pushSafe(decorations, safeMark(to - 2, to, "cm-md-hidden"));
                    }
                  }

                  regex = /~~([^\s~][^~]*?)~~/g;

                  match;
                  while ((match = regex.exec(text))) {
                    const full = match[0];
                    const inner = match[1];

                    if (inner.endsWith(" ")) continue;

                    const from = node.from + match.index;
                    const to = from + full.length;

                    pushSafe(decorations, safeMark(from, to, "cm-md-strike"));

                    const isCursorInside = ranges.some(r =>
                      r.from <= to && r.to >= from
                    );

                    if (!isCursorInside) {
                      pushSafe(decorations, safeMark(from, from + 2, "cm-md-hidden"));
                      pushSafe(decorations, safeMark(to - 2, to, "cm-md-hidden"));
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
