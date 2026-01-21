import { WidgetType } from "@codemirror/view";
import mermaid from "mermaid";

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
    }
});

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
        div.style.cursor = "pointer";
        div.setAttribute("title", "Click to edit source");

        div.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const pos = view.posAtDOM(div);
            if (pos !== null) {
                view.dispatch({
                    selection: { anchor: pos },
                    scrollIntoView: true
                });
                view.focus();
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
            container.innerHTML = `<span style="color: #ef4444; font-size: 0.8rem;">Syntax Error: ${error.message}</span>`;

            const errorDiv = document.querySelector("#" + this.id);
            if (errorDiv) errorDiv.remove();
        }
    }

    ignoreEvent(event) {
        return true;
    }
}
