import { ViewPlugin, Decoration } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { PdfWidget } from "./widgets/PdfWidget";

const pdfPlugin = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = this.buildDecorations(view);
    }

    update(update) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view) {
        const builder = new RangeSetBuilder();

        for (let { from, to } of view.visibleRanges) {
            const text = view.state.doc.sliceString(from, to);
            const regex = /(!?\[\[([^\]]+\.pdf)(?:#page=(\d+))?\]\])|(\[([^\]]+)\]\(([^)]+\.pdf)(?:#page=(\d+))?\))/gi;

            let match;
            while ((match = regex.exec(text))) {
                const start = from + match.index;
                const end = start + match[0].length;

                let url, page = 1;

                if (match[1]) {
                    url = match[2];
                    if (match[3]) page = parseInt(match[3], 10);
                } else {
                    url = match[6];
                    if (match[7]) page = parseInt(match[7], 10);
                }

                const widget = new PdfWidget(url);
                if (page > 1) widget.currentPage = page;

                builder.add(start, end, Decoration.replace({
                    widget,
                    inclusive: false
                }));
            }
        }

        return builder.finish();
    }
}, {
    decorations: v => v.decorations
});

export { pdfPlugin };
