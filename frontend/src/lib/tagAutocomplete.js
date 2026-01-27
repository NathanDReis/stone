import { autocompletion } from "@codemirror/autocomplete";

/**
 * Extrai todas as tags únicas de todos os documentos do sistema de arquivos
 * @param {FileSystemService} fileSystem 
 * @returns {Set<string>} Set com todas as tags encontradas
 */
function extractAllTags(fileSystem) {
    const allTags = new Set();
    const nodes = fileSystem.getNodes();

    nodes.forEach(node => {
        if (node.type !== 'file') return;

        const doc = fileSystem.getDocument(node.id);
        if (doc && doc.content) {
            // Regex para encontrar tags: # seguido de letras, números, _ ou -
            const matches = doc.content.match(/#[a-zA-Z0-9_\-]+/g);
            if (matches) {
                matches.forEach(tag => allTags.add(tag));
            }
        }
    });

    return allTags;
}

/**
 * Cria a fonte de autocomplete para tags
 * @param {FileSystemService} fileSystem 
 * @returns {Function} Fonte do autocomplete
 */
export const tagAutocompleteSource = (fileSystem) => {
    return (context) => {
        const { state, pos } = context;

        const textBefore = state.doc.sliceString(Math.max(0, pos - 50), pos);

        const match = textBefore.match(/#([a-zA-Z0-9_\-]*)$/);

        if (!match) {
            return null;
        }

        const searchTerm = match[1].toLowerCase();
        const matchStart = pos - searchTerm.length;

        const allTags = extractAllTags(fileSystem);

        const uniqueTags = Array.from(allTags);

        const options = uniqueTags.map(tag => {
            const tagWithoutHash = tag.substring(1);
            const lowerTag = tagWithoutHash.toLowerCase();
            let score = 0;

            if (searchTerm === '') {
                score = 100;
            } else {
                if (lowerTag.startsWith(searchTerm)) {
                    score = 100;
                }
                else if (lowerTag.includes(searchTerm)) {
                    score = 50;
                }
                else {
                    let searchIndex = 0;
                    for (let i = 0; i < lowerTag.length && searchIndex < searchTerm.length; i++) {
                        if (lowerTag[i] === searchTerm[searchIndex]) {
                            searchIndex++;
                        }
                    }
                    if (searchIndex === searchTerm.length) {
                        score = 25;
                    }
                }
            }

            return {
                label: tagWithoutHash,
                detail: tag,
                apply: (view, completion, from, to) => {
                    const currentPos = view.state.selection.main.head;

                    view.dispatch({
                        changes: {
                            from: from,
                            to: currentPos,
                            insert: tagWithoutHash
                        }
                    });
                },
                boost: score,
                type: "keyword"
            };
        }).filter(opt => opt.boost > 0);

        if (options.length === 0) {
            return null;
        }

        const sortedOptions = options.sort((a, b) => b.boost - a.boost);

        return {
            from: matchStart,
            options: sortedOptions,
            validFor: /^[a-zA-Z0-9_\-]*$/
        };
    };
};
