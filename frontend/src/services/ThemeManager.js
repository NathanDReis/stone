import { Toast } from "../ui/Toast";

export class ThemeManager {
    constructor() {
        this.themes = new Map();
        this.customThemes = new Map();
        this.styleElementId = 'app-theme';
        this.loadCustomThemes();
    }

    loadCustomThemes() {
        try {
            const stored = localStorage.getItem('custom_themes');
            if (stored) {
                const themes = JSON.parse(stored);
                themes.forEach(theme => {
                    this.customThemes.set(theme.id, theme);
                    this.register(theme);
                });
            }
        } catch (e) {
            Toast.error("Falha ao carregar temas personalizados");
        }
    }

    saveCustomTheme(theme) {
        if (!theme.id) return;
        this.customThemes.set(theme.id, theme);
        this.register(theme);
        this._persistCustomThemes();
        this.apply(theme.id);
    }

    deleteCustomTheme(themeId) {
        if (this.customThemes.has(themeId)) {
            this.customThemes.delete(themeId);
            this.themes.delete(themeId);
            this._persistCustomThemes();

            if (this.currentTheme === themeId) {
                this.apply('light');
            }
        }
    }

    _persistCustomThemes() {
        const themesList = Array.from(this.customThemes.values());
        localStorage.setItem('custom_themes', JSON.stringify(themesList));
    }

    isCustom(themeId) {
        return this.customThemes.has(themeId);
    }

    register(theme) {
        if (!theme.id) {
            return Toast.error("O tema deve ter um ID");
        }
        this.themes.set(theme.id, theme);
    }

    getAvailableThemes() {
        return Array.from(this.themes.values());
    }

    apply(themeId) {
        if (!this.themes.has(themeId)) {
            Toast.warning(`Tema ${themeId} não encontrado`);

            if (themeId !== 'light') {
                this.apply('light');
            }
            return;
        }

        const theme = this.themes.get(themeId);
        this.currentTheme = themeId;
        localStorage.setItem('app-theme', themeId);

        document.documentElement.className = '';
        this._injectStyles(theme);
    }

    _injectStyles(theme) {
        let styleEl = document.getElementById(this.styleElementId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = this.styleElementId;
            document.head.appendChild(styleEl);
        }

        const cssVariables = Object.entries(theme.variables)
            .map(([key, value]) => `  ${key}: ${value};`)
            .join('\n');

        styleEl.textContent = `:root {\n${cssVariables}\n}`;
    }

    loadWait() {
        const savedTheme = localStorage.getItem('app-theme');
        if (savedTheme && this.themes.has(savedTheme)) {
            return savedTheme;
        }
        return 'light';
    }

    next() {
        const themeIds = Array.from(this.themes.keys());
        if (themeIds.length === 0) return;

        const currentIndex = themeIds.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeIds.length;
        const nextThemeId = themeIds[nextIndex];

        this.apply(nextThemeId);
        return nextThemeId;
    }
}
