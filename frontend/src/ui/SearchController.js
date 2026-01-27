import { Toast } from '../ui/Toast';

export class SearchController {
    constructor(searchElement, fileSystem, options = {}) {
        this.input = searchElement;
        this.fileSystem = fileSystem;
        this.onSelect = options.onSelect || (() => { });
        this.onFilter = options.onFilter || (() => { });
        this.resultsContainer = null;
        this.toast = new Toast();

        this.init();
    }

    init() {
        this.resultsContainer = document.createElement('div');
        this.resultsContainer.className = 'search-results';

        const boxSearch = this.input.closest('.box-search');
        if (boxSearch) {
            boxSearch.appendChild(this.resultsContainer);
            const computedStyle = window.getComputedStyle(boxSearch);
            if (computedStyle.position === 'static') {
                boxSearch.style.position = 'relative';
            }
        } else {
            this.toast.error('SearchController: container box-search não encontrado');
        }

        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('focus', (e) => this.handleInput(e));

        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.resultsContainer.contains(e.target)) {
                this.hideResults();
            }
        });
    }

    handleInput(e) {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            this.hideResults();
            this.onFilter(null);
            return;
        }

        if (query.startsWith('#')) {
            this.handleTagSearch(query);
            return;
        }

        this.onFilter(null);

        const nodes = this.fileSystem.getNodes();
        const results = [];

        nodes.forEach(node => {
            if (node.type !== 'file') return;

            const nameMatch = node.name.toLowerCase().includes(query);
            let contentMatch = false;
            let snippet = '';

            const doc = this.fileSystem.getDocument(node.id);
            if (doc && doc.content) {
                const contentLower = doc.content.toLowerCase();
                const index = contentLower.indexOf(query);
                if (index !== -1) {
                    contentMatch = true;

                    const start = Math.max(0, index - 20);
                    const end = Math.min(doc.content.length, index + query.length + 40);
                    snippet = (start > 0 ? '...' : '') +
                        doc.content.substring(start, end).replace(/\n/g, ' ') +
                        (end < doc.content.length ? '...' : '');
                }
            }

            if (nameMatch || contentMatch) {
                results.push({
                    node,
                    matchType: nameMatch ? 'title' : 'content',
                    snippet: snippet
                });
            }
        });

        this.renderResults(results, query);
    }

    handleTagSearch(query) {
        const allTags = new Set();
        const nodes = this.fileSystem.getNodes();

        nodes.forEach(node => {
            if (node.type !== 'file') return;
            const doc = this.fileSystem.getDocument(node.id);
            if (doc && doc.content) {
                const matches = doc.content.match(/#[a-zA-Z0-9_\-]+/g);
                if (matches) {
                    matches.forEach(tag => allTags.add(tag.toLowerCase()));
                }
            }
        });

        const matchingTags = Array.from(allTags)
            .filter(tag => tag.startsWith(query))
            .sort();

        const results = [];
        const filteredNodes = [];

        matchingTags.forEach(tag => {
            results.push({
                type: 'tag',
                name: tag,
                snippet: 'Filtrar por esta tag'
            });
        });

        if (results.length > 0 || query.length > 1) {
            nodes.forEach(node => {
                if (node.type !== 'file') return;
                const doc = this.fileSystem.getDocument(node.id);
                if (doc && doc.content) {
                    const contentLower = doc.content.toLowerCase();

                    if (contentLower.includes(query)) {
                        results.push({
                            type: 'document',
                            node: node,
                            matchType: 'content',
                            snippet: `...${query}...`
                        });
                        filteredNodes.push(node);
                    }
                }
            });
        }

        if (query.length > 1) {
            this.onFilter(filteredNodes);
        } else {
            this.onFilter(null);
        }

        this.renderResults(results, query);
    }

    filterByTag(tag) {
        const nodes = this.fileSystem.getNodes();
        const filteredNodes = [];
        const query = tag.toLowerCase();

        nodes.forEach(node => {
            if (node.type !== 'file') return;
            const doc = this.fileSystem.getDocument(node.id);
            if (doc && doc.content) {
                const contentLower = doc.content.toLowerCase();
                if (contentLower.includes(query)) {
                    filteredNodes.push(node);
                }
            }
        });

        this.onFilter(filteredNodes);
        this.hideResults();

        if (filteredNodes.length === 0) {
            this.toast.info(`Nenhum arquivo encontrado com a tag ${tag}`);
        }
    }

    clearFilter() {
        this.onFilter(null);
    }

    renderResults(results, query) {
        this.resultsContainer.innerHTML = '';

        if (results.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'search-item empty';
            empty.textContent = 'Nenhum resultado encontrado';
            this.resultsContainer.appendChild(empty);
            this.showResults();
            return;
        }

        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-item';

            if (result.type === 'tag') {
                const icon = document.createElement('span');
                icon.className = 'material-symbols-outlined';
                icon.textContent = 'grid_3x3';

                const content = document.createElement('div');
                content.className = 'search-item-content';

                const title = document.createElement('div');
                title.className = 'search-item-title';
                title.textContent = result.name;

                const snippet = document.createElement('div');
                snippet.className = 'search-item-snippet';
                snippet.textContent = result.snippet;

                content.appendChild(title);
                content.appendChild(snippet);
                item.appendChild(icon);
                item.appendChild(content);

                item.addEventListener('click', () => {
                    this.input.value = result.name;
                    this.input.focus();
                    this.handleInput({ target: this.input });
                });

            } else {
                const { node, snippet } = result;

                const icon = document.createElement('span');
                icon.className = 'material-symbols-outlined';
                icon.textContent = 'description';

                const content = document.createElement('div');
                content.className = 'search-item-content';

                const title = document.createElement('div');
                title.className = 'search-item-title';
                title.textContent = node.name;
                content.appendChild(title);

                if (snippet) {
                    const snippetEl = document.createElement('div');
                    snippetEl.className = 'search-item-snippet';
                    const regex = new RegExp(`(${query})`, 'gi');
                    snippetEl.innerHTML = snippet.replace(regex, '<strong>$1</strong>');
                    content.appendChild(snippetEl);
                }

                item.appendChild(icon);
                item.appendChild(content);

                item.addEventListener('click', () => {
                    this.onSelect(node);
                    this.hideResults();
                    this.input.value = '';
                });
            }

            this.resultsContainer.appendChild(item);
        });

        this.showResults();
    }

    showResults() {
        this.resultsContainer.classList.add('visible');
    }

    hideResults() {
        this.resultsContainer.classList.remove('visible');
    }
}
