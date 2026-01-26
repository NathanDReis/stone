import { Toast } from '../ui/Toast';

export class SearchController {
    constructor(searchElement, fileSystem, options = {}) {
        this.input = searchElement;
        this.fileSystem = fileSystem;
        this.onSelect = options.onSelect || (() => { });
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
            return;
        }

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

    renderResults(results, query) {
        this.resultsContainer.innerHTML = '';

        if (results.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'search-item empty';
            empty.textContent = 'Nenhum documento encontrado';
            this.resultsContainer.appendChild(empty);
            this.showResults();
            return;
        }

        results.forEach(result => {
            const { node, matchType, snippet } = result;
            const item = document.createElement('div');
            item.className = 'search-item';

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
