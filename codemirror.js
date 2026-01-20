import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightActiveLine,
  highlightActiveLineGutter,
  placeholder,
} from "@codemirror/view";
import { history } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { highlightSelectionMatches } from "@codemirror/search";
import { indentOnInput } from "@codemirror/language";
import { syntaxHighlighting } from "@codemirror/language";
import { GFM } from "@lezer/markdown";

import {
  markdownHighlight,
  editorTheme,
  markdownDecorations,
  keyMaps,
  tableDecorations
} from "./src/lib";

const stripTildeFences = EditorState.transactionFilter.of(tr => {
  if (!tr.docChanged) return tr;

  const text = tr.newDoc.toString();

  const cleaned = text
    .split("\n")
    .filter(line => !/^\s*~{3,}\s*$/.test(line))
    .join("\n");

  if (cleaned === text) return tr;

  return [{
    changes: {
      from: 0,
      to: tr.newDoc.length,
      insert: cleaned
    }
  }];
});

const state = EditorState.create({
  doc: `# Meu documento
Primeiro parágrafo
- item 1
- item 2
- [ ] check

# Tópico
## Sub tópico

| Coluna 1 | Coluna 2 |
| -------- | -------- |
| Valor 1  | Valor 2  |

==s==
~~d~~

Minha terra tem palmeiras
Onde canta o sabiá
As aves que aqui gorjeiam
Não gorjeiam como lá

![Imagem](https://images.pexels.com/photos/1183434/pexels-photo-1183434.jpeg)

[Link Externo](https://images.pexels.com/photos/1183434/pexels-photo-1183434.jpeg)
`,
  extensions: [
    editorTheme,
    markdownDecorations,
    tableDecorations,

    stripTildeFences,

    keymap.of(keyMaps),
    EditorView.lineWrapping,
    history(),
    markdown({
      extensions: [GFM]
    }),

    highlightSelectionMatches(),
    indentOnInput(),
    syntaxHighlighting(markdownHighlight),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    placeholder("O que irá documentar hoje?")
  ]
});

const view = new EditorView({
  state,
  parent: document.querySelector(".site-main")
});
