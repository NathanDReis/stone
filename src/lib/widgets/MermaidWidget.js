import { WidgetType } from "@codemirror/view";
import mermaid from "mermaid";
import { MermaidEditorUI } from "../ui/MermaidEditorUI";
import {
    parseMermaid,
    updateNodeLabel,
    updateNodeShape,
    addConnection,
    removeConnection,
    updateEdgeType,
    invertEdgeDirection,
    getGraphOrientation,
    updateGraphOrientation
} from "../mermaidUtils";

mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {
        fontFamily: 'Inter, sans-serif',
        primaryColor: '#2b2d31',
        primaryTextColor: '#d1d5db',
        primaryBorderColor: '#4b5563',
        lineColor: '#9ca3af',
        secondaryColor: '#1e1e2e',
        tertiaryColor: '#1e1e2e'
    },
    flowchart: {
        htmlLabels: true
    }
});

const editorUI = new MermaidEditorUI();

export class MermaidWidget extends WidgetType {
    constructor(code) {
        super();
        this.code = code;
        this.id = "mermaid-" + Math.random().toString(36).substr(2, 9);
    }

    eq(other) {
        return other.code === this.code;
    }

    toDOM(view) {
        const div = document.createElement("div");
        div.className = "mermaid-widget";
        div.style.cursor = "default";
        div.setAttribute("title", "Click diagram background to edit source, or nodes to assist edit");

        const updateCode = (newCode) => {
            const pos = view.posAtDOM(div);
            if (pos === null) return;

            const doc = view.state.doc;
            const textParams = { from: pos };

            let endPos = pos;
            let foundEnd = false;

            const iter = doc.iterRange(pos);

            const line = doc.lineAt(pos);
            if (!line.text.trim().startsWith("```")) {
                console.warn("Could not find start of block at pos", pos);
                return;
            }

            let currentLine = line;
            while (currentLine.number < doc.lines) {
                if (currentLine.number > line.number && currentLine.text.trim().startsWith("```")) {
                    endPos = currentLine.to;
                    foundEnd = true;
                    break;
                }
                currentLine = doc.line(currentLine.number + 1);
            }

            if (foundEnd) {
                const fullReplacement = "```mermaid\n" + newCode + "\n```";
                view.dispatch({
                    changes: { from: line.from, to: endPos, insert: fullReplacement }
                });
            }
        };

        div.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const nodeElement = e.target.closest('.node');

            if (nodeElement) {
                const fullId = nodeElement.id;
                const parsed = parseMermaid(this.code);

                const matchedNode = parsed.nodes.find(n => {
                    if (n.id === fullId) return true;
                    return fullId.includes(n.id);
                });

                if (matchedNode) {
                    const orientation = getGraphOrientation(this.code);
                    editorUI.show(
                        e.clientX,
                        e.clientY,
                        matchedNode,
                        parsed.nodes,
                        parsed.edges,
                        {
                            onUpdateNode: (id, newLabel, newShape) => {
                                let newCode = updateNodeLabel(this.code, id, newLabel);
                                newCode = updateNodeShape(newCode, id, newShape);
                                updateCode(newCode);
                            },
                            onAddConnection: (from, to, type) => {
                                const newCode = addConnection(this.code, from, to, type);
                                updateCode(newCode);
                            },
                            onRemoveConnection: (from, to) => {
                                const newCode = removeConnection(this.code, from, to);
                                updateCode(newCode);
                            },
                            onUpdateEdgeType: (from, to, newType) => {
                                const newCode = updateEdgeType(this.code, from, to, newType);
                                updateCode(newCode);
                            },
                            onInvertEdge: (from, to) => {
                                const newCode = invertEdgeDirection(this.code, from, to);
                                updateCode(newCode);
                            },
                            onUpdateOrientation: (newOrientation) => {
                                const newCode = updateGraphOrientation(this.code, newOrientation);
                                updateCode(newCode);
                            }
                        },
                        orientation
                    );
                    return;
                }
            }

            try {
                const pos = view.posAtDOM(div);
                if (pos !== null) {
                    // Place cursor inside the block to trigger the plugin to remove the decoration
                    // The decoration covers [from, to]. pos is 'from'.
                    // We want to set selection to pos + 1 (inside the code block)
                    // provided the block is not empty.
                    const line = view.state.doc.lineAt(pos);
                    // If it's a replace decoration, the widget replaces the whole range.
                    // Setting cursor at pos should work if 'inclusive' logic allows it,
                    // but the plugin logic `isCursorInside` checks `r.from <= node.to && r.to >= node.from`.
                    // So pos (start) should trigger it if it matches node.from.
                    // But to be safe, let's target inside.

                    const targetPos = Math.min(pos + 1, view.state.doc.length);

                    view.dispatch({
                        selection: { anchor: targetPos },
                        scrollIntoView: true
                    });
                    view.focus();
                }
            } catch (e) {
                console.warn("Could not determine position of Mermaid widget", e);
            }
        };

        const container = document.createElement("div");
        div.appendChild(container);

        this.renderMermaid(container);

        return div;
    }

    async renderMermaid(container) {
        try {
            const { svg } = await mermaid.render(this.id, this.code);
            container.innerHTML = svg;
        } catch (error) {
            console.error("Mermaid rendering failed:", error);
            container.innerHTML = `
                <div class="mermaid-error" style="cursor: pointer; padding: 1rem; border: 1px solid #ef4444; border-radius: 6px; background: rgba(239, 68, 68, 0.1);">
                    <div style="color: #ef4444; font-weight: bold; margin-bottom: 0.5rem;">Erro de Renderização (Clique para editar)</div>
                    <pre style="color: #ef4444; font-size: 0.8rem; white-space: pre-wrap; margin: 0;">${error.message}</pre>
                </div>
            `;
            // Ensure click on error bubbles to main div.onclick
        }
    }

    ignoreEvent(event) {
        // Allow clicks to pass through to our handler, but block other default CM behavior
        // if we want to handle them. For a replacement widget, returning true is usually best
        // to prevent partial selection of the widget content.
        // However, if we want clicks, we must ensure they reach our listener.
        // Events on the DOM node will bubble to our listener regardless of this return value
        // UNLESS CodeMirror intercepts them aggressively.
        // Returning true tells CodeMirror "I handled this (or ignore it), don't do your default processing".
        return true;
    }
}
