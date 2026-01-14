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
import { autocompletion } from "@codemirror/autocomplete";
import { highlightSelectionMatches } from "@codemirror/search";
import { indentOnInput } from "@codemirror/language";
import { syntaxHighlighting } from "@codemirror/language";
import { GFM } from "@lezer/markdown";

import {
  markdownCompletions,
  markdownHighlight,
  editorTheme,
  markdownDecorations,
  keyMaps,
} from "./src/lib";

const state = EditorState.create({
  doc: "# Meu documento\nPrimeiro parágrafo\n- item 1\n- item 2\n- [ ] check\n# Tópico\n## Sub tópico\n\n==s==\n~~d~~\n\nMinha terra tem palmeiras\nOnde canta o sabiá\nAs aves que aqui gorjeiam\nNão gorjeiam como lá\n",
  extensions: [
    editorTheme,
    markdownDecorations,

    keymap.of(keyMaps),

    EditorView.lineWrapping,
    history(),
    markdown({
      extensions: [GFM]
    }),
    autocompletion({
      override: [markdownCompletions]
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
