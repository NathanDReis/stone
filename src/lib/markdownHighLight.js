import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading1, class: "cm-header-1" },
  { tag: tags.heading2, fontSize: "1.6em" },
  { tag: tags.heading3, fontSize: "1.37em" },
  { tag: tags.heading4, fontSize: "1.25em" },
  { tag: tags.heading5, fontSize: "1.12em" },
  { tag: tags.heading6, fontSize: "1.12em" },
  { tag: tags.strong, fontWeight: "600", color: "var(--text-primary)" },
  { tag: tags.emphasis, fontStyle: "italic", color: "var(--text-primary)" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "var(--text-muted)" },
  { tag: tags.link, color: "var(--accent)", textDecoration: "none" },
  { tag: tags.url, color: "var(--accent)", textDecoration: "underline" },
  { tag: tags.monospace, fontFamily: "var(--font-mono)", color: "var(--text-primary)" },
  { tag: tags.list, color: "var(--text-primary)", class: "cm-list-marker" },
  { tag: tags.quote, color: "var(--text-secondary)", fontStyle: "italic" },
  { tag: tags.meta, color: "var(--text-muted)" },
  { tag: tags.comment, color: "#6a9955", fontStyle: "italic" },

  // VSCode-like colors for code blocks
  { tag: tags.keyword, color: "#569cd6" },
  { tag: tags.operator, color: "#d4d4d4" },
  { tag: tags.string, color: "#ce9178" },
  { tag: tags.number, color: "#b5cea8" },
  { tag: tags.bool, color: "#569cd6" },
  { tag: tags.null, color: "#569cd6" },
  { tag: tags.variableName, color: "#9cdcfe" },
  { tag: tags.function(tags.variableName), color: "#dcdcaa" },
  { tag: tags.className, color: "#4ec9b0" },
  { tag: tags.propertyName, color: "#9cdcfe" },
  { tag: tags.attributeName, color: "#9cdcfe" },
  { tag: tags.tagName, color: "#569cd6" },
  { tag: tags.typeName, color: "#4ec9b0" },
  { tag: tags.heading, color: "var(--text-primary)", fontWeight: "bold" },
]);