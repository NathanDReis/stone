import { EditorView } from "@codemirror/view";

export const editorTheme = [
  EditorView.theme({
    "&": {
      color: "var(--text-primary)",
      backgroundColor: "var(--bg-main)",
      height: "100%"
    },

    ".cm-content": {
      fontFamily: "var(--font-sans)",
      fontSize: "1rem",
      lineHeight: "1.6",
      caretColor: "var(--text-primary)",
      padding: "16px"
    },

    ".cm-md-table-wrap": {
      margin: "12px 0",
      overflowX: "auto"
    },

    ".cm-md-table": {
      borderCollapse: "collapse",
      width: "100%",
      fontSize: "0.95rem",
      backgroundColor: "var(--bg-main)"
    },

    ".cm-md-table th, .cm-md-table td": {
      border: "1px solid var(--border-muted)",
      padding: "6px 10px",
      textAlign: "left",
      verticalAlign: "top"
    },

    ".cm-md-table th": {
      backgroundColor: "var(--bg-secondary)",
      fontWeight: "600"
    },

    ".cm-md-table tbody tr:hover": {
      backgroundColor: "color-mix(in srgb, var(--accent) 8%, transparent)"
    },

    ".cm-scroller": {
      overflow: "auto"
    },

    ".cm-cursor": {
      borderLeftColor: "var(--accent)"
    },

    ".cm-selectionBackground": {
      backgroundColor: "color-mix(in srgb, var(--accent) 30%, transparent)"
    },

    ".cm-activeLine": {
      backgroundColor: "var(--bg-secondary)"
    },

    ".cm-gutters": {
      backgroundColor: "var(--bg-main)",
      color: "var(--text-muted)",
      border: "none"
    },

    ".cm-activeLineGutter": {
      backgroundColor: "var(--bg-secondary)",
      color: "var(--text-primary)"
    }
  }),
];
