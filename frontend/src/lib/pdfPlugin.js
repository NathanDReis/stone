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
        /(!?\[\[([^\]]+\.pdf)(?:#page=(\d+))?\]\])|(\[([^\]]+)\]\(([^)]+\.pdf)(?:#page=(\d+))?\))/gi;

      let match;
      while ((match = regex.exec(text))) {
        const start = from + match.index;
        const end = start + match[0].length;

        let url, page = 1, linkText = null;

        if (match[1]) {
          // Wikilink format: [[file.pdf]]
          url = match[2];
          linkText = match[2].split('/').pop();
          if (match[3]) page = parseInt(match[3], 10);
        } else {
          // Markdown link format: [text](file.pdf)
          url = match[6];
          linkText = match[5];
          if (match[7]) page = parseInt(match[7], 10);
        }

        const isCursorInside = ranges.some(
          r => r.from <= end && r.to >= start
        );

        const widget = new PdfWidget(url, linkText, view, start, end);
        if (page > 1) widget.currentPage = page;

        if (!isCursorInside) {
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
