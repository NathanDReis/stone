import { ViewPlugin, Decoration } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { PdfWidget } from "./widgets/PdfWidget";

const pdfPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.buildDecorations(view);
  }

  update(update) {
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

buildDecorations(view) {
  const builder = new RangeSetBuilder();
  const ranges = view.state.selection.ranges;

  for (let { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);

    const regex =
      /\[([^\]]+)\]\(([^)]+\.pdf)(?:#page=(\d+))?\)/gi;

    let match;
    while ((match = regex.exec(text))) {
      const start = from + match.index;
      const end = start + match[0].length;

      const linkText = match[1];
      const url = match[2];
      const page = match[3] ? parseInt(match[3], 10) : 1;

      const isCursorInside = ranges.some(
        r => r.from <= end && r.to >= start
      );

      if (!isCursorInside) {
        const widget = new PdfWidget(url, linkText, view, start, end);
        widget.currentPage = page;

        builder.add(
          start,
          end,
          Decoration.replace({
            widget,
            inclusive: false
          })
        );
      }
    }
  }

  return builder.finish();
}

}, {
  decorations: v => v.decorations
});

export { pdfPlugin };
