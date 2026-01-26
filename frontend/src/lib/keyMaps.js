import {
  defaultKeymap,
  historyKeymap,
  indentMore,
  indentLess
} from "@codemirror/commands";
import { markdownKeymap } from "@codemirror/lang-markdown";
import { searchKeymap } from "@codemirror/search";

import { wrapSelection } from "./wrapSelection";
import { wrapWithPair } from "./wrapWithPair";

export const keyMaps = [
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
  {
    key: "Ctrl-b",
    mac: "Cmd-b",
    run: (view) => wrapSelection(view, "**")
  },
  {
    key: "Ctrl-i",
    mac: "Cmd-i",
    run: (view) => wrapSelection(view, "*")
  },
  {
    key: "Ctrl-u",
    run: (view) => wrapSelection(view, "_")
  },
  {
    key: "Ctrl-h",
    run: (view) => wrapSelection(view, "==")
  },
  {
    key: "Ctrl-k",
    mac: "Cmd-k",
    run: (view) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: "[[]]" },
        selection: { anchor: from + 2 }
      });
      return true;
    }
  },
  {
    key: "Ctrl-Shift-s",
    run: view => wrapSelection(view, "~~")
  },
  {
    key: "(",
    run: view => wrapWithPair(view, "(", ")")
  },
  {
    key: "[",
    run: view => wrapWithPair(view, "[", "]")
  },
  {
    key: "{",
    run: view => wrapWithPair(view, "{", "}")
  },
  {
    key: "'",
    run: view => wrapWithPair(view, "'", "'")
  },
  {
    key: '"',
    run: view => wrapWithPair(view, '"', '"')
  },
  ...defaultKeymap,
  ...historyKeymap,
  ...searchKeymap,
  ...markdownKeymap,
  { key: "Tab", run: indentMore },
  { key: "Shift-Tab", run: indentLess }
];
