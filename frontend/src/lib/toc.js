import { syntaxTree } from "@codemirror/language";
import { EditorView } from "@codemirror/view";

const collapsedPaths = new Set();

export function updateToC(view) {
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
    renderToC(view, container, hierarchy);
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

function renderToC(view, container, hierarchy) {
    container.innerHTML = "";

    const title = document.createElement("h3");
    title.className = "toc-title";
    title.textContent = "CONTEÚDO DA PÁGINA";
    container.appendChild(title);

    const list = renderList(view, hierarchy, "");
    if (list) {
        container.appendChild(list);
    }
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
