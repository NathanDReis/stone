// theme/editorThemeDark.js
import { EditorView } from "@codemirror/view";

export const editorTheme = EditorView.theme({
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
  },

  ".cm-foldGutter span": {
    color: "var(--text-muted)"
  },

  ".cm-tooltip": {
    backgroundColor: "var(--bg-tertiary)",
    color: "var(--text-primary)",
    border: "1px solid var(--bg-secondary)"
  },

  ".cm-tooltip-autocomplete li[aria-selected]": {
    backgroundColor: "var(--accent)",
    color: "#fff"
  },

  ".cm-inserted": {
    backgroundColor: "var(--warning)",
    color: "var(--text-primary)",
    padding: "2px 4px",
    borderRadius: "3px"
  }
}, { dark: false });
