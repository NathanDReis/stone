import { Toast } from "./Toast.js";

export class FolderSettingsModal {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.overlay = null;
        this.currentNodeId = null;
    }

    show(nodeId) {
        this.currentNodeId = nodeId;
        const node = this.fileSystem.getNode(nodeId);
        const profiles = this.fileSystem.getProfiles();

        if (!node) {
            Toast.error("Pasta não encontrada");
            return;
        }

        this.render(node, profiles);
    }

    render(node, profiles) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'dialog-overlay doc-settings-overlay';

        const permissions = node.permissions || profiles.map(p => ({
            profileId: p.id,
            view: true,
            edit: false,
            delete: false
        }));

        this.overlay.innerHTML = `
            <div class="dialog-box doc-settings-box">
                <div class="doc-settings-header">
                    <h3 class="dialog-title">Permissões da Pasta: ${node.name}</h3>
                    <button class="doc-settings-close fab fab-mini">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="doc-settings-content">
                    <div class="settings-group">
                        <label>Permissões por Perfil</label>
                        <div class="permissions-grid">
                            <div class="permissions-row header">
                                <div class="perm-profile">Perfil</div>
                                <div class="perm-check">View</div>
                                <div class="perm-check">Edit</div>
                                <div class="perm-check">Delete</div>
                            </div>
                            ${profiles.map(profile => {
            const perm = permissions.find(p => p.profileId === profile.id) || { view: false, edit: false, delete: false };
            return `
                                    <div class="permissions-row" data-profile-id="${profile.id}">
                                        <div class="perm-profile">${profile.name}</div>
                                        <div class="perm-check">
                                            <input type="checkbox" class="perm-view" ${perm.view ? 'checked' : ''}>
                                        </div>
                                        <div class="perm-check">
                                            <input type="checkbox" class="perm-edit" ${perm.edit ? 'checked' : ''}>
                                        </div>
                                        <div class="perm-check">
                                            <input type="checkbox" class="perm-delete" ${perm.delete ? 'checked' : ''}>
                                        </div>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                </div>

                <div class="dialog-actions">
                    <button class="dialog-btn doc-settings-cancel">Cancelar</button>
                    <button class="dialog-btn dialog-confirm doc-settings-save">Salvar Permissões</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        this.overlay.querySelector('.doc-settings-close').onclick = () => this.close();
        this.overlay.querySelector('.doc-settings-cancel').onclick = () => this.close();
        this.overlay.querySelector('.doc-settings-save').onclick = () => this.handleSave();

        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.close();
        };

        this.handleKeyDown = (e) => {
            if (e.key === 'Escape') this.close();
        };
        window.addEventListener('keydown', this.handleKeyDown);
    }

    handleSave() {
        const permissions = [];

        this.overlay.querySelectorAll('.permissions-row[data-profile-id]').forEach(row => {
            permissions.push({
                profileId: row.dataset.profileId,
                view: row.querySelector('.perm-view').checked,
                edit: row.querySelector('.perm-edit').checked,
                delete: row.querySelector('.perm-delete').checked
            });
        });

        try {
            this.fileSystem.updateNodePermissions(this.currentNodeId, permissions);
            Toast.success("Permissões da pasta salvas com sucesso");
            this.close();
        } catch (e) {
            Toast.error("Erro ao salvar permissões");
            console.error(e);
        }
    }

    close() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}
