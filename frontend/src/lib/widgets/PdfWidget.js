import { WidgetType } from "@codemirror/view";
import { PdfViewer } from "../pdf/PdfViewer";

export class PdfWidget extends WidgetType {
    constructor(url, linkText = null, view = null, start = 0, end = 0) {
        super();
        this.url = url;
        this.linkText = linkText;
        this.view = view;
        this.start = start;
        this.end = end;
        this.viewer = new PdfViewer();
        this.currentPage = 1;
        this.scale = 1.0;
        this.container = null;
        this.pagesContainer = null;
        this.pageElements = [];
        this.isScrolling = false;
        this.scrollTimeout = null;
    }

    eq(other) {
        return other.url === this.url;
    }

    toDOM(view) {
        const container = document.createElement("div");
        container.className = "pdf-widget-container";
        this.container = container;

        const controls = document.createElement("div");
        controls.className = "pdf-controls";

        const pageInputWrapper = document.createElement("div");
        pageInputWrapper.className = "pdf-page-input-wrapper";

        const pageInput = document.createElement("input");
        pageInput.type = "number";
        pageInput.min = "1";
        pageInput.className = "pdf-page-input";
        pageInput.value = "1";
        this.pageInput = pageInput;

        const pageTotal = document.createElement("span");
        pageTotal.className = "pdf-page-total";
        pageTotal.textContent = "/ ...";
        this.pageTotal = pageTotal;

        pageInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                this.goToPage(parseInt(pageInput.value));
            }
        });

        pageInput.addEventListener("blur", () => {
            const pageNum = parseInt(pageInput.value);
            if (pageNum >= 1 && pageNum <= this.totalPages) {
                this.goToPage(pageNum);
            } else {
                pageInput.value = this.currentPage;
            }
        });

        pageInputWrapper.appendChild(pageInput);
        pageInputWrapper.appendChild(pageTotal);

        const zoomSelect = document.createElement("select");
        zoomSelect.className = "pdf-zoom-select";
        const zoomLevels = [
            { value: 0.5, label: "50%" },
            { value: 0.75, label: "75%" },
            { value: 1.0, label: "100%" },
            { value: 1.25, label: "125%" },
            { value: 1.5, label: "150%" },
            { value: 2.0, label: "200%" }
        ];

        zoomLevels.forEach(level => {
            const option = document.createElement("option");
            option.value = level.value;
            option.textContent = level.label;
            if (level.value === 1.0) option.selected = true;
            zoomSelect.appendChild(option);
        });

        zoomSelect.addEventListener("change", (e) => {
            this.setZoom(parseFloat(e.target.value));
        });

        const menuBtn = document.createElement("button");
        menuBtn.className = "pdf-menu-btn";
        menuBtn.textContent = "⋮";
        menuBtn.title = "Mais opções";

        const menuDropdown = document.createElement("div");
        menuDropdown.className = "pdf-menu-dropdown";
        menuDropdown.style.display = "none";

        const openInNewTab = document.createElement("a");
        openInNewTab.href = this.url;
        openInNewTab.target = "_blank";
        openInNewTab.className = "pdf-menu-item";
        openInNewTab.textContent = "Abrir em nova aba";
        openInNewTab.addEventListener("click", () => {
            menuDropdown.style.display = "none";
        });

        menuDropdown.appendChild(openInNewTab);

        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            menuDropdown.style.display = menuDropdown.style.display === "none" ? "block" : "none";
        });

        document.addEventListener("click", () => {
            menuDropdown.style.display = "none";
        });

        const menuWrapper = document.createElement("div");
        menuWrapper.className = "pdf-menu-wrapper";
        menuWrapper.appendChild(menuBtn);
        menuWrapper.appendChild(menuDropdown);

        const toggleLinkBtn = document.createElement("button");
        toggleLinkBtn.className = "pdf-toggle-link-btn";
        toggleLinkBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M318-120q-82 0-140-58t-58-140q0-40 15-76t43-64l134-133 56 56-134 134q-17 17-25.5 38.5T200-318q0 49 34.5 83.5T318-200q23 0 45-8.5t39-25.5l133-134 57 57-134 133q-28 28-64 43t-76 15Zm79-220-57-57 223-223 57 57-223 223Zm251-28-56-57 134-133q17-17 25-38t8-44q0-50-34-85t-84-35q-23 0-44.5 8.5T558-726L425-592l-57-56 134-134q28-28 64-43t76-15q82 0 139.5 58T839-641q0 39-14.5 75T782-502L648-368Z"/></svg>';
        toggleLinkBtn.title = "Editar link";
        toggleLinkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.view && this.start !== undefined && this.end !== undefined) {
                this.view.dispatch({
                    selection: { anchor: this.start, head: this.start },
                    scrollIntoView: true
                });
                this.view.focus();
            }
        });

        controls.appendChild(toggleLinkBtn);
        controls.appendChild(pageInputWrapper);
        controls.appendChild(zoomSelect);
        controls.appendChild(menuWrapper);

        const wrapper = document.createElement("div");
        wrapper.className = "pdf-pages-wrapper";
        this.pagesContainer = wrapper;

        wrapper.addEventListener("scroll", () => {
            this.handleScroll();
        });

        container.appendChild(controls);
        container.appendChild(wrapper);

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.loadPdf();
                observer.disconnect();
            }
        });
        observer.observe(container);

        return container;
    }

    async loadPdf() {
        try {
            await this.viewer.loadDocument(this.url);
            this.totalPages = this.viewer.getPageCount();
            this.pageInput.max = this.totalPages;
            this.pageTotal.textContent = `/ ${this.totalPages}`;

            await this.createAllPages();
        } catch (error) {
            this.pagesContainer.innerHTML = `<div class="pdf-error">Erro ao carregar PDF: ${error.message}</div>`;
            console.error(error);
        }
    }

    async createAllPages() {
        this.pagesContainer.innerHTML = "";
        this.pageElements = [];

        for (let i = 1; i <= this.totalPages; i++) {
            const pageWrapper = document.createElement("div");
            pageWrapper.className = "pdf-page-wrapper";
            pageWrapper.dataset.pageNumber = i;

            const canvas = document.createElement("canvas");
            canvas.className = "pdf-page-canvas";

            pageWrapper.appendChild(canvas);
            this.pagesContainer.appendChild(pageWrapper);

            this.pageElements.push({
                wrapper: pageWrapper,
                canvas: canvas,
                rendered: false,
                pageNumber: i
            });
        }

        const renderObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const pageNum = parseInt(entry.target.dataset.pageNumber);
                        this.renderPageIfNeeded(pageNum);
                    }
                });
            },
            {
                root: this.pagesContainer,
                rootMargin: "200px"
            }
        );

        this.pageElements.forEach(pageEl => {
            renderObserver.observe(pageEl.wrapper);
        });

        this.renderObserver = renderObserver;
    }

    async renderPageIfNeeded(pageNumber) {
        const pageEl = this.pageElements[pageNumber - 1];
        if (!pageEl || pageEl.rendered) return;

        try {
            await this.viewer.renderPage(pageNumber, pageEl.canvas, this.scale);
            pageEl.rendered = true;
        } catch (error) {
            console.error(`Error rendering page ${pageNumber}:`, error);
        }
    }

    async setZoom(newScale) {
        this.scale = newScale;

        this.pageElements.forEach(pageEl => {
            pageEl.rendered = false;
        });

        const visiblePages = this.getVisiblePages();
        for (const pageNum of visiblePages) {
            await this.renderPageIfNeeded(pageNum);
        }
    }

    getVisiblePages() {
        const wrapperRect = this.pagesContainer.getBoundingClientRect();
        const visiblePages = [];

        this.pageElements.forEach(pageEl => {
            const rect = pageEl.wrapper.getBoundingClientRect();
            if (rect.top < wrapperRect.bottom && rect.bottom > wrapperRect.top) {
                visiblePages.push(pageEl.pageNumber);
            }
        });

        return visiblePages;
    }

    handleScroll() {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }

        this.scrollTimeout = setTimeout(() => {
            this.updateCurrentPage();
        }, 100);
    }

    updateCurrentPage() {
        const wrapperRect = this.pagesContainer.getBoundingClientRect();
        const centerY = wrapperRect.top + wrapperRect.height / 2;

        let closestPage = 1;
        let closestDistance = Infinity;

        this.pageElements.forEach(pageEl => {
            const rect = pageEl.wrapper.getBoundingClientRect();
            const pageCenter = rect.top + rect.height / 2;
            const distance = Math.abs(pageCenter - centerY);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestPage = pageEl.pageNumber;
            }
        });

        if (this.currentPage !== closestPage) {
            this.currentPage = closestPage;
            this.pageInput.value = closestPage;
        }
    }

    goToPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.totalPages) return;

        const pageEl = this.pageElements[pageNumber - 1];
        if (pageEl) {
            pageEl.wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
            this.currentPage = pageNumber;
            this.pageInput.value = pageNumber;
        }
    }

    ignoreEvent() {
        return true;
    }

    destroy() {
        if (this.renderObserver) {
            this.renderObserver.disconnect();
        }
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        this.viewer.destroy();
    }
}
