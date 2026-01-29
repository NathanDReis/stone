import { Toast } from "./Toast.js";

export class DocumentSettingsModal {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.overlay = null;
        this.currentDocId = null;
    }

    show(docId) {
        this.currentDocId = docId;
        const doc = this.fileSystem.getDocument(docId);
        const profiles = this.fileSystem.getProfiles();

        if (!doc) {
            Toast.error("Documento não encontrado");
            return;
        }

        this.render(doc, profiles);
    }

    render(doc, profiles) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'dialog-overlay doc-settings-overlay';

        const permissions = doc.permissions || profiles.map(p => ({
            profileId: p.id,
            view: true,
            edit: false,
            delete: false
        }));

        this.overlay.innerHTML = `
            <div class="dialog-box doc-settings-box">
                <div class="doc-settings-header">
                    <h3 class="dialog-title">Configurações do Documento</h3>
                    <button class="doc-settings-close fab fab-mini">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="doc-settings-content">
                    <div class="settings-group">
                        <label for="doc-observations">Observações</label>
                        <input type="text" id="doc-observations" value="${doc.observations || ''}" placeholder="Observações internas...">
                    </div>

                    <div class="settings-group">
                        <label for="doc-description">Descrição</label>
                        <textarea id="doc-description" rows="3" placeholder="Pequena descrição do documento...">${doc.description || ''}</textarea>
                    </div>

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
                    <button class="dialog-btn dialog-confirm doc-settings-save">Salvar Alterações</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Bind events
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
        const observations = this.overlay.querySelector('#doc-observations').value;
        const description = this.overlay.querySelector('#doc-description').value;
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
            this.fileSystem.updateDocument(this.currentDocId, {
                observations,
                description,
                permissions
            });
            Toast.success("Configurações salvas com sucesso");
            this.close();

            // Re-render ToC to show updated description if open
            const event = new CustomEvent('documentMetadataUpdated', { detail: { docId: this.currentDocId } });
            window.dispatchEvent(event);
        } catch (e) {
            Toast.error("Erro ao salvar configurações");
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
