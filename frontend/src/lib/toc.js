import { syntaxTree } from "@codemirror/language";
import { EditorView } from "@codemirror/view";

const collapsedPaths = new Set();

export function updateToC(view, fileSystem = null) {
    const container = document.querySelector(".site-index");
    if (!container) return;

    const headings = [];
    const state = view.state;

    syntaxTree(state).iterate({
        enter(node) {
            if (node.name.startsWith("ATXHeading")) {
                const level = parseInt(node.name.replace("ATXHeading", ""));
                const text = state.doc.sliceString(node.from, node.to).replace(/^#+\s*/, "").trim();
                headings.push({ level, text, from: node.from });
            }
        }
    });

    const hierarchy = buildHierarchy(headings);
    renderToC(view, container, hierarchy, fileSystem);
}

function buildHierarchy(headings) {
    const root = [];
    const stack = [{ level: 0, children: root }];

    headings.forEach(heading => {
        const node = { ...heading, children: [] };

        while (stack.length > 1 && stack[stack.length - 1].level >= heading.level) {
            stack.pop();
        }

        stack[stack.length - 1].children.push(node);
        stack.push(node);
    });

    return root;
}

function renderToC(view, container, hierarchy, fileSystem) {
    container.innerHTML = "";

    const upper = document.createElement("div");
    upper.className = "toc-upper";

    const title = document.createElement("h3");
    title.className = "toc-title";
    title.textContent = "CONTEÚDO DA PÁGINA";
    upper.appendChild(title);

    const list = renderList(view, hierarchy, "");
    if (list) {
        upper.appendChild(list);
    }
    container.appendChild(upper);

    // Document Metadata section (Bottom)
    const lower = document.createElement("div");
    lower.className = "toc-lower";

    if (fileSystem && fileSystem.currentOpenFileId) {
        const docId = fileSystem.currentOpenFileId;
        const node = fileSystem.getNode(docId);
        const doc = fileSystem.getDocument(docId);

        if (node && doc) {
            const author = fileSystem.getUser(node.author_id);
            const meta = document.createElement("div");
            meta.className = "doc-meta-sidebar";

            const date = new Date(doc.updated_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            meta.innerHTML = `
                <div class="meta-row">
                    <span class="material-symbols-outlined">calendar_today</span>
                    <span>${date}</span>
                </div>
                <div class="meta-row">
                    <span class="material-symbols-outlined">person</span>
                    <span>${author ? author.name : 'Desconhecido'}</span>
                </div>
                ${doc.description ? `
                <div class="meta-description" title="${doc.description.replace(/"/g, '&quot;')}">
                    ${doc.description}
                </div>
                ` : ''}
            `;

            const gearBtn = document.createElement("button");
            gearBtn.className = "fab fab-mini gear-settings-btn";
            gearBtn.title = "Configurações do Documento";
            gearBtn.innerHTML = `<span class="material-symbols-outlined">settings</span>`;
            gearBtn.onclick = () => {
                const event = new CustomEvent('openDocumentSettings', { detail: { docId } });
                window.dispatchEvent(event);
            };

            lower.appendChild(meta);
            lower.appendChild(gearBtn);
        }
    }

    container.appendChild(lower);
}

function renderList(view, nodes, parentPath) {
    if (nodes.length === 0) return null;

    const ul = document.createElement("ul");
    ul.className = "toc-list";

    nodes.forEach((node, index) => {
        const path = parentPath ? `${parentPath}-${index}` : `${index}`;
        const isCollapsed = collapsedPaths.has(path);
        const hasChildren = node.children.length > 0;

        const li = document.createElement("li");
        li.className = `toc-item toc-level-${node.level}`;
        if (isCollapsed) li.classList.add("is-collapsed");

        const itemContent = document.createElement("div");
        itemContent.className = "toc-item-content";

        if (hasChildren) {
            const toggle = document.createElement("span");
            toggle.className = "toc-toggle";
            toggle.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
            toggle.onclick = (e) => {
                e.stopPropagation();
                if (collapsedPaths.has(path)) {
                    collapsedPaths.delete(path);
                } else {
                    collapsedPaths.add(path);
                }
                updateToC(view);
            };
            itemContent.appendChild(toggle);
        } else {
            const dot = document.createElement("span");
            dot.className = "toc-dot";
            itemContent.appendChild(dot);
        }

        const link = document.createElement("a");
        link.textContent = node.text;
        link.href = "#";
        link.onclick = (e) => {
            e.preventDefault();
            view.dispatch({
                selection: { anchor: node.from },
                effects: EditorView.scrollIntoView(node.from, {
                    y: "start",
                    yMargin: 50
                })
            });
            view.focus();
        };

        itemContent.appendChild(link);
        li.appendChild(itemContent);

        if (hasChildren) {
            const subList = renderList(view, node.children, path);
            if (subList) {
                li.appendChild(subList);
            }
        }

        ul.appendChild(li);
    });

    return ul;
}
