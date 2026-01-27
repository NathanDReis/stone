export class IconPickerModal {
    constructor() {
        this.overlay = null;
        this.modal = null;
        this.onConfirm = null;
        this.selectedIcon = null;

        this.icons = [
            { name: 'folder', icon: 'folder' },
            { name: 'file', icon: 'description' },
            { name: 'home', icon: 'home' },
            { name: 'work', icon: 'work' },
            { name: 'star', icon: 'star' },
            { name: 'cloud', icon: 'cloud' },
            { name: 'settings', icon: 'settings' },
            { name: 'image', icon: 'image' },
            { name: 'code', icon: 'code' },
            { name: 'lock', icon: 'lock' },
            { name: 'visibility', icon: 'visibility' },
            { name: 'delete', icon: 'delete' },
            { name: 'edit', icon: 'edit' },
            { name: 'add', icon: 'add' },
            { name: 'info', icon: 'info' }
        ];

        this.init();
    }

    init() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay icon-picker-overlay';
        this.overlay.style.display = 'none';

        this.modal = document.createElement('div');
        this.modal.className = 'modal icon-picker-modal';

        const title = document.createElement('h3');
        title.textContent = 'Escolha um ícone';
        this.modal.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'icon-grid';

        this.icons.forEach(item => {
            const btn = document.createElement('div');
            btn.className = 'icon-option';
            btn.title = item.name;

            const icon = document.createElement('span');
            icon.className = 'material-symbols-outlined';
            icon.textContent = item.icon;

            const label = document.createElement('span');
            label.className = 'icon-label';
            label.textContent = item.name;

            btn.appendChild(icon);
            btn.appendChild(label);

            btn.onclick = () => this.selectIcon(item.name, btn);

            grid.appendChild(btn);
        });

        this.modal.appendChild(grid);

        const actions = document.createElement('div');
        actions.className = 'modal-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-text';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.onclick = () => this.hide();

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn-primary';
        confirmBtn.textContent = 'Confirmar';
        confirmBtn.onclick = () => this.confirm();

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);

        this.modal.appendChild(actions);
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.hide();
        });
    }

    selectIcon(name, element) {
        this.selectedIcon = name;

        const all = this.modal.querySelectorAll('.icon-option');
        all.forEach(el => el.classList.remove('selected'));

        element.classList.add('selected');
    }

    show(onConfirm) {
        this.onConfirm = onConfirm;
        this.selectedIcon = null;
        this.overlay.style.display = 'flex';

        const all = this.modal.querySelectorAll('.icon-option');
        all.forEach(el => el.classList.remove('selected'));
    }

    hide() {
        this.overlay.style.display = 'none';
        this.onConfirm = null;
    }

    confirm() {
        if (this.selectedIcon && this.onConfirm) {
            this.onConfirm(this.selectedIcon);
            this.hide();
        }
    }
}
