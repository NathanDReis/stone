import { wrapSelection } from "./wrapSelection";
import { EditorSelection } from "@codemirror/state";

export class ContextMenu {
    constructor(view) {
        this.view = view;
        this.menu = null;
        this.init();
    }

    init() {
        this.view.dom.addEventListener("contextmenu", (e) => this.handleContextMenu(e));
        document.addEventListener("click", () => this.hide());
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") this.hide();
        });
    }

    handleContextMenu(e) {
        e.preventDefault();
        this.show(e.clientX, e.clientY);
    }

    show(x, y) {
        this.hide();

        this.menu = document.createElement("div");
        this.menu.className = "context-menu";

        const items = [
            { label: "Negrito", icon: "B", action: () => wrapSelection(this.view, "**"), shortcut: "Ctrl+B" },
            { label: "Itálico", icon: "I", action: () => wrapSelection(this.view, "*"), shortcut: "Ctrl+I" },
            { label: "Destaque", icon: "H", action: () => wrapSelection(this.view, "=="), shortcut: "Ctrl+H" },
            { label: "Tachado", icon: "S", action: () => wrapSelection(this.view, "~~"), shortcut: "Ctrl+Shift+S" },
            { type: "separator" },
            { label: "Título 1", action: () => this.applyBlock("# ") },
            { label: "Título 2", action: () => this.applyBlock("## ") },
            { label: "Título 3", action: () => this.applyBlock("### ") },
            { type: "separator" },
            { label: "Lista", icon: "•", action: () => this.applyBlock("- ") },
            { label: "Citação", icon: "“", action: () => this.applyBlock("> ") },
            { type: "separator" },
            { label: "Link", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M318-120q-82 0-140-58t-58-140q0-40 15-76t43-64l134-133 56 56-134 134q-17 17-25.5 38.5T200-318q0 49 34.5 83.5T318-200q23 0 45-8.5t39-25.5l133-134 57 57-134 133q-28 28-64 43t-76 15Zm79-220-57-57 223-223 57 57-223 223Zm251-28-56-57 134-133q17-17 25-38t8-44q0-50-34-85t-84-35q-23 0-44.5 8.5T558-726L425-592l-57-56 134-134q28-28 64-43t76-15q82 0 139.5 58T839-641q0 39-14.5 75T782-502L648-368Z"/></svg>`, action: () => this.insertTemplate("[Texto](url)") },
            { label: "Imagem", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"/></svg>`, action: () => this.insertTemplate("![Legenda](url)") },
            { label: "Tabela", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm240-240H200v160h240v-160Zm80 0v160h240v-160H520Zm-80-80v-160H200v160h240Zm80 0h240v-160H520v160ZM200-680h560v-80H200v80Z"/></svg>`, action: () => this.insertTemplate("\n| Coluna 1 | Coluna 2 |\n| -------- | -------- |\n| Valor 1  | Valor 2  |\n") },
        ];

        items.forEach(item => {
            if (item.type === "separator") {
                const sep = document.createElement("div");
                sep.className = "context-menu-separator";
                this.menu.appendChild(sep);
            } else {
                const button = document.createElement("button");
                button.className = "context-menu-item";

                const iconSpan = document.createElement("span");
                iconSpan.className = "context-menu-icon";
                iconSpan.innerHTML = item.icon || "";

                const labelSpan = document.createElement("span");
                labelSpan.className = "context-menu-label";
                labelSpan.textContent = item.label;

                const shortcutSpan = document.createElement("span");
                shortcutSpan.className = "context-menu-shortcut";
                shortcutSpan.textContent = item.shortcut || "";

                button.appendChild(iconSpan);
                button.appendChild(labelSpan);
                button.appendChild(shortcutSpan);

                button.onclick = () => {
                    item.action();
                    this.hide();
                };

                this.menu.appendChild(button);
            }
        });

        document.body.appendChild(this.menu);

        const rect = this.menu.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        if (x + rect.width > winW) x = winW - rect.width - 10;
        if (y + rect.height > winH) y = winH - rect.height - 10;

        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;
        this.menu.classList.add("is-visible");
    }

    hide() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
    }

    applyBlock(prefix) {
        const { state } = this.view;
        const changes = [];
        const ranges = [];

        for (const range of state.selection.ranges) {
            const line = state.doc.lineAt(range.from);
            changes.push({
                from: line.from,
                insert: prefix
            });
            ranges.push(EditorSelection.cursor(range.to + prefix.length));
        }

        this.view.dispatch({
            changes,
            selection: EditorSelection.create(ranges),
            scrollIntoView: true
        });
        this.view.focus();
    }

    insertTemplate(template) {
        const { state } = this.view;
        const main = state.selection.main;

        this.view.dispatch({
            changes: { from: main.from, to: main.to, insert: template },
            selection: { anchor: main.from + template.length },
            scrollIntoView: true
        });
        this.view.focus();
    }
}
