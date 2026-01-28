import { syntaxTree } from "@codemirror/language";
import { Decoration, EditorView } from "@codemirror/view";
import { StateField } from "@codemirror/state";
import { MermaidWidget } from "./widgets/MermaidWidget";

function getMermaidDecorations(state) {
    const widgets = [];
    const ranges = state.selection.ranges;

    syntaxTree(state).iterate({
        enter(node) {
            if (node.name === "FencedCode") {
                const doc = state.doc;
                const text = doc.sliceString(node.from, node.to);
                const lines = text.split("\n");

                const infoLine = lines[0] || "";

                if (!infoLine.trim().toLowerCase().includes("mermaid")) {
                    return;
                }

                const isCursorInside = ranges.some(
                    r => r.from <= node.to && r.to >= node.from
                );

                if (!isCursorInside) {
                    const content = text
                        .replace(/^```mermaid\s*\n?/, "")
                        .replace(/```\s*$/, "")
                        .trim();

                    if (content) {
                        widgets.push(
                            Decoration.replace({
                                widget: new MermaidWidget(content, state.readOnly),
                                inclusive: false,
                                block: true
                            }).range(node.from, node.to)
                        );
                    }
                }
            }
        }
    });

    return Decoration.set(widgets);
}

export const mermaidPlugin = StateField.define({
    create(state) {
        return getMermaidDecorations(state);
    },
    update(decorations, transaction) {
        if (transaction.docChanged || transaction.selection || transaction.reconfigured) {
            return getMermaidDecorations(transaction.state);
        }
        return decorations;
    },
    provide: (field) => EditorView.decorations.from(field)
});
