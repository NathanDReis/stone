export class Toast {
    static container = null;

    static init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    static show(message, type = 'info', duration = 3000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconMap = {
            info: 'info',
            success: 'check_circle',
            warning: 'warning',
            error: 'error'
        };

        toast.innerHTML = `
            <span class="material-symbols-outlined toast-icon">${iconMap[type] || 'info'}</span>
            <span class="toast-message">${message}</span>
        `;

        this.container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, duration);
    }

    static info(message, duration) {
        this.show(message, 'info', duration);
    }

    static success(message, duration) {
        this.show(message, 'success', duration);
    }

    static warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    static error(message, duration = 4000) {
        this.show(message, 'error', duration);
    }
}
