export class EmptyState {
    constructor(container) {
        this.container = container;
        this.element = null;
        this.render();
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'empty-state';
        this.element.innerHTML = `
            <div class="empty-state-content">
                <div class="empty-state-logo">
                    <span class="material-symbols-outlined">description</span>
                </div>
                <ul class="empty-state-actions">
                    <li id="es-new-file">
                        <span class="action-text">Criar novo arquivo</span>
                        <span class="action-shortcut">Alt + N</span>
                    </li>
                    <li id="es-open-file">
                        <span class="action-text">Abrir arquivo existente</span>
                        <span class="action-shortcut">Alt + O</span>
                    </li>
                </ul>
            </div>
        `;
        this.container.appendChild(this.element);

        this.element.querySelector('#es-new-file').onclick = () => {
            document.getElementById('btn-add-file').click();
        };

        this.element.querySelector('#es-open-file').onclick = () => {
            document.getElementById('search').focus();
        };
    }

    show() {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }
}
