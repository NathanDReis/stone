import { completeFromList } from "@codemirror/autocomplete";

export const markdownCompletions = completeFromList([
  // Headings
  { label: "# ", type: "keyword", detail: "Heading 1" },
  { label: "## ", type: "keyword", detail: "Heading 2" },
  { label: "### ", type: "keyword", detail: "Heading 3" },
  { label: "#### ", type: "keyword", detail: "Heading 4" },
  { label: "##### ", type: "keyword", detail: "Heading 5" },
  { label: "###### ", type: "keyword", detail: "Heading 6" },
  
  // Text formatting
  { label: "**bold**", type: "text", detail: "Bold text" },
  { label: "*italic*", type: "text", detail: "Italic text" },
  { label: "_italic_", type: "text", detail: "Italic text (alt)" },
  { label: "~~strikethrough~~", type: "text", detail: "Strikethrough" },
  { label: "==highlight==", type: "text", detail: "Highlight" },
  { label: "***bold italic***", type: "text", detail: "Bold + Italic" },
  
  // Code
  { label: "`code`", type: "code", detail: "Inline code" },
  { label: "```\n\n```", type: "code", detail: "Code block" },
  { label: "```js\n\n```", type: "code", detail: "JavaScript block" },
  { label: "```python\n\n```", type: "code", detail: "Python block" },
  { label: "```html\n\n```", type: "code", detail: "HTML block" },
  { label: "```css\n\n```", type: "code", detail: "CSS block" },
  
  // Lists
  { label: "- ", type: "keyword", detail: "Unordered list" },
  { label: "* ", type: "keyword", detail: "Unordered list (alt)" },
  { label: "+ ", type: "keyword", detail: "Unordered list (alt)" },
  { label: "1. ", type: "keyword", detail: "Ordered list" },
  { label: "- [ ] ", type: "keyword", detail: "Task list (unchecked)" },
  { label: "- [x] ", type: "keyword", detail: "Task list (checked)" },
  
  // Links and images
  { label: "[]()", type: "text", detail: "Link" },
  { label: "[text](url)", type: "text", detail: "Link with text" },
  { label: "![]()", type: "text", detail: "Image" },
  { label: "![alt](url)", type: "text", detail: "Image with alt" },
  
  // Quotes and separators
  { label: "> ", type: "text", detail: "Blockquote" },
  { label: "---", type: "keyword", detail: "Horizontal rule" },
  { label: "***", type: "keyword", detail: "Horizontal rule (alt)" },
  
  // Tables
  { label: "| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |", type: "keyword", detail: "Table" },
  
  // Footnotes
  { label: "[^1]", type: "text", detail: "Footnote reference" },
  { label: "[^1]: ", type: "text", detail: "Footnote definition" },
  
  // HTML entities
  { label: "&nbsp;", type: "text", detail: "Non-breaking space" },
  { label: "&copy;", type: "text", detail: "Copyright symbol" },
  { label: "&trade;", type: "text", detail: "Trademark symbol" }
]);
