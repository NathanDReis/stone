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
  { tag: tags.monospace, fontFamily: "monospace", color: "var(--text-primary)" },
  { tag: tags.list, color: "var(--text-primary)", class: "cm-list-marker" },
  { tag: tags.quote, color: "var(--text-secondary)", fontStyle: "italic" },
  { tag: tags.meta, color: "var(--text-muted)" },
  { tag: tags.comment, color: "var(--text-muted)", fontStyle: "italic" },
]);