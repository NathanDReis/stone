import { EditorState } from "@codemirror/state";
import { 
  EditorView, 
  keymap,
  highlightActiveLine,
  highlightActiveLineGutter,
  placeholder,
} from "@codemirror/view";
import { 
  defaultKeymap, 
  history, 
  historyKeymap,
  indentMore,
  indentLess
} from "@codemirror/commands";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { autocompletion } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { indentOnInput } from "@codemirror/language";
import { syntaxHighlighting } from "@codemirror/language";

import { 
  markdownCompletions, 
  markdownHighlight, 
  editorTheme,
  hideMarkdownTokens
} from "./src/lib";

const state = EditorState.create({
  doc: "# Meu documento",
  extensions: [
    editorTheme,         
    hideMarkdownTokens,  

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
    placeholder("O que irá documentar hoje?")
  ]
});

const view = new EditorView({
  state,
  parent: document.querySelector(".site-main")
});
