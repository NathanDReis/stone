export class ThemeModal {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.element = null;
        this.overlay = null;
        this.isEditorMode = false;

        // Default new theme template
        this.newTheme = {
            name: '',
            id: '',
            variables: {
                '--bg-main': '#ffffff',
                '--bg-secondary': '#f6f8fa',
                '--bg-tertiary': '#eaeef2',
                '--text-primary': '#0d1117',
                '--text-secondary': '#57606a',
                '--text-muted': '#8c959f',
                '--border-muted': '#d1d5da',
                '--accent': '#2563eb'
            }
        };
    }

    create() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'theme-modal';

        this.container = modal;

        this.renderContent();

        this.overlay.appendChild(modal);

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        document.body.appendChild(this.overlay);
        this.element = modal;
    }

    renderContent() {
        this.container.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.className = 'theme-modal-header';

        const title = document.createElement('h3');
        title.className = 'theme-modal-title';
        title.textContent = this.isEditorMode ? 'Criar Novo Tema' : 'Selecionar Tema';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'theme-modal-close';
        closeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
        closeBtn.onclick = () => this.hide();

        header.appendChild(title);
        header.appendChild(closeBtn);
        this.container.appendChild(header);

        if (this.isEditorMode) {
            this.renderEditor();
        } else {
            this.renderGrid();
        }
    }

    renderGrid() {
        const grid = document.createElement('div');
        grid.className = 'theme-grid';

        // Available Themes
        const themes = this.themeManager.getAvailableThemes();
        themes.forEach(theme => {
            const card = this.createThemeCard(theme);
            grid.appendChild(card);
        });

        // Create New Button
        const createBtn = document.createElement('button');
        createBtn.className = 'theme-card theme-card-create';
        createBtn.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 32px;">add_circle</span>
            <span style="margin-top: 8px; font-weight: 500;">Criar Novo</span>
        `;
        createBtn.onclick = () => {
            this.isEditorMode = true;
            // Reset template
            this.newTheme.name = '';
            this.newTheme.id = '';
            this.renderContent();
        };
        grid.appendChild(createBtn);

        this.container.appendChild(grid);
    }

    createThemeCard(theme) {
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.title = theme.name;

        if (this.themeManager.currentTheme === theme.id) {
            card.classList.add('active');
        }

        const preview = document.createElement('div');
        preview.className = 'theme-preview';

        const bgMain = theme.variables['--bg-main'];
        const bgSec = theme.variables['--bg-secondary'];
        const accent = theme.variables['--accent'];

        const mainPart = document.createElement('div');
        mainPart.className = 'theme-preview-main';
        mainPart.style.setProperty('--preview-bg', bgMain);

        const secPart = document.createElement('div');
        secPart.className = 'theme-preview-secondary';
        secPart.style.setProperty('--preview-bg-sec', bgSec);

        const accentDot = document.createElement('div');
        accentDot.className = 'theme-preview-accent-dot';
        accentDot.style.setProperty('--preview-accent', accent);

        secPart.appendChild(accentDot);
        preview.appendChild(mainPart);
        preview.appendChild(secPart);

        const name = document.createElement('div');
        name.className = 'theme-card-name';
        name.textContent = theme.name;

        card.appendChild(preview);
        card.appendChild(name);

        // Delete button for custom themes
        if (this.themeManager.isCustom(theme.id)) {
            const delBtn = document.createElement('button');
            delBtn.className = 'theme-delete-btn';
            delBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">delete</span>';
            delBtn.title = 'Excluir tema';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Excluir o tema "${theme.name}"?`)) {
                    this.themeManager.deleteCustomTheme(theme.id);
                    this.renderContent(); // Re-render logic
                }
            };
            card.appendChild(delBtn);
        }

        card.addEventListener('click', () => {
            this.themeManager.apply(theme.id);
            this.updateActiveState();
        });

        return card;
    }

    renderEditor() {
        const editor = document.createElement('div');
        editor.className = 'theme-editor';

        // Name Input
        const nameGroup = document.createElement('div');
        nameGroup.className = 'form-group';
        nameGroup.innerHTML = `
            <label>Nome do Tema</label>
            <input type="text" class="form-input" placeholder="Ex: Meu Tema Escuro" value="${this.newTheme.name}">
        `;
        const nameInput = nameGroup.querySelector('input');
        nameInput.addEventListener('input', (e) => {
            this.newTheme.name = e.target.value;
        });
        editor.appendChild(nameGroup);

        // Colors
        const colorsLabel = document.createElement('label');
        colorsLabel.style.cssText = 'font-size: 0.9rem; color: var(--text-secondary); font-weight: 500; margin-top: 8px;';
        colorsLabel.textContent = 'Cores';
        editor.appendChild(colorsLabel);

        const colorGrid = document.createElement('div');
        colorGrid.className = 'color-grid';

        const labels = {
            '--bg-main': 'Fundo Principal',
            '--bg-secondary': 'Fundo Secundário',
            '--bg-tertiary': 'Fundo Terciário',
            '--text-primary': 'Texto Principal',
            '--text-secondary': 'Texto Secundário',
            '--text-muted': 'Texto Mute',
            '--border-muted': 'Bordas',
            '--accent': 'Destaque'
        };

        Object.entries(this.newTheme.variables).forEach(([key, val]) => {
            const group = document.createElement('div');
            group.className = 'color-input-group';

            const input = document.createElement('input');
            input.type = 'color';
            input.value = val;
            input.oninput = (e) => {
                this.newTheme.variables[key] = e.target.value;
                // Live preview could happen here if we applied it to a dummy element
            };

            const label = document.createElement('span');
            label.textContent = labels[key] || key;

            group.appendChild(input);
            group.appendChild(label);
            colorGrid.appendChild(group);
        });

        editor.appendChild(colorGrid);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'editor-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.onclick = () => {
            this.isEditorMode = false;
            this.renderContent();
        };

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = 'Salvar Tema';
        saveBtn.onclick = () => this.saveTheme();

        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);
        editor.appendChild(actions);

        this.container.appendChild(editor);
    }

    saveTheme() {
        if (!this.newTheme.name.trim()) {
            alert('Por favor, dê um nome ao tema.');
            return;
        }

        // Generate ID
        const id = 'custom-' + Date.now();
        this.newTheme.id = id;

        this.themeManager.saveCustomTheme({ ...this.newTheme }); // Clone object

        this.isEditorMode = false;
        this.renderContent();
    }

    updateActiveState() {
        if (!this.element || this.isEditorMode) return;
        const cards = this.element.querySelectorAll('.theme-card');
        const themes = this.themeManager.getAvailableThemes();

        // Note: The "Create" card is at the end, and arrays might align differently
        // It's safer to re-render or match by title, but re-render is cheap here
        this.renderGrid();
        // Or simple selection logic if we assume order is preserved before "Add" button
        // But since we have a mix of custom/default, easiest is just to re-render content or simpler:

        const allThemes = this.themeManager.getAvailableThemes();
        const currentId = this.themeManager.currentTheme;

        // Simple class toggle if possible, otherwise re-render
        cards.forEach(card => {
            // We didn't store ID on card in previous implementation, let's just re-render grid
            // to be safe and simple
        });

        // Actually, let's just re-render content to show new active border cleanly
        this.container.innerHTML = '';
        this.renderContent();
    }

    show() {
        if (!this.overlay) {
            this.create();
        }
        this.isEditorMode = false; // Always start in list mode
        this.renderContent();

        requestAnimationFrame(() => {
            this.overlay.classList.add('active');
        });
    }

    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    }
}
