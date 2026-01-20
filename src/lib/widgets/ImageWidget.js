import { WidgetType } from "@codemirror/view";

export class ImageWidget extends WidgetType {
  constructor(src) {
    super();
    this.src = src;
  }

  toDOM() {
    const img = document.createElement("img");
    img.src = this.src;
    img.style.maxWidth = "100%";
    img.style.display = "block";
    return img;
  }

  ignoreEvent() {
    return true;
  }
}
