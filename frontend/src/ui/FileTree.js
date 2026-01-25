export class FileTree {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.onFileSelect = options.onFileSelect || (() => { });
        this.onNodeCreate = options.onNodeCreate || (() => { });
        this.onNodeMove = options.onNodeMove || (() => { });

        this.expandedFolders = new Set();
        this.nodes = [];
        this.activeNodeId = null;

        this.init();
    }

    init() {
        this.container.classList.add('tree-container');
        this.container.innerHTML = '<div class="tree-empty">Carregando...</div>';

        // Container Drop (Move to Root)
        this.container.addEventListener('dragover', (e) => this._handleContainerDragOver(e));
        this.container.addEventListener('dragleave', (e) => this._handleContainerDragLeave(e));
        this.container.addEventListener('drop', (e) => this._handleContainerDrop(e));
    }

    render(nodes) {
        this.nodes = nodes;
        this.container.innerHTML = '';

        // Auto-expand root folder or just show root level
        const tree = this._buildTree(nodes, null);
        this.container.appendChild(tree);
    }

    _buildTree(nodes, parentId) {
        // Find children for this parentId
        const children = nodes.filter(n => n.parent_id === parentId);

        // Sort: Folders first, then Files. Alphabetical.
        children.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
        });

        const ul = document.createElement('ul');
        ul.className = 'tree-list';

        children.forEach(node => {
            const li = document.createElement('li');
            li.className = 'tree-node';
            li.dataset.id = node.id;
            li.dataset.type = node.type;

            if (node.type === 'folder' && this.expandedFolders.has(node.id)) {
                li.classList.add('expanded');
            }

            const label = document.createElement('div');
            label.className = 'tree-label';
            label.draggable = true; // Enable Drag

            if (this.activeNodeId === node.id) {
                label.classList.add('active');
            }

            // Arrow for folders
            const arrow = document.createElement('span');
            arrow.className = 'material-symbols-outlined tree-arrow';
            arrow.textContent = 'chevron_right';
            arrow.style.opacity = node.type === 'folder' ? '1' : '0';

            // Icon
            const icon = document.createElement('span');
            icon.className = 'material-symbols-outlined tree-icon';
            icon.textContent = node.type === 'folder' ? 'folder' : 'article';
            // Styling differentiation
            if (node.type === 'folder') icon.style.color = 'var(--text-secondary)';
            if (node.type === 'file') icon.style.color = 'var(--accent)';

            // Name
            const text = document.createElement('span');
            text.textContent = node.name;
            text.className = 'tree-text';

            label.appendChild(arrow);
            label.appendChild(icon);
            label.appendChild(text);

            // Event Listeners
            label.onclick = (e) => this._handleNodeClick(node, e);

            // Drag & Drop Handlers
            label.addEventListener('dragstart', (e) => this._handleDragStart(e, node));
            label.addEventListener('dragover', (e) => this._handleDragOver(e, node));
            label.addEventListener('dragleave', (e) => this._handleDragLeave(e));
            label.addEventListener('drop', (e) => this._handleDrop(e, node));

            li.appendChild(label);

            if (node.type === 'folder') {
                const subTree = this._buildTree(nodes, node.id);
                // Also allow dropping onto the folder item container/subtree area? 
                // Usually dropping on the label is enough.
                li.appendChild(subTree);
            }

            ul.appendChild(li);
        });

        // Allow dropping into empty space (Root)?
        if (!parentId && nodes.length > 0) {
            // Root container listener setup elsewhere or implied by "drop on root items" logic?
            // VS Code allows dropping on empty space to move to root.
            // We can add a generic listener on the container, but let's stick to node-to-node for now.
        }

        return ul;
    }

    startCreation(type, parentId = null) {
        // 1. Where to insert?
        // If parentId provided, inside that LI's UL. 
        // If parentId is null, at root UL.
        // We need to find the UL element corresponding to that parent.

        let targetList;
        if (parentId) {
            // Ensure parent is expanded
            this.expandedFolders.add(parentId);

            // Re-render to show children container if it wasn't there
            this.render(this.nodes);

            const parentLi = this.container.querySelector(`li[data-id="${parentId}"]`);
            if (parentLi) {
                targetList = parentLi.querySelector('ul.tree-list');
                // If folder had no children, it might not have a UL yet?
                // Our _buildTree renders empty UL? No, recursion stops.
                if (!targetList) {
                    targetList = document.createElement('ul');
                    targetList.className = 'tree-list';
                    parentLi.appendChild(targetList);
                    parentLi.classList.add('expanded'); // Should be handled by re-render above, but safety
                }
            }
        } else {
            targetList = this.container.querySelector(':scope > ul.tree-list');
            if (!targetList) { // Empty tree case
                this.container.innerHTML = '';
                targetList = document.createElement('ul');
                targetList.className = 'tree-list';
                this.container.appendChild(targetList);
            }
        }

        if (!targetList) return;

        // 2. Create Input Element
        const li = document.createElement('li');
        li.className = 'tree-node input-mode';

        const div = document.createElement('div');
        div.className = 'tree-label tree-input-label';

        // Spacing/Indentation
        div.style.paddingLeft = parentId ? '0px' : '1px'; // Visual adjustment

        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined tree-icon';
        icon.textContent = type === 'folder' ? 'folder' : 'article';
        icon.style.color = type === 'folder' ? 'var(--text-secondary)' : 'var(--accent)';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tree-input';
        input.placeholder = 'Nome...';

        div.appendChild(icon);
        div.appendChild(input);
        li.appendChild(div);

        // Insert at TOP of list
        if (targetList.firstChild) {
            targetList.insertBefore(li, targetList.firstChild);
        } else {
            targetList.appendChild(li);
        }

        // 3. Focus and Listeners
        input.focus();

        const commit = () => {
            const name = input.value.trim();
            if (name) {
                this.onNodeCreate(name, type, parentId);
            } else {
                // Cancelled
                li.remove();
            }
        };

        const cancel = () => {
            li.remove();
        };

        input.addEventListener('blur', () => {
            // Delay to allow check if we didn't just hit enter
            // Actually, VS Code cancels on blur if empty, commits if valid?
            // Let's simpler: commit on blur.
            commit();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Triggers commit
            } else if (e.key === 'Escape') {
                cancel();
            }
        });
    }

    _handleDragStart(e, node) {
        e.dataTransfer.setData('application/json', JSON.stringify({ nodeId: node.id }));
        e.dataTransfer.effectAllowed = 'move';
        // e.target.style.opacity = '0.5';
    }

    _handleDragOver(e, targetNode) {
        e.preventDefault(); // Allow drop
        e.dataTransfer.dropEffect = 'move';

        const label = e.currentTarget;

        // Logic: 
        // If target is folder: Highlight whole label (move INTO)
        // If target is file: Highlight whole label (move INTO parent - effectively sibling)
        // VS Code style highlights the folder background.

        label.classList.add('drop-target');
    }

    _handleDragLeave(e) {
        const label = e.currentTarget;
        label.classList.remove('drop-target');
    }

    _handleDrop(e, targetNode) {
        e.preventDefault();
        e.stopPropagation(); // Stop bubbling to container
        const label = e.currentTarget;
        label.classList.remove('drop-target');

        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        const { nodeId } = JSON.parse(data);
        if (nodeId === targetNode.id) return; // Drop on self

        let newParentId;

        if (targetNode.type === 'folder') {
            // Drop ON folder -> Move into folder
            newParentId = targetNode.id;
        } else {
            // Drop ON file -> Move to same folder as file (sibling)
            newParentId = targetNode.parent_id;
        }

        this.onNodeMove(nodeId, newParentId);
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
        } else {
            this.activeNodeId = node.id;
            this.render(this.nodes);
            this.onFileSelect(node);
        }
    }

    setActiveNode(id) {
        this.activeNodeId = id;
        this.render(this.nodes);
    }

    // --- Container Handlers (Root) ---

    _handleContainerDragOver(e) {
        e.preventDefault();
        // Visual feedback for root drop (whole container)
        // We might want to check if we are NOT over a tree-label (though stopPropagation handles that)
        e.dataTransfer.dropEffect = 'move';
        this.container.classList.add('drop-target-root');
    }

    _handleContainerDragLeave(e) {
        // We need to be careful not to flicker when entering a child.
        // But since children stopPropagation on their own events, usually safe.
        // However, dragleave fires when entering a child element.
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
        if (node.parent_id === null) return; // Already at root

        this.onNodeMove(nodeId, null);
    }
}
