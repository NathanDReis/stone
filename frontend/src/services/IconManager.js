import { initialIcons } from '../mock-db/icons.mock.js';
import { Toast } from '../ui/Toast.js';

export class IconManager {
    constructor() {
        this.icons = new Map();
        this.customIcons = new Map();
        this.loadIcons();
        this.toast = new Toast();
    }

    loadIcons() {
        initialIcons.forEach(icon => this.icons.set(icon.id, icon));

        try {
            const stored = localStorage.getItem('custom_icons');
            if (stored) {
                const customs = JSON.parse(stored);
                customs.forEach(icon => {
                    this.customIcons.set(icon.id, icon);
                    this.icons.set(icon.id, icon);
                });
            }
        } catch (e) {
            this.toast.error('Falha ao carregar ícone customizado');
        }
    }

    getIcons() {
        return Array.from(this.icons.values());
    }

    addCustomIcon(name, iconCode) {
        if (!name || !iconCode) {
            throw new Error('Nome e código do ícone são obrigatórios');
        }

        const id = 'custom-icon-' + Date.now();
        const newIcon = { id, name, icon: iconCode };

        this.customIcons.set(id, newIcon);
        this.icons.set(id, newIcon);
        this._persist();

        return newIcon;
    }

    deleteCustomIcon(id) {
        if (this.customIcons.has(id)) {
            this.customIcons.delete(id);
            this.icons.delete(id);
            this._persist();
        }
    }

    isCustom(id) {
        return this.customIcons.has(id);
    }

    _persist() {
        const list = Array.from(this.customIcons.values());
        localStorage.setItem('custom_icons', JSON.stringify(list));
    }
}
