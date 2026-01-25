export class ConfirmDialog {
    constructor() {
        this.overlay = null;
        this.onConfirm = null;
        this.onCancel = null;
    }

    show({ title, message, confirmText = "Excluir", cancelText = "Cancelar", onConfirm }) {
        this.onConfirm = onConfirm;
        this.render(title, message, confirmText, cancelText);

        const confirmBtn = this.overlay.querySelector('.dialog-confirm');
        confirmBtn.focus();
    }

    render(title, message, confirmText, cancelText) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'dialog-overlay';

        this.overlay.innerHTML = `
            <div class="dialog-box">
                <h3 class="dialog-title">${title}</h3>
                <p class="dialog-message">${message}</p>
                <div class="dialog-actions">
                    <button class="dialog-btn dialog-cancel">${cancelText}</button>
                    <button class="dialog-btn dialog-confirm">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        this.overlay.querySelector('.dialog-cancel').onclick = () => this.close();
        this.overlay.querySelector('.dialog-confirm').onclick = () => {
            if (this.onConfirm) this.onConfirm();
            this.close();
        };

        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.close();
        };

        this.handleKeyDown = (e) => {
            if (e.key === 'Escape') this.close();
            if (e.key === 'Enter') {
                if (this.onConfirm) this.onConfirm();
                this.close();
            }
        };
        window.addEventListener('keydown', this.handleKeyDown);
    }

    close() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        window.removeEventListener('keydown', this.handleKeyDown);
        this.onConfirm = null;
    }
}
