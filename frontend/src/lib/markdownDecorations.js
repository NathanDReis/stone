import { syntaxTree } from "@codemirror/language";
import { Decoration, ViewPlugin } from "@codemirror/view";
import {
  BulletWidget,
  ImageWidget,
  LinkWidget,
  TaskWidget,
  AlertWidget,
} from "./widgets";

const linesTitles = ["ATXHeading1", "ATXHeading2", "ATXHeading3", "ATXHeading4", "ATXHeading5", "ATXHeading6"];
const linesMark = ["EmphasisMark", "StrongEmphasisMark", "CodeMark", "HeaderMark", "CodeInfo"];

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
          if (node.name.toLowerCase() === "blockquote") {
            const lineFromNum = view.state.doc.lineAt(node.from).number;
            const lineToNum = view.state.doc.lineAt(node.to).number;

            const firstLineText = view.state.doc.line(lineFromNum).text;
            let activeType = firstLineText.match(/^\s*>\s*\[!(info|success|warning|error)\]/i) ? null : "default";

            for (let i = lineFromNum; i <= lineToNum; i++) {
              const line = view.state.doc.line(i);
              const text = line.text;
              const match = text.match(/^\s*>\s*\[!(info|success|warning|error)\]/i);

              if (match) {
                activeType = match[1].toLowerCase();
              }

              if (activeType) {
                const classes = [`cm-md-blockquote-alert`, `cm-alert-${activeType}`];

                const nextLine = (i < lineToNum) ? view.state.doc.line(i + 1) : null;
                const nextMatch = nextLine ? nextLine.text.match(/^\s*>\s*\[!(info|success|warning|error)\]/i) : null;

                if (i === lineFromNum || match) classes.push("cm-alert-line-top");
                if (i === lineToNum || nextMatch) classes.push("cm-alert-line-bottom");
                if (!(i === lineFromNum || match) && !(i === lineToNum || nextMatch)) {
                  classes.push("cm-alert-line-middle");
                }

                decorations.push(
                  Decoration.line({
                    attributes: { class: classes.join(" ") }
                  }).range(line.from)
                );

                const isCursorOnLine = ranges.some(
                  r => r.from <= line.to && r.to >= line.from
                );

                if (!isCursorOnLine) {
                  const quoteMatch = text.match(/^\s*>\s*/);
                  if (quoteMatch) {
                    pushSafe(decorations, safeMark(line.from, line.from + quoteMatch[0].length, "cm-md-hidden"));
                  }

                  if (match) {
                    const bracketStartOffset = text.indexOf("[!");
                    const bracketEndOffset = text.indexOf("]", bracketStartOffset);
                    if (bracketStartOffset !== -1 && bracketEndOffset !== -1) {
                      const from = line.from + bracketStartOffset;
                      const to = line.from + bracketEndOffset + 1;
                      pushSafe(decorations, safeMark(from, to, "cm-md-hidden"));
                    }
                  }
                }

                if (match || (i === lineFromNum && activeType === "default")) {
                  decorations.push(
                    Decoration.widget({
                      widget: new AlertWidget(activeType),
                      side: -1
                    }).range(line.from)
                  );
                }
              }
            }
          }

          if (node.name === "InlineCode") {
            pushSafe(decorations, safeMark(node.from, node.to, "cm-md-inline-code"));
          }

          if (node.name === "FencedCode") {
            const lineFrom = view.state.doc.lineAt(node.from).number;
            const lineTo = view.state.doc.lineAt(node.to).number;

            for (let i = lineFrom; i <= lineTo; i++) {
              const line = view.state.doc.line(i);
              decorations.push(
                Decoration.line({
                  attributes: { class: "cm-md-code-block-line" }
                }).range(line.from)
              );
            }
          }

          if (node.name === "HorizontalRule") {
            const isCursorInside = ranges.some(
              r => r.from <= node.to && r.to >= node.from
            );

            if (!isCursorInside) {
              const line = view.state.doc.lineAt(node.from);
              decorations.push(
                Decoration.line({
                  attributes: { class: "cm-md-hr-line" }
                }).range(line.from)
              );
              pushSafe(decorations, safeMark(node.from, node.to, "cm-md-hidden"));
            }
          }

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

            if (href.toLowerCase().endsWith('.pdf') || href.toLowerCase().match(/\.pdf(?:#page=\d+)?$/)) {
              return;
            }

            const isCursorInside = ranges.some(r =>
              r.from <= node.to && r.to >= node.from
            );

            if (!isCursorInside) {
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

          const skipNode = ["InlineCode", "FencedCode", "CodeMark", "Link", "Image", "HeaderMark", "CodeInfo", "HTMLBlock", "Comment"].includes(node.name);
          if (!skipNode) {
            regex = /(?:^|\s)(#[a-zA-Z_áàâãéèêíïóôõöúçñ][a-zA-Z\d_áàâãéèêíïóôõöúçñ\-_/]*)/g;
            while ((match = regex.exec(text))) {
              const fullMatch = match[0];
              const tagPart = match[1];
              const startOffset = match.index + (fullMatch.startsWith("#") ? 0 : 1);
              const from = node.from + startOffset;
              const to = from + tagPart.length;

              pushSafe(decorations, safeMark(from, to, "cm-md-tag"));
            }
          }
        },
      });

      decorations.sort((a, b) =>
        a.from === b.from ? (a.value.startSide || 0) - (b.value.startSide || 0) : a.from - b.from
      );

      return Decoration.set(decorations);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
