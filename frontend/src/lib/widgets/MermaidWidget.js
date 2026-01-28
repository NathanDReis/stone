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
    updateEdgeText,
    invertEdgeDirection,
    getGraphOrientation,
    updateGraphOrientation,
    getBackgroundColor,
    updateBackgroundColor,
    getContrastColor,
    updateNodeColor
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
        if (!this.div) {
            this.div = document.createElement("div");
            this.div.className = "mermaid-widget";
            this.div.style.position = "relative";
            this.div.style.cursor = "default";

            const settingsBtn = document.createElement("button");
            settingsBtn.className = "mermaid-block-settings-btn";
            settingsBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"/></svg>
            `;
            settingsBtn.title = "Configurações do Diagrama";
            this.div.appendChild(settingsBtn);

            settingsBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const parsed = parseMermaid(this.code);
                const orientation = getGraphOrientation(this.code);
                const currentBg = getBackgroundColor(this.code);

                editorUI.show(
                    e.clientX,
                    e.clientY,
                    null,
                    parsed.nodes,
                    parsed.edges,
                    this.getCallbacks(view, this.div),
                    orientation,
                    currentBg,
                    'global'
                );
            };

            const handleEdgeInteraction = (e) => {
                const edgePath = e.target.closest('.edgePath, .flowchart-link, .edge-paths path');
                const edgeLabelBoundary = e.target.closest('.edgeLabel, .edge-labels .label, .label, .label-container');
                const edgeElement = edgePath || edgeLabelBoundary;

                if (edgeElement) {
                    e.preventDefault();
                    e.stopPropagation();

                    const parsed = parseMermaid(this.code);
                    let matchedEdge = null;

                    let current = edgeElement;
                    let foundByClasses = false;
                    while (current && current !== this.div && !foundByClasses) {
                        const classes = Array.from(current.classList).join(" ");
                        matchedEdge = parsed.edges.find(edge => {
                            return classes.includes(`LS-${edge.from}`) && classes.includes(`LE-${edge.to}`);
                        });
                        if (matchedEdge) {
                            foundByClasses = true;
                            break;
                        }
                        current = current.parentElement;
                    }

                    if (!matchedEdge) {
                        current = edgeElement;
                        while (current && current !== this.div) {
                            const id = current.id || "";
                            matchedEdge = parsed.edges.find(edge => {
                                return id.includes(edge.from) && id.includes(edge.to);
                            });
                            if (matchedEdge) break;
                            current = current.parentElement;
                        }
                    }

                    if (!matchedEdge && edgeLabelBoundary) {
                        const labelText = edgeLabelBoundary.innerText.trim();
                        if (labelText) {
                            matchedEdge = parsed.edges.find(edge =>
                                edge.label && edge.label.trim().toLowerCase() === labelText.toLowerCase()
                            );
                        }
                    }

                    if (matchedEdge) {
                        const orientation = getGraphOrientation(this.code);
                        const currentBg = getBackgroundColor(this.code);
                        editorUI.show(
                            e.clientX,
                            e.clientY,
                            matchedEdge,
                            parsed.nodes,
                            parsed.edges,
                            this.getCallbacks(view, this.div),
                            orientation,
                            currentBg,
                            'edge'
                        );
                        return true;
                    }
                }
                return false;
            };

            this.div.oncontextmenu = (e) => {
                if (handleEdgeInteraction(e)) return;
            };

            this.div.onclick = (e) => {
                const nodeElement = e.target.closest('.node');

                if (nodeElement) {
                    e.preventDefault();
                    e.stopPropagation();
                    const fullId = nodeElement.id;
                    const parsed = parseMermaid(this.code);

                    const matchedNode = parsed.nodes.find(n => {
                        if (n.id === fullId) return true;
                        return fullId.includes(n.id);
                    });

                    if (matchedNode) {
                        const orientation = getGraphOrientation(this.code);
                        const currentBg = getBackgroundColor(this.code);
                        editorUI.show(
                            e.clientX,
                            e.clientY,
                            matchedNode,
                            parsed.nodes,
                            parsed.edges,
                            this.getCallbacks(view, this.div),
                            orientation,
                            currentBg,
                            'node'
                        );
                        return;
                    }
                }

                if (handleEdgeInteraction(e)) return;

                try {
                    const pos = view.posAtDOM(this.div);
                    if (pos !== null) {
                        const targetPos = Math.min(pos + 1, view.state.doc.length);
                        view.dispatch({
                            selection: { anchor: targetPos },
                            scrollIntoView: true
                        });
                        view.focus();
                    }
                } catch (e) {
                    console.warn("Failed to focus mermaid widget", e);
                }
            };

            this.container = document.createElement("div");
            this.div.appendChild(this.container);
            this.renderMermaid(this.container);
        }

        return this.div;
    }

    update(other) {
        if (other.code !== this.code) {
            this.code = other.code;
            this.renderMermaid(this.container);
        }
        return true;
    }

    getCallbacks(view, div) {
        const updateCode = (newCode) => {
            setTimeout(() => {
                const pos = view.posAtDOM(div);
                if (pos === null) return;

                const doc = view.state.doc;
                const line = doc.lineAt(pos);

                if (!line.text.trim().startsWith("```")) {
                    console.warn("Posição do widget Mermaid não coincide com um bloco de código");
                    return;
                }

                let endPos = pos;
                let foundEnd = false;
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
            }, 0);
        };

        return {
            onUpdateNode: (id, data) => {
                let newCode = this.code;
                if (data.label !== undefined) newCode = updateNodeLabel(newCode, id, data.label);
                if (data.shape !== undefined) newCode = updateNodeShape(newCode, id, data.shape);
                if (data.color !== undefined) newCode = updateNodeColor(newCode, id, data.color);
                updateCode(newCode);
            },
            onAddConnection: (from, to, type, label) => {
                const newCode = addConnection(this.code, from, to, type, label);
                updateCode(newCode);
            },
            onRemoveConnection: (from, to) => {
                const newCode = removeConnection(this.code, from, to);
                updateCode(newCode);
            },
            onUpdateEdge: (from, to, data) => {
                let newCode = this.code;
                if (data.type !== undefined) newCode = updateEdgeType(newCode, from, to, data.type);
                if (data.text !== undefined) newCode = updateEdgeText(newCode, from, to, data.text);
                updateCode(newCode);
            },
            onInvertEdge: (from, to) => {
                const newCode = invertEdgeDirection(this.code, from, to);
                updateCode(newCode);
            },
            onUpdateOrientation: (newOrientation) => {
                const newCode = updateGraphOrientation(this.code, newOrientation);
                updateCode(newCode);
            },
            onUpdateBackground: (newColor) => {
                const newCode = updateBackgroundColor(this.code, newColor);
                updateCode(newCode);
            }
        };
    }

    async renderMermaid(container) {
        try {
            const bgColor = getBackgroundColor(this.code);
            const contrastColor = getContrastColor(bgColor);

            if (bgColor) {
                container.parentElement.style.background = bgColor;
            } else {
                container.parentElement.style.background = "";
            }

            const themeVariables = {
                fontFamily: 'Inter, sans-serif',
                primaryColor: bgColor ? (contrastColor === '#ffffff' ? '#374151' : '#e5e7eb') : '#2b2d31',
                primaryTextColor: contrastColor || '#d1d5db',
                primaryBorderColor: contrastColor || '#4b5563',
                lineColor: contrastColor || '#9ca3af',
                secondaryColor: '#1e1e2e',
                tertiaryColor: '#1e1e2e'
            };

            mermaid.initialize({
                startOnLoad: false,
                theme: 'base',
                securityLevel: 'loose',
                themeVariables,
                flowchart: { htmlLabels: true }
            });

            const { svg } = await mermaid.render(this.id, this.code);
            container.innerHTML = svg;

            if (contrastColor) {
                container.querySelectorAll('.edgeLabel, .edgePath path').forEach(el => {
                    if (el.tagName === 'path') el.style.stroke = contrastColor;
                    else el.style.color = contrastColor;
                });
            }

            const nodes = container.querySelectorAll('.node');
            nodes.forEach(node => {
                const parsed = parseMermaid(this.code);
                const nodeData = parsed.nodes.find(n => node.id.includes(n.id));

                if (nodeData && nodeData.color) {
                    const nodeContrast = getContrastColor(nodeData.color);
                    const label = node.querySelector('.nodeLabel, text');
                    if (label) {
                        label.style.setProperty('color', nodeContrast, 'important');
                        label.style.setProperty('fill', nodeContrast, 'important');
                    }
                }
            });
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
