import { ViewPlugin, Decoration } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { InternalLinkWidget } from "./widgets/InternalLinkWidget";

export const createInternalLinkPlugin = (linkResolver, onNavigate) => {
    return ViewPlugin.fromClass(class {
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

                // Match all [[ ]] patterns
                const regex = /\[\[([^\]]+)\]\]/g;

                let match;
                while ((match = regex.exec(text))) {
                    const start = from + match.index;
                    const end = start + match[0].length;
                    const content = match[1];

                    const isCursorInside = ranges.some(
                        r => r.from <= end && r.to >= start
                    );

                    if (!isCursorInside) {
                        const widget = new InternalLinkWidget(
                            content,
                            linkResolver,
                            onNavigate,
                            view,
                            start,
                            end
                        );

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
};
