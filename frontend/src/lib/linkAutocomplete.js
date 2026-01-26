import { autocompletion } from "@codemirror/autocomplete";

export const createLinkAutocomplete = (fileSystem) => {
    return autocompletion({
        override: [
            (context) => {
                const { state, pos } = context;

                const textBefore = state.doc.sliceString(Math.max(0, pos - 50), pos);
                const textAfter = state.doc.sliceString(pos, Math.min(state.doc.length, pos + 10));

                const match = textBefore.match(/\[\[([^\]]*?)$/);

                if (!match) {
                    return null;
                }

                const searchTerm = match[1].toLowerCase();
                const matchStart = pos - searchTerm.length;

                const allNodes = fileSystem.getNodes().filter(n => n.type === 'file');

                const options = allNodes.map(node => {
                    const fileName = node.name;
                    const filePath = node.path;

                    const lowerName = fileName.toLowerCase();
                    let score = 0;

                    if (lowerName.startsWith(searchTerm)) {
                        score = 100;
                    } else if (lowerName.includes(searchTerm)) {
                        score = 50;
                    } else {
                        let searchIndex = 0;
                        for (let i = 0; i < lowerName.length && searchIndex < searchTerm.length; i++) {
                            if (lowerName[i] === searchTerm[searchIndex]) {
                                searchIndex++;
                            }
                        }
                        if (searchIndex === searchTerm.length) {
                            score = 25;
                        }
                    }

                    return {
                        label: fileName,
                        detail: filePath,
                        apply: (view, completion, from, to) => {
                            const currentPos = view.state.selection.main.head;

                            const afterText = view.state.doc.sliceString(currentPos, Math.min(view.state.doc.length, currentPos + 10));
                            const closingMatch = afterText.match(/^(\]\]?)/);
                            const closingLen = closingMatch ? closingMatch[1].length : 0;

                            view.dispatch({
                                changes: {
                                    from: from,
                                    to: currentPos + closingLen,
                                    insert: `${node.id}]]`
                                }
                            });
                        },
                        boost: score,
                        type: "file"
                    };
                }).filter(opt => opt.boost > 0);

                if (searchTerm === '') {
                    return {
                        from: matchStart,
                        options: allNodes.map(node => ({
                            label: node.name,
                            detail: node.path,
                            apply: (view, completion, from, to) => {
                                const currentPos = view.state.selection.main.head;

                                const afterText = view.state.doc.sliceString(currentPos, Math.min(view.state.doc.length, currentPos + 10));
                                const closingMatch = afterText.match(/^(\]\]?)/);
                                const closingLen = closingMatch ? closingMatch[1].length : 0;

                                view.dispatch({
                                    changes: {
                                        from: from,
                                        to: currentPos + closingLen,
                                        insert: `${node.id}]]`
                                    }
                                });
                            },
                            type: "file"
                        })),
                        validFor: /^[^\]]*$/
                    };
                }

                if (options.length === 0) {
                    return null;
                }

                return {
                    from: matchStart,
                    options: options.sort((a, b) => b.boost - a.boost),
                    validFor: /^[^\]]*$/
                };
            }
        ],
        activateOnTyping: true,
        closeOnBlur: true,
        maxRenderedOptions: 20,
        defaultKeymap: true
    });
};
