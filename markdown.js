import { EditorState } from "@codemirror/state";
import { 
  EditorView, 
  keymap,
  highlightActiveLine,
  highlightActiveLineGutter,
  placeholder,
  Decoration
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
  { tag: tags.heading, fontWeight: "bold", fontSize: "1.3em" },
  { tag: tags.heading1, fontWeight: "bold", fontSize: "1.3em" },
  { tag: tags.heading2, fontWeight: "bold", fontSize: "1.15em" },
  { tag: tags.heading3, fontWeight: "bold", fontSize: "1.2em" },
  { tag: tags.heading4, fontWeight: "bold", fontSize: "1.1em" },
  { tag: tags.heading5, fontWeight: "bold", fontSize: "1em" },
  { tag: tags.heading6, fontWeight: "bold", fontSize: ".9em" },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.url, color: "#61afef" },
]);

const markdownCompletions = completeFromList([
  { label: "# ", type: "keyword" },
  { label: "## ", type: "keyword" },
  { label: "### ", type: "keyword" },
  { label: "#### ", type: "keyword" },
  { label: "##### ", type: "keyword" },
  { label: "###### ", type: "keyword" },
  { label: "- ", type: "keyword" },
  { label: "- [ ] ", type: "keyword" },
  { label: "**bold**", type: "text" },
  { label: "*italic*", type: "text" },
  { label: "_italic_", type: "text" },
  { label: "```js\n\n```", type: "code" },
  { label: "`code`", type: "code" },
  { label: ">", type: "text" }
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