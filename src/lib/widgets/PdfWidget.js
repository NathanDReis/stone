import { WidgetType } from "@codemirror/view";
import { PdfViewer } from "../pdf/PdfViewer";

export class PdfWidget extends WidgetType {
    constructor(url) {
        super();
        this.url = url;
        this.viewer = new PdfViewer();
        this.currentPage = 1;
        this.scale = 1.0;
        this.container = null;
        this.canvas = null;
        this.source = markdownSource;
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

        const prevBtn = document.createElement("button");
        prevBtn.textContent = "◀";
        prevBtn.onclick = () => this.changePage(-1);

        const nextBtn = document.createElement("button");
        nextBtn.textContent = "▶";
        nextBtn.onclick = () => this.changePage(1);

        const pageIndicator = document.createElement("span");
        pageIndicator.className = "pdf-page-indicator";
        pageIndicator.textContent = "Loading...";

        const zoomInBtn = document.createElement("button");
        zoomInBtn.textContent = "+";
        zoomInBtn.onclick = () => this.zoom(0.2);

        const zoomOutBtn = document.createElement("button");
        zoomOutBtn.textContent = "-";
        zoomOutBtn.onclick = () => this.zoom(-0.2);

        controls.appendChild(prevBtn);
        controls.appendChild(pageIndicator);
        controls.appendChild(nextBtn);
        controls.appendChild(document.createTextNode(" | "));
        controls.appendChild(zoomOutBtn);
        controls.appendChild(zoomInBtn);

        this.pageIndicator = pageIndicator;

        const wrapper = document.createElement("div");
        wrapper.className = "pdf-canvas-wrapper";

        const canvas = document.createElement("canvas");
        this.canvas = canvas;
        wrapper.appendChild(canvas);

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
            this.updatePageIndicator();
            await this.renderCurrentPage();
        } catch (error) {
            this.pageIndicator.textContent = "Error loading PDF";
            console.error(error);
        }
    }

    async renderCurrentPage() {
        if (!this.canvas) return;
        await this.viewer.renderPage(this.currentPage, this.canvas, this.scale);
    }

    changePage(delta) {
        const newPage = this.currentPage + delta;
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.currentPage = newPage;
            this.updatePageIndicator();
            this.renderCurrentPage();
        }
    }

    zoom(delta) {
        this.scale = Math.max(0.5, this.scale + delta);
        this.renderCurrentPage();
    }

    updatePageIndicator() {
        if (this.pageIndicator) {
            this.pageIndicator.textContent = `${this.currentPage} / ${this.totalPages}`;
        }
    }

    ignoreEvent() {
        return true;
    }

    destroy() {
        this.viewer.destroy();
    }
}
