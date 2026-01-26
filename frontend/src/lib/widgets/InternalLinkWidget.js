import { WidgetType } from "@codemirror/view";

export class InternalLinkWidget extends WidgetType {
    constructor(content, linkResolver, onNavigate, view, start, end) {
        super();
        this.content = content;
        this.linkResolver = linkResolver;
        this.onNavigate = onNavigate;
        this.view = view;
        this.start = start;
        this.end = end;
    }

    eq(other) {
        return other.content === this.content;
    }

    toDOM() {
        const resolved = this.linkResolver.resolve(this.content);

        const link = document.createElement("a");
        link.className = resolved.valid
            ? "internal-link internal-link-valid"
            : "internal-link internal-link-invalid";

        link.textContent = resolved.displayName;
        link.href = "#";

        if (resolved.valid) {
            link.title = `Abrir: ${resolved.displayName}`;
            link.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.onNavigate(resolved.node);
            });
        } else {
            link.title = `Link inválido: ${this.content}`;
            link.style.cursor = "not-allowed";
            link.addEventListener("click", (e) => {
                e.preventDefault();
            });
        }

        return link;
    }

    ignoreEvent() {
        return true;
    }
}
