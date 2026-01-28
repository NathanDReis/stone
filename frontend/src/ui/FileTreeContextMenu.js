export class FileTreeContextMenu {
    constructor(fileTree, options = {}) {
        this.fileTree = fileTree;
        this.onDelete = options.onDelete || (() => { });
        this.onRename = options.onRename || (() => { });
        this.onChangeIcon = options.onChangeIcon || (() => { });
        this.onCreateSeparator = options.onCreateSeparator || (() => { });
        this.menu = null;
        this.activeNode = null;

        this.init();
    }

    init() {
        document.addEventListener('click', () => this.hide());
        document.addEventListener('contextmenu', (e) => {
            if (!this.menu) return;
        });
    }

    show(x, y, node) {
        this.hide();
        this.activeNode = node;

        const parentId = node ? (node.type === 'folder' ? node.id : node.parent_id) : null;
        const items = [];

        if (!this.fileTree.readOnly) {
            items.push(
                {
                    label: 'Novo Arquivo',
                    icon: 'note_add',
                    action: () => this.fileTree.startCreation('file', parentId)
                },
                {
                    label: 'Nova Pasta',
                    icon: 'create_new_folder',
                    action: () => this.fileTree.startCreation('folder', parentId)
                },
                {
                    label: 'Separador',
                    icon: 'horizontal_rule',
                    action: () => this.onCreateSeparator(parentId)
                }
            );

            if (node) {
                if (node.type !== 'separator') {
                    items.push(
                        { type: 'separator' },
                        {
                            label: 'Renomear',
                            icon: 'edit',
                            action: () => this.onRename(node)
                        },
                        {
                            label: 'Alterar Ícone',
                            icon: 'sentiment_satisfied',
                            action: () => this.onChangeIcon(node)
                        }
                    );
                }

                items.push(
                    { type: 'separator' },
                    {
                        label: 'Excluir',
                        icon: 'delete',
                        action: () => this.onDelete(node),
                        danger: true
                    }
                );
            }
        }

        this.menu = document.createElement('div');
        this.menu.className = 'context-menu is-visible';
        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;

        items.forEach(item => {
            if (item.type === 'separator') {
                const sep = document.createElement('div');
                sep.className = 'context-menu-separator';
                this.menu.appendChild(sep);
            } else {
                const div = document.createElement('div');
                div.className = 'context-menu-item';
                if (item.danger) div.classList.add('danger');

                const icon = document.createElement('span');
                icon.className = 'context-menu-icon material-symbols-outlined';
                icon.textContent = item.icon;
                icon.style.fontFamily = "'Material Symbols Outlined'";

                const label = document.createElement('div');
                label.className = 'context-menu-label';
                label.textContent = item.label;

                div.appendChild(icon);
                div.appendChild(label);

                div.onclick = (e) => {
                    e.stopPropagation();
                    item.action();
                    this.hide();
                };

                this.menu.appendChild(div);
            }
        });

        document.body.appendChild(this.menu);

        const rect = this.menu.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        if (x + rect.width > winW) this.menu.style.left = `${winW - rect.width - 5}px`;
        if (y + rect.height > winH) this.menu.style.top = `${winH - rect.height - 5}px`;
    }

    hide() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
            this.activeNode = null;
        }
    }
}
