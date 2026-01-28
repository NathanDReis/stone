import { Toast } from "../../ui/Toast";

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
                <!-- Seção de Nó -->
                <div class="mermaid-node-only">
                    <div class="mermaid-form-group">
                        <label>Texto (Label)</label>
                        <input type="text" class="mermaid-label-input" placeholder="Novo nome...">
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
                        <label>Cor do Nó</label>
                        <div class="mermaid-color-picker-row">
                            <input type="color" class="mermaid-node-color-pick" title="Escolher cor do nó">
                            <button class="mermaid-btn-reset-node-color" title="Remover cor do nó">×</button>
                        </div>
                    </div>

                    <div class="mermaid-form-group">
                        <label>Nova conexão</label>

                        <input type="text" list="mermaid-nodes-list" class="mermaid-node-input" placeholder="Novo nó..." title="Selecione ou digite um novo nome">
                        <div class="mermaid-add-connection-row">
                            <datalist id="mermaid-nodes-list"></datalist>
                            <input type="text" class="mermaid-edge-label-new" placeholder="Texto (opcional)" title="Texto da linha">
                            
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

                <!-- Seção de Aresta (Linha) -->
                <div class="mermaid-edge-only">
                    <div class="mermaid-form-group">
                        <label>Texto da Linha</label>
                        <input type="text" class="mermaid-edge-label-input-solo" placeholder="Texto da linha...">
                    </div>
                    <div class="mermaid-form-group">
                        <label>Tipo de Seta</label>
                        <div class="mermaid-edge-type-selector-solo">
                            <button class="mermaid-type-btn" data-type="-->" title="Seta Padrão">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m13 18 6-6-6-6"></path></svg>
                            </button>
                            <button class="mermaid-type-btn" data-type="-.->" title="Seta Pontilhada">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 4"><path d="M5 12h14"></path><path d="m13 18 6-6-6-6"></path></svg>
                            </button>
                            <button class="mermaid-type-btn" data-type="==>" title="Seta Grossa">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m13 18 6-6-6-6"></path></svg>
                            </button>
                            <button class="mermaid-type-btn" data-type="---" title="Linha Simples">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path></svg>
                            </button>
                        </div>
                    </div>
                    <div class="mermaid-form-group">
                        <label>Ações</label>
                        <div class="mermaid-edge-actions">
                            <button class="mermaid-btn-swap-solo" title="Inverter Direção">
                                <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="M280-160 80-360l200-200 56 57-103 103h607v80H233l103 103-56 57Zm400-240-56-57 103-103H120v-80h607L624-743l56-57 200 200-200 200Z"/></svg>
                                <span>Inverter</span>
                            </button>
                            <button class="mermaid-btn-clear-text-solo" title="Remover Texto">
                                <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360ZM480-480Z"/></svg>
                                <span>Limpar</span>
                            </button>
                            <button class="mermaid-btn-delete-solo" title="Excluir Conexão">
                                <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="M200-440v-80h560v80H200Z"/></svg>
                                <span>Excluir</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Seção Global -->
                <div class="mermaid-global-only">
                    <div class="mermaid-form-group">
                        <label>Layout (Orientação)</label>
                        <select class="mermaid-layout-select">
                            <option value="TD">Vertical (TD)</option>
                            <option value="LR">Horizontal (LR)</option>
                            <option value="BT">Invertido (BT)</option>
                            <option value="RL">Direita-Esquerda (RL)</option>
                        </select>
                    </div>

                    <div class="mermaid-form-group">
                        <label>Cor de Fundo (Bloco)</label>
                        <div class="mermaid-color-picker-row">
                            <input type="color" class="mermaid-bg-color-pick" title="Escolher cor">
                            <button class="mermaid-btn-reset-color" title="Remover cor">×</button>
                        </div>
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

    show(x, y, nodeData, allNodes, edges, callbacks, currentOrientation, currentBg, mode = 'node') {
        this.create();
        this.currentNode = nodeData;
        this.callbacks = callbacks;
        this.allNodes = allNodes;
        this.edges = edges;
        this.mode = mode;

        this.element.setAttribute('data-mode', mode);

        let title = 'Editar Nó';
        if (mode === 'global') title = 'Configurações do Diagrama';
        if (mode === 'edge') title = 'Editar Linha';

        this.element.querySelector('.mermaid-editor-title').innerText = title;

        const rect = this.element.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 20;
        if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 20;

        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.classList.add('is-visible');

        this.pendingResetNodeColor = false;
        this.pendingResetBgColor = false;
        this.pendingDelete = false;
        this.pendingInvert = false;
        this.bgChanged = false;
        this.nodeColorChanged = false;

        if (mode === 'node') {
            const input = this.element.querySelector('.mermaid-label-input');
            input.value = nodeData.label || nodeData.id;
            input.focus();

            const shapeSelect = this.element.querySelector('.mermaid-shape-select');
            let shape = nodeData.shape || 'rect';
            if (shape === '[]') shape = 'rect';
            if (shape === '()') shape = 'rounded';
            if (shape === '{}') shape = 'diamond';
            if (shape === '(())') shape = 'circle';
            shapeSelect.value = shape;

            const nodeColorInput = this.element.querySelector('.mermaid-node-color-pick');
            nodeColorInput.value = nodeData.color || '#2b2d31';

            nodeColorInput.oninput = () => {
                this.nodeColorChanged = true;
            };

            this.element.querySelector('.mermaid-btn-reset-node-color').onclick = () => {
                this.pendingResetNodeColor = true;
                nodeColorInput.value = '#2b2d31';
                Toast.info("Cor do nó alterada (clique em Salvar para aplicar)");
            };

            this.renderNodeSelect();

            this.element.querySelector('.mermaid-node-input').value = '';
            this.element.querySelector('.mermaid-edge-label-new').value = '';
            this.element.querySelector('.mermaid-edge-type-new').value = '-->';

        } else if (mode === 'edge') {
            const edgeData = nodeData;
            this.currentEdge = edgeData;

            const labelInput = this.element.querySelector('.mermaid-edge-label-input-solo');
            labelInput.value = edgeData.label || '';
            labelInput.focus();

            labelInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    this.onSave();
                }
            };

            this.selectedEdgeType = edgeData.type || '-->';
            const typeBtns = this.element.querySelectorAll('.mermaid-type-btn');

            const updateVisualType = (type) => {
                this.selectedEdgeType = type;
                typeBtns.forEach(btn => {
                    btn.classList.toggle('is-selected', btn.getAttribute('data-type') === type);
                });
            };

            updateVisualType(this.selectedEdgeType);

            typeBtns.forEach(btn => {
                btn.onclick = () => {
                    updateVisualType(btn.getAttribute('data-type'));
                    Toast.info(`Tipo de linha alterado para "${btn.getAttribute('title')}"`);
                };
            });

            const btnSwap = this.element.querySelector('.mermaid-btn-swap-solo');
            const btnDelete = this.element.querySelector('.mermaid-btn-delete-solo');

            btnSwap.classList.remove('is-active');
            btnDelete.classList.remove('is-active');

            btnSwap.onclick = () => {
                this.pendingInvert = !this.pendingInvert;
                btnSwap.classList.toggle('is-active', this.pendingInvert);
                Toast.info(this.pendingInvert ? "Inversão marcada" : "Inversão cancelada");
            };

            this.element.querySelector('.mermaid-btn-clear-text-solo').onclick = () => {
                labelInput.value = "";
                Toast.info("Texto removido");
            };

            btnDelete.onclick = () => {
                this.pendingDelete = !this.pendingDelete;
                btnDelete.classList.toggle('is-active', this.pendingDelete);
                Toast.info(this.pendingDelete ? "Exclusão marcada" : "Exclusão cancelada");
            };
        } else {
            const bgColorInput = this.element.querySelector('.mermaid-bg-color-pick');
            bgColorInput.value = currentBg || '#2b2d31';

            bgColorInput.oninput = () => {
                this.bgChanged = true;
            };

            this.element.querySelector('.mermaid-btn-reset-color').onclick = () => {
                this.pendingResetBgColor = true;
                bgColorInput.value = '#2b2d31';
                Toast.info("Cor de fundo resetada (clique em Salvar para aplicar)");
            };

            const layoutSelect = this.element.querySelector('.mermaid-layout-select');
            layoutSelect.value = currentOrientation || 'TD';
        }

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
        if (this.mode === 'global') {
            const bgColorInput = this.element.querySelector('.mermaid-bg-color-pick');
            const layoutSelect = this.element.querySelector('.mermaid-layout-select');

            if (this.pendingResetBgColor) {
                this.callbacks.onUpdateBackground(null);
            } else if (this.bgChanged) {
                this.callbacks.onUpdateBackground(bgColorInput.value);
            }

            this.callbacks.onUpdateOrientation(layoutSelect.value);
            this.hide();
            return;
        }

        if (this.mode === 'edge') {
            if (this.pendingDelete) {
                this.callbacks.onRemoveConnection(this.currentEdge.from, this.currentEdge.to);
                this.hide();
                return;
            }

            if (this.pendingInvert) {
                this.callbacks.onInvertEdge(this.currentEdge.from, this.currentEdge.to);
                this.hide();
                return;
            }

            const labelInput = this.element.querySelector('.mermaid-edge-label-input-solo');
            const newType = this.selectedEdgeType || '-->';

            this.callbacks.onUpdateEdge(this.currentEdge.from, this.currentEdge.to, {
                type: newType,
                text: labelInput.value.trim()
            });
            this.hide();
            return;
        }

        const labelInput = this.element.querySelector('.mermaid-label-input');
        const shapeSelect = this.element.querySelector('.mermaid-shape-select');
        const nodeColorInput = this.element.querySelector('.mermaid-node-color-pick');

        const label = labelInput.value.trim();
        const shape = shapeSelect.value;

        if (!label) {
            return Toast.warning("O nome do nó não pode ser vazio");
        }

        const nodeUpdateData = { label, shape };

        if (this.pendingResetNodeColor) {
            nodeUpdateData.color = null;
        } else if (this.nodeColorChanged) {
            nodeUpdateData.color = nodeColorInput.value;
        }

        this.callbacks.onUpdateNode(this.currentNode.id, nodeUpdateData);

        const connInput = this.element.querySelector('.mermaid-node-input');
        const connLabelInput = this.element.querySelector('.mermaid-edge-label-new');
        const connTypeSelect = this.element.querySelector('.mermaid-edge-type-new');

        const targetId = connInput.value.trim();
        if (targetId) {
            this.callbacks.onAddConnection(this.currentNode.id, targetId, connTypeSelect.value, connLabelInput.value.trim());
        }

        this.hide();
    }

    onAddConnection() {
        const targetId = this.element.querySelector('.mermaid-node-input').value.trim();
        if (!targetId) return;
        Toast.info(`Conexão com "${targetId}" será adicionada ao salvar`);
    }
}
