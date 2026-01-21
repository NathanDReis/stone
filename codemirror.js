import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightActiveLine,
  highlightActiveLineGutter,
  placeholder,
} from "@codemirror/view";
import { history } from "@codemirror/commands";
import { markdown, commonmarkLanguage } from "@codemirror/lang-markdown";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { sql } from "@codemirror/lang-sql";
import { python } from "@codemirror/lang-python";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { StreamLanguage } from "@codemirror/language";
import { pascal } from "@codemirror/legacy-modes/mode/pascal";
import { highlightSelectionMatches } from "@codemirror/search";
import { indentOnInput } from "@codemirror/language";
import { syntaxHighlighting, LanguageDescription } from "@codemirror/language";
import { GFM } from "@lezer/markdown";

const languages = [
  LanguageDescription.of({
    name: "javascript",
    alias: ["js", "jsx"],
    load: () => Promise.resolve(javascript())
  }),
  LanguageDescription.of({
    name: "typescript",
    alias: ["ts", "tsx"],
    load: () => Promise.resolve(javascript())
  }),
  LanguageDescription.of({
    name: "html",
    alias: ["html"],
    load: () => Promise.resolve(html())
  }),
  LanguageDescription.of({
    name: "css",
    alias: ["css"],
    load: () => Promise.resolve(css())
  }),
  LanguageDescription.of({
    name: "sql",
    alias: ["sql"],
    load: () => Promise.resolve(sql())
  }),
  LanguageDescription.of({
    name: "python",
    alias: ["py", "python"],
    load: () => Promise.resolve(python())
  }),
  LanguageDescription.of({
    name: "json",
    alias: ["json"],
    load: () => Promise.resolve(json())
  }),
  LanguageDescription.of({
    name: "xml",
    alias: ["xml"],
    load: () => Promise.resolve(xml())
  }),
  LanguageDescription.of({
    name: "pascal",
    alias: ["pascal", "delphi"],
    load: () => Promise.resolve(StreamLanguage.define(pascal))
  })
];

import {
  markdownHighlight,
  editorTheme,
  markdownDecorations,
  keyMaps,
  tableDecorations,
  updateToC,
  ContextMenu,
  pdfPlugin
} from "./src/lib";
import { mermaidPlugin } from "./src/lib/mermaidPlugin";

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
      base: commonmarkLanguage,
      codeLanguages: languages,
      extensions: [GFM]
    }),

    highlightSelectionMatches(),
    indentOnInput(),
    syntaxHighlighting(markdownHighlight),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    placeholder("O que irá documentar hoje?"),
    mermaidPlugin,
    pdfPlugin,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        updateToC(update.view);
      }
    })
  ]
});

const view = new EditorView({
  state,
  parent: document.querySelector(".site-main")
});

updateToC(view);
new ContextMenu(view);
