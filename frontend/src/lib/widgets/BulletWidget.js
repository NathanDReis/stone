import { WidgetType } from "@codemirror/view";

export class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-bullet-widget";
    span.textContent = "•";
    return span;
  }

  ignoreEvent() {
    return true;
  }
}
