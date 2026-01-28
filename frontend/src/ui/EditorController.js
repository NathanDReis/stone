import { EditorState, Compartment } from "@codemirror/state";
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
    pdfPlugin,
    createInternalLinkPlugin,
    linkAutocompleteSource,
    tagAutocompleteSource
} from "../lib";
import { autocompletion } from "@codemirror/autocomplete";
import { mermaidPlugin } from "../lib/mermaidPlugin";
import { LinkResolver } from "../services/LinkResolver";

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

export class EditorController {
    constructor(parentElement, options = {}) {
        this.parentElement = parentElement;
        this.onSave = options.onSave || (() => { });
        this.onNavigate = options.onNavigate || (() => { });
        this.onTagClick = options.onTagClick || (() => { });
        this.fileSystem = options.fileSystem;
        this.lastSavedMarkdown = null;
        this.saveTimeout = null;
        this.visible = true;
        this.linkResolver = null;
        this.readOnly = false;

        this.readOnlyCompartment = new Compartment();
        this.editableCompartment = new Compartment();

        this.initEditor();
    }

    initEditor() {
        if (this.fileSystem) {
            this.linkResolver = new LinkResolver(this.fileSystem);
        }

        const extensions = [
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
            this.readOnlyCompartment.of(EditorState.readOnly.of(false)),
            this.editableCompartment.of(EditorView.editable.of(true)),
            EditorView.updateListener.of((update) => {
                if (update.docChanged || update.selectionSet) {
                    const state = update.state;
                    const pos = state.selection.main.head;
                    const word = state.wordAt(pos);
                    let currentTag = null;

                    if (word) {
                        const text = state.sliceDoc(word.from, word.to);
                        if (text && text.trim().length > 0) {
                            if (text.startsWith('#')) {
                                currentTag = text;
                            } else {
                                const prevChar = state.sliceDoc(word.from - 1, word.from);
                                if (prevChar === '#') {
                                    currentTag = '#' + text;
                                }
                            }
                        }
                    }

                    if (currentTag !== this.lastActiveTag) {
                        this.lastActiveTag = currentTag;
                        this.onTagClick(currentTag);
                    }
                }

                if (update.docChanged) {
                    updateToC(update.view);
                    this.scheduleSave(update.state);
                }
            })
        ];

        if (this.linkResolver) {
            extensions.push(createInternalLinkPlugin(this.linkResolver, this.onNavigate));
        }

        if (this.fileSystem) {
            extensions.push(autocompletion({
                override: [
                    linkAutocompleteSource(this.fileSystem),
                    tagAutocompleteSource(this.fileSystem)
                ],
                activateOnTyping: true,
                closeOnBlur: true,
                defaultKeymap: true
            }));
        }

        const state = EditorState.create({
            extensions
        });

        this.view = new EditorView({
            state,
            parent: this.parentElement
        });

        updateToC(this.view);
        new ContextMenu(this.view);
    }

    hide() {
        if (!this.visible) return;

        this.parentElement.style.display = "none";
        this.visible = false;
    }

    show() {
        if (this.visible) return;

        this.parentElement.style.display = "";
        this.visible = true;

        this.view.requestMeasure();
        this.view.focus();
    }

    scheduleSave(state) {
        clearTimeout(this.saveTimeout);

        this.saveTimeout = setTimeout(() => {
            this.triggerSave(state);
        }, 500);
    }

    triggerSave(state) {
        const markdown = state.doc.toString();

        if (markdown === this.lastSavedMarkdown) return;

        this.lastSavedMarkdown = markdown;
        this.onSave(markdown);
    }

    setContent(text) {
        this.lastSavedMarkdown = text;
        const transaction = this.view.state.update({
            changes: { from: 0, to: this.view.state.doc.length, insert: text }
        });
        this.view.dispatch(transaction);
        updateToC(this.view);
    }

    setReadOnly(readOnly) {
        this.readOnly = readOnly;
        this.view.dispatch({
            effects: [
                this.readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
                this.editableCompartment.reconfigure(EditorView.editable.of(!readOnly))
            ]
        });
    }
}
