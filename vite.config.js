import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    include: [
      "@codemirror/state",
      "@codemirror/view",
      "@codemirror/commands",
      "@codemirror/lang-markdown",
      "@codemirror/autocomplete",
      "@codemirror/search",
      "@codemirror/language",
      "marked"
    ]
  }
});
