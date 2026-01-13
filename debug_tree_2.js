import { parser } from "@lezer/markdown";

const text = `
- Item
1. Ordered
- [ ] Task
- [x] Done
`;

// Parse with default GFM extensions usually enabled by CodeMirror's markdown()
// But here using raw parser. logic might differ slightly.
const tree = parser.parse(text);

let output = "";
tree.iterate({
    enter: (node) => {
        output += `${node.name} (parent: ${node.node.parent ? node.node.parent.name : 'none'})\n`;
    }
});

console.log(output);
