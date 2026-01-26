export class ThemeManager {
    constructor() {
        this.themes = new Map();
        this.currentTheme = null;
        this.styleElementId = 'app-theme';
    }

    register(theme) {
        if (!theme.id) {
            console.error('Theme must have an ID');
            return;
        }
        this.themes.set(theme.id, theme);
    }

    getAvailableThemes() {
        return Array.from(this.themes.values());
    }

    apply(themeId) {
        if (!this.themes.has(themeId)) {
            console.warn(`Theme ${themeId} not found`);
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
