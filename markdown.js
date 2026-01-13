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
  markdownDecorations
} from "./src/lib";

const state = EditorState.create({
  doc: "# Meu documento",
  extensions: [
    editorTheme,
    markdownDecorations,

    keymap.of([
      {
        key: "Enter",
        run: (view) => {
          const line = view.state.doc.lineAt(view.state.selection.main.head);
          const match = line.text.match(/^(\s*[-+*]|\s*\d+\.)\s*$/);

          if (match) {
            view.dispatch({
              changes: { from: line.from, to: line.to, insert: "" }
            });
            return true;
          }
          return false;
        }
      },
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
