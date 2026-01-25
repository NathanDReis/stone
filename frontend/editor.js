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

let lastSavedMarkdown = null;

const state = EditorState.create({
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
        scheduleSave(update.state);
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

let saveTimeout = null;
function scheduleSave(state) {
  clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    saveDocument(state);
  }, 500);
}

function saveDocument(state) {
  const markdown = state.doc.toString();

  if (markdown === lastSavedMarkdown) {
    return;
  }

  lastSavedMarkdown = markdown;

  const now = new Date().toISOString();

  const doc = {
    id: 1,
    title: extractTitle(markdown),
    description: extractDescription(markdown),
    markdown,
    tags: extractTags(markdown),
    updated_at: now,
    updated_by: 1
  };

  localStorage.setItem(
    `doc:1`,
    JSON.stringify(doc)
  );
}

function extractTitle(markdown) {
  const firstLine = markdown
    .split("\n")
    .find(line => line.trim().length > 0);

  if (!firstLine) return null;

  return firstLine.replace(/^#+\s*/, "").trim();
}

function extractDescription(markdown) {
  const lines = markdown.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(">")) {
      return trimmed.replace(/^>\s*/, "").trim();
    }
  }

  return null;
}

function extractTags(markdown) {
  const tags = new Set();
  const lines = markdown.split("\n");

  let inCodeBlock = false;

  for (let line of lines) {
    const trimmed = line.trim();

    if (/^(```|~~~)/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (
      inCodeBlock ||
      trimmed.startsWith(">") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("+")
    ) {
      continue;
    }

    const cleanLine = line.replace(/`[^`]*`/g, "");

    const matches = cleanLine.match(/(^|\s)#([a-zA-Z0-9_-]+)/g);
    if (matches) {
      matches.forEach(tag => {
        tags.add(tag.trim().replace(/^#/, ""));
      });
    }
  }

  return Array.from(tags);
}
