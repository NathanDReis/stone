export class MermaidEditorUI {
    constructor() {
        this.element = null;
        this._onClickOutside = this._onClickOutside.bind(this);
    }

    create() {
        if (this.element) return this.element;

        this.element = document.createElement('div');
        this.element.className = 'mermaid-editor-popover';
        this.element.innerHTML = `
            <div class="mermaid-editor-header">
                <span class="mermaid-editor-title">Editar Nó</span>
                <button class="mermaid-editor-close">×</button>
            </div>
            <div class="mermaid-editor-body">
                <div class="mermaid-form-group">
                    <label>Texto (Label)</label>
                    <input type="text" class="mermaid-label-input" placeholder="Novo nome...">
                </div>

                <div class="mermaid-form-group">
                    <label>Layout</label>
                    <select class="mermaid-layout-select">
                        <option value="TD">Vertical (TD)</option>
                        <option value="LR">Horizontal (LR)</option>
                    </select>
                </div>

                <div class="mermaid-form-group">
                    <label>Formato</label>
                    <select class="mermaid-shape-select">
                        <option value="rect">Retângulo [ ]</option>
                        <option value="rounded">Arredondado ( )</option>
                        <option value="diamond">Losango { }</option>
                        <option value="circle">Círculo (( ))</option>
                    </select>
                </div>
                
                <div class="mermaid-form-group">
                    <label>Conexões (Saída)</label>
                    <div class="mermaid-connections-list"></div>
                </div>

                <div class="mermaid-form-group">
                    <div class="mermaid-add-connection">
                    <input type="text" list="mermaid-nodes-list" class="mermaid-node-input" placeholder="Novo nó..." title="Selecione ou digite um novo nome">
                    <datalist id="mermaid-nodes-list"></datalist>
                    <select class="mermaid-edge-type-new" title="Tipo de Seta">
                        <option value="-->">→</option>
                            <option value="-.->">⇢</option>
                            <option value="==>">⇒</option>
                            <option value="---">─</option>
                        </select>
                        <button class="mermaid-btn-add">+</button>
                    </div>
                </div>
            </div>
            <div class="mermaid-editor-footer">
                <button class="mermaid-btn-save">Salvar</button>
            </div>
        `;

        document.body.appendChild(this.element);

        this.element.querySelector('.mermaid-editor-close').onclick = () => this.hide();
        this.element.querySelector('.mermaid-btn-save').onclick = () => this.onSave();
        this.element.querySelector('.mermaid-btn-add').onclick = () => this.onAddConnection();

        return this.element;
    }

    show(x, y, nodeData, allNodes, edges, callbacks, currentOrientation) {
        this.create();
        this.currentNode = nodeData;
        this.callbacks = callbacks;
        this.allNodes = allNodes;
        this.edges = edges;

        const rect = this.element.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 20;
        if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 20;

        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.classList.add('is-visible');

        const input = this.element.querySelector('.mermaid-label-input');
        input.value = nodeData.label || nodeData.id;
        input.focus();

        const shapeSelect = this.element.querySelector('.mermaid-shape-select');
        let shape = nodeData.shape || 'rect';
        if (shape === '[]') shape = 'rect';
        if (shape === '()') shape = 'rounded';
        if (shape === '{}') shape = 'diamond';
        if (shape === '(())') shape = 'circle';
        if (shape === '(())') shape = 'circle';
        shapeSelect.value = shape;

        const layoutSelect = this.element.querySelector('.mermaid-layout-select');
        layoutSelect.value = currentOrientation || 'TD';

        layoutSelect.onchange = (e) => {
            this.callbacks.onUpdateOrientation(e.target.value);
            this.hide();
        };

        this.renderConnections();
        this.renderNodeSelect();

        setTimeout(() => {
            document.addEventListener('click', this._onClickOutside);
        }, 0);
    }

    hide() {
        if (this.element) {
            this.element.classList.remove('is-visible');
            document.removeEventListener('click', this._onClickOutside);
        }
    }

    _onClickOutside(e) {
        if (this.element && !this.element.contains(e.target)) {
            this.hide();
        }
    }

    renderConnections() {
        const list = this.element.querySelector('.mermaid-connections-list');
        list.innerHTML = '';

        const myEdges = this.edges.filter(e => e.from === this.currentNode.id);

        if (myEdges.length === 0) {
            list.innerHTML = '<div class="mermaid-empty">Sem conexões</div>';
            return;
        }

        myEdges.forEach(edge => {
            const item = document.createElement('div');
            item.className = 'mermaid-connection-item';

            const targetNode = this.allNodes.find(n => n.id === edge.to);
            const targetLabel = targetNode ? (targetNode.label || targetNode.id) : edge.to;

            item.innerHTML = `
                <div class="api-controls">
                    <select class="mermaid-edge-select-type" title="Mudar tipo">
                        <option value="-->">→</option>
                        <option value="-.->">⇢</option>
                        <option value="==>">⇒</option>
                        <option value="---">─</option>
                    </select>
                    <button class="mermaid-btn-swap" title="Inverter Direção">⇄</button>
                </div>
                <span class="target-name">${targetLabel}</span>
                <button class="mermaid-btn-delete" title="Remover">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/></svg>
                </button>
            `;

            item.querySelector('.mermaid-edge-select-type').value = edge.type || '-->';

            item.querySelector('.mermaid-edge-select-type').onchange = (e) => {
                this.callbacks.onUpdateEdgeType(this.currentNode.id, edge.to, e.target.value);
                this.hide();
            };

            item.querySelector('.mermaid-btn-swap').onclick = () => {
                this.callbacks.onInvertEdge(this.currentNode.id, edge.to);
                this.hide();
            };

            item.querySelector('.mermaid-btn-delete').onclick = () => {
                this.edges = this.edges.filter(e => !(e.from === this.currentNode.id && e.to === edge.to));
                this.renderConnections();
                this.callbacks.onRemoveConnection(this.currentNode.id, edge.to);
                this.hide();
            };

            list.appendChild(item);
        });
    }

    renderNodeSelect() {
        const dataList = this.element.querySelector('#mermaid-nodes-list');
        dataList.innerHTML = '';

        this.allNodes.forEach(node => {
            if (node.id === this.currentNode.id) return;
            const option = document.createElement('option');
            option.value = node.id;
            if (node.label && node.label !== node.id) {
                option.label = node.label;
            }
            dataList.appendChild(option);
        });
    }

    onSave() {
        const newVal = this.element.querySelector('.mermaid-label-input').value;
        const newShape = this.element.querySelector('.mermaid-shape-select').value;

        this.callbacks.onUpdateNode(this.currentNode.id, newVal, newShape);
        this.hide();
    }

    onAddConnection() {
        const input = this.element.querySelector('.mermaid-node-input');
        const typeSelect = this.element.querySelector('.mermaid-edge-type-new');

        const targetId = input.value.trim();
        if (!targetId) return;

        this.callbacks.onAddConnection(this.currentNode.id, targetId, typeSelect.value);
        this.hide();
    }
}
