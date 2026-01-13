import { 
  Decoration,
  ViewPlugin, 
} from "@codemirror/view";

const highlightMark = Decoration.mark({ class: "cm-highlight" });

const highlightPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.buildDecorations(view);
  }

  update(update) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view) {
    const builder = [];
    const text = view.state.doc.toString();
    const regex = /==(.*?)==/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const from = match.index;
      const to = from + match[0].length;
      builder.push(highlightMark.range(from, to));
    }

    return Decoration.set(builder);
  }
}, {
  decorations: v => v.decorations
});
