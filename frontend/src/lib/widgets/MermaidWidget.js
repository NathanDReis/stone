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
import { Toast } from "../../ui/Toast";

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

            let endPos = pos;
            let foundEnd = false;

            const line = doc.lineAt(pos);
            if (!line.text.trim().startsWith("```")) {
                return Toast.warning(`Não foi possível encontrar o início do bloco na pos: ${pos}`)
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
                    const targetPos = Math.min(pos + 1, view.state.doc.length);

                    view.dispatch({
                        selection: { anchor: targetPos },
                        scrollIntoView: true
                    });
                    view.focus();
                }
            } catch (e) {
                Toast.warning("Não foi possível determinar a posição do widget Mermaid");
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
            Toast.error("Falha na renderização do Mermaid");
            container.innerHTML = `
                <div class="mermaid-error" style="cursor: pointer; padding: 1rem; border: 1px solid #ef4444; border-radius: 6px; background: rgba(239, 68, 68, 0.1);">
                    <div style="color: #ef4444; font-weight: bold; margin-bottom: 0.5rem;">Erro de Renderização (Clique para editar)</div>
                    <pre style="color: #ef4444; font-size: 0.8rem; white-space: pre-wrap; margin: 0;">${error.message}</pre>
                </div>
            `;
        }
    }

    ignoreEvent(event) {
        return true;
    }
}
