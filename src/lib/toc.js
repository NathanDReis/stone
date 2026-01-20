import { syntaxTree } from "@codemirror/language";
import { EditorView } from "@codemirror/view";

export function updateToC(view) {
    const container = document.querySelector(".site-index");
    if (!container) return;

    const headings = [];
    const state = view.state;

    syntaxTree(state).iterate({
        enter(node) {
            if (node.name.startsWith("ATXHeading")) {
                const level = parseInt(node.name.replace("ATXHeading", ""));
                const text = state.doc.sliceString(node.from, node.to).replace(/^#+\s*/, "");
                headings.push({ level, text, from: node.from });
            }
        }
    });

    renderToC(view, container, headings);
}

function renderToC(view, container, headings) {
    container.innerHTML = "";

    const title = document.createElement("h3");
    title.className = "toc-title";
    title.textContent = "CONTEÚDO DA PÁGINA";
    container.appendChild(title);

    const list = document.createElement("ul");
    list.className = "toc-list";

    headings.forEach(heading => {
        const item = document.createElement("li");
        item.className = `toc-item toc-level-${heading.level}`;

        const link = document.createElement("a");
        link.textContent = heading.text;
        link.href = "#";
        link.onclick = (e) => {
            e.preventDefault();
            view.dispatch({
                selection: { anchor: heading.from },
                effects: EditorView.scrollIntoView(heading.from, { y: "start", yMargin: 80 }),
                scrollIntoView: true
            });
            view.focus();
        };

        item.appendChild(link);
        list.appendChild(item);
    });

    container.appendChild(list);
}
