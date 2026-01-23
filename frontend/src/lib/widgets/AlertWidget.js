import { WidgetType } from "@codemirror/view";

export class AlertWidget extends WidgetType {
    constructor(type) {
        super();
        this.type = type;
    }

    toDOM() {
        const container = document.createElement("div");
        container.className = `cm-alert-icon-container`;

        const iconSpan = document.createElement("span");
        iconSpan.className = `cm-alert-icon cm-alert-color-${this.type}`;

        let svgPath = "";
        let viewBox = "0 0 24 24";

        switch (this.type) {
            case "info":
                svgPath = `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>`;
                break;
            case "success":
                svgPath = `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>`;
                break;
            case "warning":
                svgPath = `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>`;
                break;
            case "error":
                svgPath = `<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>`;
                break;
            case "default":
                svgPath = `<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v10c0 1.25.75 2 2 2h3c0 4-4 4-4 4zm11 0c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v10c0 1.25.75 2 2 2h3c0 4-4 4-4 4z"></path>`;
                break;
        }

        iconSpan.innerHTML = `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>`;
        container.appendChild(iconSpan);
        return container;
    }

    ignoreEvent() {
        return false;
    }
}
