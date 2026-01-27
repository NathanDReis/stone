import { Toast } from './Toast.js';
import { ConfirmDialog } from './ConfirmDialog.js';

export class IconPickerModal {
    constructor(iconManager) {
        this.iconManager = iconManager;
        this.overlay = null;
        this.container = null;
        this.onConfirm = null;
        this.isEditorMode = false;
        this.toast = new Toast();
        this.dialog = new ConfirmDialog();

        this.newIcon = {
            name: '',
            icon: ''
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
            if (e.target === this.overlay) this.hide();
        });

        document.body.appendChild(this.overlay);
    }

    renderContent() {
        this.container.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'theme-modal-header';

        const title = document.createElement('h3');
        title.className = 'theme-modal-title';
        title.textContent = this.isEditorMode ? 'Adicionar Novo Ícone' : 'Selecionar Ícone';

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

        const icons = this.iconManager.getIcons();
        icons.forEach(icon => {
            const card = this.createIconCard(icon);
            grid.appendChild(card);
        });

        const createBtn = document.createElement('button');
        createBtn.className = 'theme-card theme-card-create';
        createBtn.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 32px;">add_circle</span>
            <span style="margin-top: 8px; font-weight: 500;">Adicionar</span>
        `;
        createBtn.onclick = () => {
            this.isEditorMode = true;
            this.newIcon = { name: '', icon: '' };
            this.renderContent();
        };
        grid.appendChild(createBtn);

        this.container.appendChild(grid);
    }

    createIconCard(iconData) {
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.title = iconData.name;

        const preview = document.createElement('div');
        preview.className = 'theme-preview';

        preview.style.display = 'flex';
        preview.style.alignItems = 'center';
        preview.style.justifyContent = 'center';
        preview.style.backgroundColor = 'var(--bg-secondary)';
        preview.style.color = 'var(--accent)';

        const iconEl = document.createElement('span');
        iconEl.className = 'material-symbols-outlined';
        iconEl.style.fontSize = '48px';
        iconEl.textContent = iconData.icon;

        preview.appendChild(iconEl);

        const name = document.createElement('div');
        name.className = 'theme-card-name';
        name.textContent = iconData.name;

        card.appendChild(preview);
        card.appendChild(name);

        if (this.iconManager.isCustom(iconData.id)) {
            const delBtn = document.createElement('button');
            delBtn.className = 'theme-delete-btn';
            delBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">delete</span>';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                this.dialog.show({
                    title: "Excluir Ícone",
                    message: `Excluir o ícone "${iconData.name}"?`,
                    confirmText: "Excluir",
                    onConfirm: () => {
                        this.iconManager.deleteCustomIcon(iconData.id);
                        this.renderContent();
                    }
                });
            };
            card.appendChild(delBtn);
        }

        card.addEventListener('click', () => {
            this.confirm(iconData.icon);
        });

        return card;
    }

    renderEditor() {
        const editor = document.createElement('div');
        editor.className = 'theme-editor';

        const nameGroup = document.createElement('div');
        nameGroup.className = 'form-group';
        nameGroup.innerHTML = `
            <label>Nome do Ícone</label>
            <input type="text" class="form-input" placeholder="Ex: Estrela" value="${this.newIcon.name}">
        `;
        const nameInput = nameGroup.querySelector('input');
        nameInput.oninput = (e) => this.newIcon.name = e.target.value;
        editor.appendChild(nameGroup);

        const iconGroup = document.createElement('div');
        iconGroup.className = 'form-group';
        iconGroup.innerHTML = `
            <label>Código Google Icon (ex: star, home, work)</label>
            <input type="text" class="form-input" placeholder="star" value="${this.newIcon.icon}">
        `;
        const iconInput = iconGroup.querySelector('input');
        iconInput.oninput = (e) => {
            this.newIcon.icon = e.target.value;
            this.updatePreview(previewIcon);
        };
        editor.appendChild(iconGroup);

        const previewLabel = document.createElement('label');
        previewLabel.style.cssText = 'font-size: 0.9rem; color: var(--text-secondary); font-weight: 500;';
        previewLabel.textContent = 'Preview';
        editor.appendChild(previewLabel);

        const previewContainer = document.createElement('div');
        previewContainer.style.cssText = `
            height: 100px; 
            background: var(--bg-secondary); 
            border: 1px solid var(--border-muted); 
            border-radius: 8px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
        `;
        const previewIcon = document.createElement('span');
        previewIcon.className = 'material-symbols-outlined';
        previewIcon.style.fontSize = '64px';
        previewIcon.style.color = 'var(--accent)';
        previewContainer.appendChild(previewIcon);
        editor.appendChild(previewContainer);

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
        saveBtn.textContent = 'Salvar';
        saveBtn.onclick = () => this.saveIcon();

        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);
        editor.appendChild(actions);

        this.container.appendChild(editor);
        this.updatePreview(previewIcon);
    }

    updatePreview(element) {
        element.textContent = this.newIcon.icon || 'help';
    }

    saveIcon() {
        if (!this.newIcon.name.trim() || !this.newIcon.icon.trim()) {
            this.toast.warning('Preencha nome e código do ícone.');
            return;
        }

        try {
            this.iconManager.addCustomIcon(this.newIcon.name, this.newIcon.icon);
            this.isEditorMode = false;
            this.renderContent();
        } catch (e) {
            this.toast.error(e.message);
        }
    }

    show(onConfirm) {
        this.onConfirm = onConfirm;
        if (!this.overlay) this.create();

        this.isEditorMode = false;
        this.renderContent();

        this.overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            this.overlay.classList.add('active');
        });
    }

    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
            setTimeout(() => {
                this.overlay.style.display = 'none';
            }, 200);
        }
        this.onConfirm = null;
    }

    confirm(iconCode) {
        if (this.onConfirm) {
            this.onConfirm(iconCode);
            this.hide();
        }
    }
}
