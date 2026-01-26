import * as pdfjsLib from 'pdfjs-dist';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export class PdfViewer {
    constructor() {
        this.pdfDoc = null;
        this.pageCache = new Map();
        this.loadingTask = null;
    }

    async loadDocument(url) {
        if (this.loadingTask) {
            this.loadingTask.destroy();
        }

        try {
            this.loadingTask = pdfjsLib.getDocument(url);
            this.pdfDoc = await this.loadingTask.promise;
            return this.pdfDoc;
        } catch (error) {
            console.error("Error loading PDF:", error);
            throw error;
        }
    }

    getPageCount() {
        return this.pdfDoc ? this.pdfDoc.numPages : 0;
    }

    async renderPage(pageNumber, canvas, scale = 1.0) {
        if (!this.pdfDoc) return;

        let page;
        if (this.pageCache.has(pageNumber)) {
            page = this.pageCache.get(pageNumber);
        } else {
            page = await this.pdfDoc.getPage(pageNumber);
            this.pageCache.set(pageNumber, page);
        }

        const viewport = page.getViewport({ scale });

        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;
    }

    async getPageDimensions(pageNumber, scale = 1.0) {
        if (!this.pdfDoc) return null;

        let page;
        if (this.pageCache.has(pageNumber)) {
            page = this.pageCache.get(pageNumber);
        } else {
            page = await this.pdfDoc.getPage(pageNumber);
            this.pageCache.set(pageNumber, page);
        }

        const viewport = page.getViewport({ scale });
        return {
            width: viewport.width,
            height: viewport.height
        };
    }

    destroy() {
        if (this.loadingTask) {
            this.loadingTask.destroy();
        }
        this.pdfDoc = null;
        this.pageCache.clear();
    }
}
