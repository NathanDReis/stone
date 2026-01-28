import { WidgetType } from "@codemirror/view";

export class TableWidget extends WidgetType {
  constructor(rows, from, to, readOnly = false) {
    super();
    this.rows = rows;
    this.from = from;
    this.to = to;
    this.readOnly = readOnly;
    this.isEditing = false;
  }

  eq(other) {
    return JSON.stringify(this.rows) === JSON.stringify(other.rows) &&
      this.from === other.from &&
      this.to === other.to &&
      this.readOnly === other.readOnly;
  }

  toDOM(view) {
    const isReadOnly = this.readOnly;
    const container = document.createElement("div");
    container.className = "cm-md-table-container";

    const mainWrap = document.createElement("div");
    mainWrap.className = "cm-md-table-main-wrap";

    const wrap = document.createElement("div");
    wrap.className = "cm-md-table-wrap";

    const table = document.createElement("table");
    table.className = "cm-md-table";

    if (!isReadOnly) {
      const removeColRow = document.createElement("tr");
      removeColRow.className = "cm-md-table-remove-row";
      removeColRow.appendChild(document.createElement("td"));

      this.rows[0].forEach((_, j) => {
        const td = document.createElement("td");
        const btn = this.createRemoveBtn(() => this.removeColumn(j, view), "Remover Coluna");
        td.appendChild(btn);
        removeColRow.appendChild(td);
      });
      table.appendChild(removeColRow);
    }

    this.rows.forEach((row, i) => {
      const tr = document.createElement("tr");

      if (!isReadOnly) {
        const removeTd = document.createElement("td");
        removeTd.className = "cm-md-table-remove-cell";
        const btn = this.createRemoveBtn(() => this.removeRow(i, view), "Remover Linha");
        removeTd.appendChild(btn);
        tr.appendChild(removeTd);
      }

      row.forEach((cell, j) => {
        const el = document.createElement(i === 0 ? "th" : "td");
        el.textContent = cell;
        el.contentEditable = isReadOnly ? "false" : "true";
        el.className = "cm-md-table-cell";

        if (!isReadOnly) {
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

          el.onkeydown = (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              el.blur();
            }
          };
        }

        tr.appendChild(el);
      });
      table.appendChild(tr);
    });

    wrap.appendChild(table);

    if (!isReadOnly) {
      const addColBtn = document.createElement("button");
      addColBtn.className = "cm-md-table-add-btn cm-add-col";
      addColBtn.title = "Adicionar Coluna";
      addColBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
      addColBtn.onclick = (e) => {
        e.stopPropagation();
        this.addColumn(view);
      };

      mainWrap.appendChild(wrap);
      mainWrap.appendChild(addColBtn);

      container.appendChild(mainWrap);

      const addRowBtn = document.createElement("button");
      addRowBtn.className = "cm-md-table-add-btn cm-add-row";
      addRowBtn.title = "Adicionar Linha";
      addRowBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
      addRowBtn.onclick = (e) => {
        e.stopPropagation();
        this.addRow(view);
      };

      container.appendChild(addRowBtn);
    } else {
      mainWrap.appendChild(wrap);
      container.appendChild(mainWrap);
    }

    return container;
  }

  createRemoveBtn(onClick, title) {
    const btn = document.createElement("button");
    btn.className = "cm-md-table-remove-btn";
    btn.title = title;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    btn.onmousedown = (e) => e.stopPropagation();
    btn.onclick = (e) => {
      e.stopPropagation();
      onClick();
    };
    return btn;
  }

  addColumn(view) {
    this.rows.forEach(row => row.push("Nova"));
    this.sync(view);
  }

  addRow(view) {
    const newRow = this.rows[0].map(() => "Nova");
    this.rows.push(newRow);
    this.sync(view);
  }

  removeRow(index, view) {
    this.rows.splice(index, 1);
    this.sync(view);
  }

  removeColumn(index, view) {
    this.rows.forEach(row => row.splice(index, 1));
    this.sync(view);
  }

  sync(view) {
    if (this.rows.length === 0 || this.rows[0].length === 0) {
      view.dispatch({
        changes: { from: this.from, to: this.to, insert: "" }
      });
      return;
    }

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
