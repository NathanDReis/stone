import { autocompletion } from "@codemirror/autocomplete";

/**
 * Creates an autocomplete extension for internal links
 * Triggers when typing [[ and shows available files
 * @param {Object} fileSystem - FileSystem service instance
 * @returns {Extension} CodeMirror extension
 */
export const createLinkAutocomplete = (fileSystem) => {
    return autocompletion({
        override: [
            (context) => {
                const { state, pos } = context;

                // Get text before and after cursor
                const textBefore = state.doc.sliceString(Math.max(0, pos - 50), pos);
                const textAfter = state.doc.sliceString(pos, Math.min(state.doc.length, pos + 10));

                // Check if we're inside [[ ]]
                const match = textBefore.match(/\[\[([^\]]*?)$/);

                if (!match) {
                    return null;
                }

                const searchTerm = match[1].toLowerCase();
                const matchStart = pos - searchTerm.length;

                // Check if there are closing brackets after cursor
                const closingBracketsMatch = textAfter.match(/^(\]\]?)/);
                const hasClosingBrackets = closingBracketsMatch && closingBracketsMatch[1].length > 0;
                const closingBracketsLength = hasClosingBrackets ? closingBracketsMatch[1].length : 0;

                // Get all file nodes
                const allNodes = fileSystem.getNodes().filter(n => n.type === 'file');

                // Create completion options
                const options = allNodes.map(node => {
                    const fileName = node.name;
                    const filePath = node.path;

                    // Calculate relevance score for sorting
                    const lowerName = fileName.toLowerCase();
                    let score = 0;

                    if (lowerName.startsWith(searchTerm)) {
                        score = 100; // Exact prefix match
                    } else if (lowerName.includes(searchTerm)) {
                        score = 50; // Contains search term
                    } else {
                        // Fuzzy match - check if all characters appear in order
                        let searchIndex = 0;
                        for (let i = 0; i < lowerName.length && searchIndex < searchTerm.length; i++) {
                            if (lowerName[i] === searchTerm[searchIndex]) {
                                searchIndex++;
                            }
                        }
                        if (searchIndex === searchTerm.length) {
                            score = 25; // Fuzzy match
                        }
                    }

                    return {
                        label: fileName,
                        detail: filePath,
                        apply: (view, completion, from, to) => {
                            // Get current cursor position
                            const currentPos = view.state.selection.main.head;

                            // Check for closing brackets after current position
                            const afterText = view.state.doc.sliceString(currentPos, Math.min(view.state.doc.length, currentPos + 10));
                            const closingMatch = afterText.match(/^(\]\]?)/);
                            const closingLen = closingMatch ? closingMatch[1].length : 0;

                            // Replace from 'from' (provided by autocomplete) to current position + any closing brackets
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
                }).filter(opt => opt.boost > 0); // Only show matches

                // If no search term, show all files
                if (searchTerm === '') {
                    return {
                        from: matchStart,
                        options: allNodes.map(node => ({
                            label: node.name,
                            detail: node.path,
                            apply: (view, completion, from, to) => {
                                // Get current cursor position
                                const currentPos = view.state.selection.main.head;

                                // Check for closing brackets after current position
                                const afterText = view.state.doc.sliceString(currentPos, Math.min(view.state.doc.length, currentPos + 10));
                                const closingMatch = afterText.match(/^(\]\]?)/);
                                const closingLen = closingMatch ? closingMatch[1].length : 0;

                                // Replace from 'from' (provided by autocomplete) to current position + any closing brackets
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
