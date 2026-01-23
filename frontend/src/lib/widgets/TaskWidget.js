import { WidgetType } from "@codemirror/view";

export class TaskWidget extends WidgetType {
  constructor(view, checked) {
    super();
    this.view = view;
    this.checked = checked;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-task-widget";
    span.innerHTML = this.checked
      ? `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7" /></svg>`
      : `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3" /></svg>`;

    span.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    span.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const view = this.view;
      const pos = view.posAtDOM(span);
      const line = view.state.doc.lineAt(pos);

      const match = line.text.match(/\[( |x|X)\]/);
      if (!match) return;

      const content = match.input.replace(`- [${match[1]}]`, '');
      if (!content.length) return;

      const from = line.from + match.index;
      const to = from + match[0].length;

      view.dispatch({
        changes: {
          from,
          to,
          insert: this.checked ? "[ ]" : "[x]"
        }
      });
    };

    return span;
  }

  ignoreEvent() {
    return false;
  }
}
