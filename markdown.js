import { EditorState } from "@codemirror/state";
import { 
  EditorView, 
  keymap,
  highlightActiveLine,
  highlightActiveLineGutter,
  placeholder,
  Decoration,
  DecorationSet, 
  ViewPlugin, 
  ViewUpdate
} from "@codemirror/view";
import { 
  defaultKeymap, 
  history, 
  historyKeymap,
  indentMore,
  indentLess
} from "@codemirror/commands";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { autocompletion, completeFromList } from "@codemirror/autocomplete";
import {
  searchKeymap,
  highlightSelectionMatches,
  openSearchPanel 
} from "@codemirror/search";
import { indentOnInput } from "@codemirror/language";
import { HighlightStyle, syntaxHighlighting, syntaxTree   } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { editorTheme } from "./editorTheme";

import { marked } from "marked";

const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: "600", fontSize: "2em", color: "var(--text-primary)" },
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
  { tag: tags.list, color: "var(--text-primary)" },
  { tag: tags.quote, color: "var(--text-secondary)", fontStyle: "italic" },
  { tag: tags.meta, color: "var(--text-muted)" },
  { tag: tags.comment, color: "var(--text-muted)", fontStyle: "italic" },
  { tag: tags.inserted, backgroundColor: "var(--warning)", color: "var(--text-primary)", padding: "2px 0" }
]);

const markdownCompletions = completeFromList([
  // Headings
  { label: "# ", type: "keyword", detail: "Heading 1" },
  { label: "## ", type: "keyword", detail: "Heading 2" },
  { label: "### ", type: "keyword", detail: "Heading 3" },
  { label: "#### ", type: "keyword", detail: "Heading 4" },
  { label: "##### ", type: "keyword", detail: "Heading 5" },
  { label: "###### ", type: "keyword", detail: "Heading 6" },
  
  // Text formatting
  { label: "**bold**", type: "text", detail: "Bold text" },
  { label: "*italic*", type: "text", detail: "Italic text" },
  { label: "_italic_", type: "text", detail: "Italic text (alt)" },
  { label: "~~strikethrough~~", type: "text", detail: "Strikethrough" },
  { label: "==highlight==", type: "text", detail: "Highlight" },
  { label: "***bold italic***", type: "text", detail: "Bold + Italic" },
  
  // Code
  { label: "`code`", type: "code", detail: "Inline code" },
  { label: "```\n\n```", type: "code", detail: "Code block" },
  { label: "```js\n\n```", type: "code", detail: "JavaScript block" },
  { label: "```python\n\n```", type: "code", detail: "Python block" },
  { label: "```html\n\n```", type: "code", detail: "HTML block" },
  { label: "```css\n\n```", type: "code", detail: "CSS block" },
  
  // Lists
  { label: "- ", type: "keyword", detail: "Unordered list" },
  { label: "* ", type: "keyword", detail: "Unordered list (alt)" },
  { label: "+ ", type: "keyword", detail: "Unordered list (alt)" },
  { label: "1. ", type: "keyword", detail: "Ordered list" },
  { label: "- [ ] ", type: "keyword", detail: "Task list (unchecked)" },
  { label: "- [x] ", type: "keyword", detail: "Task list (checked)" },
  
  // Links and images
  { label: "[]()", type: "text", detail: "Link" },
  { label: "[text](url)", type: "text", detail: "Link with text" },
  { label: "![]()", type: "text", detail: "Image" },
  { label: "![alt](url)", type: "text", detail: "Image with alt" },
  
  // Quotes and separators
  { label: "> ", type: "text", detail: "Blockquote" },
  { label: "---", type: "keyword", detail: "Horizontal rule" },
  { label: "***", type: "keyword", detail: "Horizontal rule (alt)" },
  
  // Tables
  { label: "| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |", type: "keyword", detail: "Table" },
  
  // Footnotes
  { label: "[^1]", type: "text", detail: "Footnote reference" },
  { label: "[^1]: ", type: "text", detail: "Footnote definition" },
  
  // HTML entities
  { label: "&nbsp;", type: "text", detail: "Non-breaking space" },
  { label: "&copy;", type: "text", detail: "Copyright symbol" },
  { label: "&trade;", type: "text", detail: "Trademark symbol" }
]);

const hideMarkdownTokens = EditorView.decorations.compute(
  ["doc"],
  state => {
    const decorations = []

    syntaxTree(state).iterate({
      enter(node) {
        if (
          node.name === "EmphasisMark" ||
          node.name === "StrongEmphasisMark" ||
          node.name === "CodeMark" ||
          node.name === "HeadingMark"
        ) {
          decorations.push(
            Decoration.mark({
              class: "cm-md-hidden"
            }).range(node.from, node.to)
          )
        }
      }
    })

    return Decoration.set(decorations)
  }
)

const state = EditorState.create({
  doc: "# Meu documento",
  extensions: [
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      ...markdownKeymap,
      { key: "Tab", run: indentMore },
      { key: "Shift-Tab", run: indentLess }
    ]),
    EditorView.lineWrapping,
    history(),
    markdown(),
    autocompletion({
      override: [markdownCompletions]
    }),
    highlightSelectionMatches(),
    indentOnInput(),
    syntaxHighlighting(markdownHighlight),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    placeholder("O que irá documentar hoje?"),
    editorTheme,
    hideMarkdownTokens,
  ]
});

const view = new EditorView({
  state,
  parent: document.querySelector(".site-main")
});

document.querySelector(".search-editor")
  .addEventListener("click", () => {
    openSearchPanel(view);
  });


  // Configurar marked (opcional)
marked.setOptions({
  breaks: true, // Quebras de linha se tornam <br>
  gfm: true, // GitHub Flavored Markdown
  headerIds: true, // IDs nos headers
  mangle: false, // Não embaralhar emails
});

// Função para converter
function converterParaHTML() {
  // Pegar o conteúdo do editor
  const markdownText = view.state.doc.toString();
  
  // Converter para HTML
  const html = marked.parse(markdownText);
  
  return html;
}

// Adicionar ao botão
document.querySelector(".btn-preview").addEventListener("click", () => {
  const html = converterParaHTML();
  
  // Exibir em um elemento
  document.querySelector(".site-main").innerHTML = html;
  
  // Ou copiar para clipboard
  // navigator.clipboard.writeText(html);
  
  // console.log(html);
});