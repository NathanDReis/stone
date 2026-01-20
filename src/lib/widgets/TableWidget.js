import { WidgetType } from "@codemirror/view";

export class TableWidget extends WidgetType {
  constructor(rows, from, to) {
    super();
    this.rows = rows;
    this.from = from;
    this.to = to;
    this.isEditing = false;
  }

  eq(other) {
    return JSON.stringify(this.rows) === JSON.stringify(other.rows) &&
      this.from === other.from &&
      this.to === other.to;
  }

  toDOM(view) {
    const wrap = document.createElement("div");
    wrap.className = "cm-md-table-wrap";

    const table = document.createElement("table");
    table.className = "cm-md-table";

    this.rows.forEach((row, i) => {
      const tr = document.createElement("tr");
      row.forEach((cell, j) => {
        const el = document.createElement(i === 0 ? "th" : "td");
        el.textContent = cell;
        el.contentEditable = "true";
        el.className = "cm-md-table-cell";

        el.onfocus = () => {
          this.isEditing = true;
        };

        el.onblur = () => {
          this.isEditing = false;
          this.sync(view);
        };

        el.oninput = () => {
          this.rows[i][j] = el.textContent;
        };

        el.onmousedown = (e) => {
          e.stopPropagation();
        };

        el.onclick = (e) => {
          e.stopPropagation();
        };

        el.onkeydown = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            el.blur();
          }
        };

        tr.appendChild(el);
      });
      table.appendChild(tr);
    });

    wrap.appendChild(table);
    return wrap;
  }

  sync(view) {
    const separator = "| " + this.rows[0].map(() => "---").join(" | ") + " |";
    const finalMarkdown = [
      "| " + this.rows[0].join(" | ") + " |",
      separator,
      ...this.rows.slice(1).map(row => "| " + row.join(" | ") + " |")
    ].join("\n");

    view.dispatch({
      changes: { from: this.from, to: this.to, insert: finalMarkdown }
    });
  }

  updateDOM(dom) {
    return this.isEditing;
  }

  ignoreEvent() {
    return true;
  }
}
