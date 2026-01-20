import { WidgetType } from "@codemirror/view";

export class TableWidget extends WidgetType {
  constructor(rows) {
    super();
    this.rows = rows;
  }

  toDOM() {
    const wrap = document.createElement("div");
    wrap.className = "cm-md-table-wrap";

    const table = document.createElement("table");
    table.className = "cm-md-table";

    this.rows.forEach((row, i) => {
      const tr = document.createElement("tr");
      row.forEach(cell => {
        const el = document.createElement(i === 0 ? "th" : "td");
        el.textContent = cell;
        tr.appendChild(el);
      });
      table.appendChild(tr);
    });

    wrap.appendChild(table);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
