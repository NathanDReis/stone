import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: "600", fontSize: "2em", color: "var(--text-primary)", letterSpacing: ".05em" },
  { tag: tags.heading2, fontWeight: "600", fontSize: "1.6em", color: "var(--text-primary)" },
  { tag: tags.heading3, fontWeight: "600", fontSize: "1.37em", color: "var(--text-primary)" },
  { tag: tags.heading4, fontWeight: "600", fontSize: "1.25em", color: "var(--text-primary)" },
  { tag: tags.heading5, fontWeight: "600", fontSize: "1.12em", color: "var(--text-primary)" },
  { tag: tags.heading6, fontWeight: "600", fontSize: "1.12em", color: "var(--text-primary)" },
  { tag: tags.strong, fontWeight: "600", color: "var(--text-primary)" },
  { tag: tags.emphasis, fontStyle: "italic", color: "var(--text-primary)" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "var(--text-muted)" },
  { tag: tags.link, color: "var(--accent)", textDecoration: "none" },
  { tag: tags.url, color: "var(--accent)", textDecoration: "underline" },
  { tag: tags.monospace, fontFamily: "monospace", color: "var(--text-primary)" },
  { tag: tags.list, color: "var(--text-primary)", class: "cm-list-marker" },
  { tag: tags.quote, color: "var(--text-secondary)", fontStyle: "italic" },
  { tag: tags.meta, color: "var(--text-muted)" },
  { tag: tags.comment, color: "var(--text-muted)", fontStyle: "italic" },
  { tag: tags.inserted, backgroundColor: "var(--warning)", color: "var(--text-primary)", padding: "2px 0" },
]);