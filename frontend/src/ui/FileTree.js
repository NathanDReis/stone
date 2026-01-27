import { ConfirmDialog } from './ConfirmDialog.js';

export class FileTree {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.onFileSelect = options.onFileSelect || (() => { });
        this.onNodeCreate = options.onNodeCreate || (() => { });
        this.onNodeMove = options.onNodeMove || (() => { });
        this.onNodeRename = options.onNodeRename || (() => { });
        this.onNodeReorder = options.onNodeReorder || (() => { });
        this.onNodeDelete = options.onNodeDelete || (() => { });
        this.onChangeIcon = options.onChangeIcon || (() => { });
        this.contextMenu = options.contextMenu || null;

        this.expandedFolders = new Set();
        this.nodes = [];
        this.activeNodeId = null;
        this.dialog = new ConfirmDialog();

        this.init();
    }

    init() {
        this.container.classList.add('tree-container');
        this.container.tabIndex = 0;
        this.container.innerHTML = '<div class="tree-empty">Carregando...</div>';

        this.container.addEventListener('dragover', (e) => this._handleContainerDragOver(e));
        this.container.addEventListener('dragleave', (e) => this._handleContainerDragLeave(e));
        this.container.addEventListener('drop', (e) => this._handleContainerDrop(e));
        this.container.addEventListener('click', (e) => this._handleContainerClick(e));
        this.container.addEventListener('keydown', (e) => this._handleKeyDown(e));
        this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    render(nodes) {
        this.nodes = nodes;
        this.container.innerHTML = '';

        const tree = this._buildTree(nodes, null);
        this.container.appendChild(tree);
    }

    _buildTree(nodes, parentId) {
        const children = nodes.filter(n => n.parent_id === parentId);

        children.sort((a, b) => (a.order || 0) - (b.order || 0));

        const ul = document.createElement('ul');
        ul.className = 'tree-list';

        children.forEach(node => {
            const li = document.createElement('li');
            li.className = 'tree-node';
            li.dataset.id = node.id;
            li.dataset.type = node.type;

            if (node.type === 'separator') {
                li.classList.add('tree-separator-node');
                const hr = document.createElement('hr');
                hr.className = 'tree-separator';

                hr.draggable = true;
                hr.addEventListener('dragstart', (e) => this._handleDragStart(e, node));
                hr.addEventListener('dragover', (e) => this._handleDragOver(e, node));
                hr.addEventListener('drop', (e) => this._handleDrop(e, node));
                hr.addEventListener('dblclick', (e) => this._handleSeparatorDblClick(node, e));
                hr.addEventListener('contextmenu', (e) => this._handleContextMenu(e, node));

                li.appendChild(hr);
                ul.appendChild(li);
                return;
            }

            if (node.type === 'folder' && this.expandedFolders.has(node.id)) {
                li.classList.add('expanded');
            }

            const label = document.createElement('div');
            label.className = 'tree-label';
            label.draggable = true;

            if (this.activeNodeId === node.id) {
                label.classList.add('active');
            }

            const arrow = document.createElement('span');
            arrow.className = 'material-symbols-outlined tree-arrow';
            arrow.textContent = 'chevron_right';
            arrow.style.opacity = node.type === 'folder' ? '1' : '0';

            const icon = document.createElement('span');
            icon.className = `material-symbols-outlined tree-icon${node.type === 'folder' ? ' tree-icon-folder' : ''}`;

            if (node.icon) {
                icon.textContent = node.icon;
            } else {
                icon.textContent = node.type === 'folder' ? 'folder' : 'description';
            }

            if (node.type === 'folder') icon.style.color = 'var(--text-secondary)';
            if (node.type === 'file') icon.style.color = 'var(--accent)';

            const text = document.createElement('span');
            text.textContent = node.name;
            text.className = 'tree-text';

            label.appendChild(arrow);
            label.appendChild(icon);
            label.appendChild(text);

            label.onclick = (e) => this._handleNodeClick(node, e);
            label.oncontextmenu = (e) => this._handleContextMenu(e, node);

            label.addEventListener('dragstart', (e) => this._handleDragStart(e, node));
            label.addEventListener('dragover', (e) => this._handleDragOver(e, node));
            label.addEventListener('dragleave', (e) => this._handleDragLeave(e));
            label.addEventListener('drop', (e) => this._handleDrop(e, node));

            li.appendChild(label);

            if (node.type === 'folder') {
                const subTree = this._buildTree(nodes, node.id);
                li.appendChild(subTree);
            }

            ul.appendChild(li);
        });

        return ul;
    }

    startCreation(type, parentId = null) {
        let targetList;
        if (parentId) {
            this.expandedFolders.add(parentId);
            this.render(this.nodes);

            const parentLi = this.container.querySelector(`li[data-id="${parentId}"]`);
            if (parentLi) {
                targetList = parentLi.querySelector('ul.tree-list');
                if (!targetList) {
                    targetList = document.createElement('ul');
                    targetList.className = 'tree-list';
                    parentLi.appendChild(targetList);
                    parentLi.classList.add('expanded');
                }
            }
        } else {
            targetList = this.container.querySelector(':scope > ul.tree-list');
            if (!targetList) {
                this.container.innerHTML = '';
                targetList = document.createElement('ul');
                targetList.className = 'tree-list';
                this.container.appendChild(targetList);
            }
        }

        if (!targetList) return;

        const li = document.createElement('li');
        li.className = 'tree-node input-mode';

        const div = document.createElement('div');
        div.className = 'tree-label tree-input-label';

        div.style.paddingLeft = parentId ? '0px' : '1px';

        const icon = document.createElement('span');
        icon.className = `material-symbols-outlined tree-icon${type === 'folder' ? ' tree-icon-folder' : ''}`;
        icon.textContent = type === 'folder' ? 'folder' : 'description';
        icon.style.color = type === 'folder' ? 'var(--text-secondary)' : 'var(--accent)';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tree-input';
        input.placeholder = 'Nome...';

        div.appendChild(icon);
        div.appendChild(input);
        li.appendChild(div);

        if (targetList.firstChild) {
            targetList.insertBefore(li, targetList.firstChild);
        } else {
            targetList.appendChild(li);
        }

        input.focus();

        const commit = () => {
            const name = input.value.trim();
            if (name) {
                this.onNodeCreate(name, type, parentId);
            } else {
                li.remove();
            }
        };

        const cancel = () => {
            li.remove();
        };

        input.addEventListener('blur', () => {
            commit();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            } else if (e.key === 'Escape') {
                cancel();
            }
        });
    }

    startRenaming(nodeId = null) {
        const idToRename = nodeId || this.activeNodeId;
        if (!idToRename) return;

        const node = this.nodes.find(n => n.id === idToRename);
        if (!node) return;

        const li = this.container.querySelector(`li[data-id="${node.id}"]`);
        if (!li) return;

        const labelElement = li.querySelector('.tree-label');
        const textElement = li.querySelector('.tree-text');

        if (!labelElement || !textElement) return;
        if (labelElement.querySelector('input')) return;

        textElement.style.display = 'none';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tree-input';
        input.value = node.name;
        input.style.width = 'calc(100% - 30px)';

        labelElement.appendChild(input);

        input.focus();
        input.select();

        const commit = () => {
            const newName = input.value.trim();
            if (newName && newName !== node.name) {
                this.onNodeRename(node.id, newName);
            } else {
                cancel();
            }
        };

        const cancel = () => {
            input.remove();
            textElement.style.display = '';
        };

        input.addEventListener('blur', () => {
            commit();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            } else if (e.key === 'Escape') {
                cancel();
                e.stopPropagation();
            }
        });

        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('dblclick', (e) => e.stopPropagation());
    }

    _handleDragStart(e, node) {
        e.dataTransfer.setData('application/json', JSON.stringify({
            nodeId: node.id,
            nodeType: node.type,
            nodeName: node.name
        }));
        e.dataTransfer.effectAllowed = 'move';
    }

    _handleDragOver(e, targetNode) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        const element = e.currentTarget;
        const rect = element.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const height = rect.height;

        element.classList.remove('drop-top', 'drop-bottom', 'drop-inside');

        if (targetNode.type === 'separator') {
            if (offsetY < height / 2) {
                element.classList.add('drop-top');
            } else {
                element.classList.add('drop-bottom');
            }
            return;
        }

        if (targetNode.type === 'folder') {
            if (offsetY < height * 0.25) {
                element.classList.add('drop-top');
            } else if (offsetY > height * 0.75) {
                element.classList.add('drop-bottom');
            } else {
                element.classList.add('drop-inside');
            }
        } else {
            if (offsetY < height * 0.5) {
                element.classList.add('drop-top');
            } else {
                element.classList.add('drop-bottom');
            }
        }
    }

    _handleDragLeave(e) {
        const element = e.currentTarget;
        element.classList.remove('drop-top', 'drop-bottom', 'drop-inside');
    }

    _handleDrop(e, targetNode) {
        e.preventDefault();
        e.stopPropagation();
        const element = e.currentTarget;

        let position = 'inside';
        if (element.classList.contains('drop-top')) position = 'before';
        if (element.classList.contains('drop-bottom')) position = 'after';

        element.classList.remove('drop-top', 'drop-bottom', 'drop-inside');

        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        const { nodeId } = JSON.parse(data);
        if (nodeId === targetNode.id) return;

        if (position === 'inside' && targetNode.type === 'file') {
            position = 'after';
        }

        this.onNodeReorder(nodeId, targetNode.id, position);
    }

    _handleNodeClick(node, event) {
        event.stopPropagation();

        if (node.type === 'folder') {
            if (this.expandedFolders.has(node.id)) {
                this.expandedFolders.delete(node.id);
            } else {
                this.expandedFolders.add(node.id);
            }
            this.render(this.nodes);
        }

        this.activeNodeId = node.id;
        this.onFileSelect(node);
        this._updateActiveClasses();
    }

    setActiveNode(id) {
        this.activeNodeId = id;
        if (id) {
            this._expandParents(id);
            this.render(this.nodes);
        }
        this._updateActiveClasses();
    }

    _expandParents(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node && node.parent_id) {
            this.expandedFolders.add(node.parent_id);
            this._expandParents(node.parent_id);
        }
    }

    _updateActiveClasses() {
        const allLabels = this.container.querySelectorAll('.tree-label');
        allLabels.forEach(l => l.classList.remove('active'));

        if (this.activeNodeId) {
            const li = this.container.querySelector(`li[data-id="${this.activeNodeId}"]`);
            if (li) {
                const label = li.querySelector('.tree-label');
                if (label) {
                    label.classList.add('active');
                    label.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
        }
    }

    _handleContainerDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        this.container.classList.add('drop-target-root');
    }

    _handleContainerDragLeave(e) {
        if (e.relatedTarget && this.container.contains(e.relatedTarget)) {
            return;
        }
        this.container.classList.remove('drop-target-root');
    }

    _handleContainerDrop(e) {
        e.preventDefault();
        this.container.classList.remove('drop-target-root');

        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        const { nodeId } = JSON.parse(data);
        const node = this.nodes.find(n => n.id === nodeId);

        if (!node) return;

        this.onNodeReorder(nodeId, null, 'root-append');
    }

    _handleContainerClick(e) {
        if (e.target === this.container || e.target.classList.contains('tree-list') || e.target.classList.contains('tree-empty')) {
            this.setActiveNode(null);
            this.onFileSelect(null);
        }
    }

    _handleContextMenu(e, node) {
        e.preventDefault();
        e.stopPropagation();

        this.setActiveNode(node.id);
        this.onFileSelect(node);

        if (this.contextMenu) {
            this.contextMenu.show(e.clientX, e.clientY, node);
        }
    }

    _handleSeparatorDblClick(node, event) {
        event.stopPropagation();
        this.onNodeDelete(node.id);
    }

    _handleKeyDown(e) {
        if (e.key === 'Delete') {
            if (e.target.tagName === 'INPUT') return;

            if (this.activeNodeId) {
                const node = this.nodes.find(n => n.id === this.activeNodeId);
                if (node) {
                    this.dialog.show({
                        title: "Excluir Item",
                        message: `Tem certeza que deseja excluir "${node.name}"? Esta ação não pode ser desfeita.`,
                        confirmText: "Excluir",
                        onConfirm: () => this.onNodeDelete(this.activeNodeId)
                    });
                }
            }
        }
    }
}
