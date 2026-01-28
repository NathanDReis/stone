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
            {
                label: "Lista",
                icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z"/></svg>`,
                submenu: [
                    { label: "Ponto", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-200q-117 0-198.5-81.5T200-480q0-117 81.5-198.5T480-760q117 0 198.5 81.5T760-480q0 117-81.5 198.5T480-200Z"/></svg>`, action: () => this.applyBlock("- ") },
                    { label: "Numérica", icon: "1.", action: () => this.applyBlock("1. ") },
                    { label: "Tarefa", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m424-312 282-282-56-56-226 226-114-114-56 56 170 170ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"/></svg>`, action: () => this.applyBlock("- [ ] ") }
                ]
            },
            {
                label: "Bloco",
                icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M666-440 440-666l226-226 226 226-226 226Zm-546-80v-320h320v320H120Zm400 400v-320h320v320H520Zm-400 0v-320h320v320H120Zm80-480h160v-160H200v160Zm467 48 113-113-113-113-113 113 113 113Zm-67 352h160v-160H600v160Zm-400 0h160v-160H200v160Zm160-400Zm194-65ZM360-360Zm240 0Z"/></svg>`,
                submenu: [
                    { label: "Citação", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m228-240 92-160q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 23-5.5 42.5T458-480L320-240h-92Zm360 0 92-160q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 23-5.5 42.5T818-480L680-240h-92ZM320-500q25 0 42.5-17.5T380-560q0-25-17.5-42.5T320-620q-25 0-42.5 17.5T260-560q0 25 17.5 42.5T320-500Zm360 0q25 0 42.5-17.5T740-560q0-25-17.5-42.5T680-620q-25 0-42.5 17.5T620-560q0 25 17.5 42.5T680-500Zm0-60Zm-360 0Z"/></svg>`, action: () => this.applyBlock("> ") },
                    { label: "Info", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2196f3"><path d="M480-680q-33 0-56.5-23.5T400-760q0-33 23.5-56.5T480-840q33 0 56.5 23.5T560-760q0 33-23.5 56.5T480-680Zm-60 560v-480h120v480H420Z"/></svg>`, action: () => this.applyBlock("> [!info] ") },
                    { label: "Sucesso", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#4caf50"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`, action: () => this.applyBlock("> [!success] ") },
                    { label: "Aviso", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffc107"><path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z"/></svg>`, action: () => this.applyBlock("> [!warning] ") },
                    { label: "Erro", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#f44336"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q54 0 104-17.5t92-50.5L228-676q-33 42-50.5 92T160-480q0 134 93 227t227 93Zm252-124q33-42 50.5-92T800-480q0-134-93-227t-227-93q-54 0-104 17.5T284-732l448 448ZM480-480Z"/></svg>`, action: () => this.applyBlock("> [!error] ") },
                ]
            },
            { label: "Fluxograma", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-80 320-240h80v-160h160v160h80L480-80Zm-320-80v-400h120v400H160Zm0-480v-120h120v120H160Zm200 480v-120h160v120H360Zm320-240v-240h120v240H680Zm0 240v-120h120v120H680Zm-320-560v-120h280v120H360Z"/></svg>`, action: () => this.insertTemplate('```mermaid\ngraph TD;\n    A-->B;\n    A-->C;\n    B-->D;\n    C-->D;\n```\n') },
            { type: "separator" },
            { label: "Link", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M318-120q-82 0-140-58t-58-140q0-40 15-76t43-64l134-133 56 56-134 134q-17 17-25.5 38.5T200-318q0 49 34.5 83.5T318-200q23 0 45-8.5t39-25.5l133-134 57 57-134 133q-28 28-64 43t-76 15Zm79-220-57-57 223-223 57 57-223 223Zm251-28-56-57 134-133q17-17 25-38t8-44q0-50-34-85t-84-35q-23 0-44.5 8.5T558-726L425-592l-57-56 134-134q28-28 64-43t76-15q82 0 139.5 58T839-641q0 39-14.5 75T782-502L648-368Z"/></svg>`, action: () => this.insertTemplate("[Texto](url)") },
            { label: "Imagem", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"/></svg>`, action: () => this.insertTemplate("![Legenda](url)") },
            { label: "Tabela", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm240-240H200v160h240v-160Zm80 0v160h240v-160H520Zm-80-80v-160H200v160h240Zm80 0h240v-160H520v160ZM200-680h560v-80H200v80Z"/></svg>`, action: () => this.insertTemplate("\n| Coluna 1 | Coluna 2 |\n| -------- | -------- |\n| Valor 1  | Valor 2  |\n") },
            { label: "PDF", icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M360-460h40v-80h40q17 0 28.5-11.5T480-580v-40q0-17-11.5-28.5T440-660h-80v200Zm40-120v-40h40v40h-40Zm120 120h80q17 0 28.5-11.5T640-500v-120q0-17-11.5-28.5T600-660h-80v200Zm40-40v-120h40v120h-40Zm120 40h40v-80h40v-40h-40v-40h40v-40h-80v200ZM320-240q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320Zm0-80h480v-480H320v480ZM160-80q-33 0-56.5-23.5T80-160v-560h80v560h560v80H160Zm160-720v480-480Z"/></svg>`, action: () => this.insertTemplate("\n![[url]]") },
        ];

        this.renderItems(this.menu, items);

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

    renderItems(parent, items) {
        items.forEach(item => {
            if (item.type === "separator") {
                const sep = document.createElement("div");
                sep.className = "context-menu-separator";
                parent.appendChild(sep);
            } else {
                const button = document.createElement("div");
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

                if (item.submenu) {
                    const arrow = document.createElement("span");
                    arrow.className = "context-menu-arrow";
                    arrow.textContent = "›";
                    button.appendChild(arrow);
                    button.classList.add("has-submenu");

                    const submenuDiv = document.createElement("div");
                    submenuDiv.className = "context-menu-submenu";
                    this.renderItems(submenuDiv, item.submenu);
                    button.appendChild(submenuDiv);
                } else {
                    button.onclick = (e) => {
                        e.stopPropagation();
                        item.action();
                        this.hide();
                    };
                }

                parent.appendChild(button);
            }
        });
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
