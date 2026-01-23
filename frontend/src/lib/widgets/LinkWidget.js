import { WidgetType } from "@codemirror/view";

export class LinkWidget extends WidgetType {
  constructor(view, label, href) {
    super();
    this.view = view;
    this.label = label;
    this.href = href;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-md-link-widget";
    span.textContent = this.label;

    span.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    span.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      window.open(this.href, "_blank", "noopener,noreferrer");
    };

    return span;
  }

  ignoreEvent() {
    return false;
  }
}
