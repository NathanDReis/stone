export class ThemeModal {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.element = null;
        this.overlay = null;
    }

    create() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';

        // Create Content Container
        const modal = document.createElement('div');
        modal.className = 'theme-modal';

        // Header
        const header = document.createElement('div');
        header.className = 'theme-modal-header';

        const title = document.createElement('h3');
        title.className = 'theme-modal-title';
        title.textContent = 'Selecionar Tema';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'theme-modal-close';
        closeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
        closeBtn.onclick = () => this.hide();

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Grid
        const grid = document.createElement('div');
        grid.className = 'theme-grid';

        const themes = this.themeManager.getAvailableThemes();
        themes.forEach(theme => {
            const card = this.createThemeCard(theme);
            grid.appendChild(card);
        });

        modal.appendChild(header);
        modal.appendChild(grid);
        this.overlay.appendChild(modal);

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        document.body.appendChild(this.overlay);
        this.element = modal;
    }

    createThemeCard(theme) {
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.title = theme.name;

        if (this.themeManager.currentTheme === theme.id) {
            card.classList.add('active');
        }

        const preview = document.createElement('div');
        preview.className = 'theme-preview';

        const bgMain = theme.variables['--bg-main'];
        const bgSec = theme.variables['--bg-secondary'];
        const accent = theme.variables['--accent'];

        const mainPart = document.createElement('div');
        mainPart.className = 'theme-preview-main';
        mainPart.style.setProperty('--preview-bg', bgMain);

        const secPart = document.createElement('div');
        secPart.className = 'theme-preview-secondary';
        secPart.style.setProperty('--preview-bg-sec', bgSec);

        const accentDot = document.createElement('div');
        accentDot.className = 'theme-preview-accent-dot';
        accentDot.style.setProperty('--preview-accent', accent);

        secPart.appendChild(accentDot);
        preview.appendChild(mainPart);
        preview.appendChild(secPart);

        const name = document.createElement('div');
        name.className = 'theme-card-name';
        name.textContent = theme.name;

        card.appendChild(preview);
        card.appendChild(name);

        card.addEventListener('click', () => {
            this.themeManager.apply(theme.id);
            this.updateActiveState();
        });

        return card;
    }

    updateActiveState() {
        if (!this.element) return;
        const cards = this.element.querySelectorAll('.theme-card');
        const themes = this.themeManager.getAvailableThemes();

        cards.forEach((card, index) => {
            const theme = themes[index];
            if (theme.id === this.themeManager.currentTheme) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    show() {
        if (!this.overlay) {
            this.create();
        }
        requestAnimationFrame(() => {
            this.overlay.classList.add('active');
            this.updateActiveState();
        });
    }

    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    }
}
