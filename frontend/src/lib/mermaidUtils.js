export function parseMermaid(code) {
    const nodes = new Map();
    const edges = [];

    const lines = code.split('\n');

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) return;

        const edgeRegex = /^([a-zA-Z0-9_]+(?:\s*(?:\[.*?\]|\(.*?\)|\{.*?\}|\( \(.*?\) \)|>.*?\]))?)\s*([-=\.x>o\s]{1,}.*?(?:\|.*?\|)?.*?)\s*([a-zA-Z0-9_]+(?:\s*(?:\[.*?\]|\(.*?\)|\{.*?\}|\( \(.*?\) \)|>.*?\]))?.*)$/;
        const edgeMatch = trimmed.match(edgeRegex);

        if (edgeMatch) {
            let [_, fullFrom, arrowPart, fullTo] = edgeMatch;

            const extractId = (nodePart) => {
                const m = nodePart.match(/^([a-zA-Z0-9_]+)\s*(?:(\[.*?\]|\(.*?\)|\{.*?\}|\( \(.*?\) \)|>.*?\]))?/);
                return m ? { id: m[1], content: m[2] } : { id: nodePart.trim(), content: null };
            };

            const fromInfo = extractId(fullFrom);
            const toInfo = extractId(fullTo);
            const from = fromInfo.id;
            const to = toInfo.id;

            let type = arrowPart.trim();
            let label = "";

            // Caso A -->|texto| B
            if (arrowPart.includes("|")) {
                const pipeMatch = arrowPart.match(/^(.*?)\|(.*)\|(.*)$/);
                if (pipeMatch) {
                    type = (pipeMatch[1].trim() + (pipeMatch[3] || "").trim()).trim();
                    let rawLabel = pipeMatch[2].trim();
                    if (rawLabel.startsWith('"') && rawLabel.endsWith('"')) {
                        rawLabel = rawLabel.substring(1, rawLabel.length - 1);
                    }
                    label = rawLabel;
                }
            }

            else if (arrowPart.includes(" ") && (arrowPart.startsWith("-") || arrowPart.startsWith("="))) {
                const matchText = arrowPart.match(/^(--|==|-\.)\s*(.*?)\s*(->|->>|--|==)$/);
                if (matchText) {
                    type = matchText[1] + matchText[3];
                    label = matchText[2].trim();
                }
            }

            type = type.replace("→", "-->").replace("⇢", "-.->").replace("⇒", "==>").replace("─", "---");

            edges.push({ from, to, type, label, line: index });

            if (!nodes.has(from)) nodes.set(from, { id: from, label: from, shape: '[]' });
            if (!nodes.has(to)) nodes.set(to, { id: to, label: to, shape: '[]' });
            return;
        }

        const nodeRegex = /^([a-zA-Z0-9_]+)\s*(\(\( |\(|\[|\{|>)(.+?)(\)\)|\)|\]|\}|])$/;

        const nodeMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*(\(\(|\(|\[|\{|>)(.+?)(\)\)|\)|\]|\}|])$/);

        if (nodeMatch) {
            const [_full, id, open, label, close] = nodeMatch;
            let shape = '[]';
            if (open === '[' && close === ']') shape = 'rect';
            else if (open === '(' && close === ')') shape = 'rounded';
            else if (open === '{' && close === '}') shape = 'diamond';
            else if (open === '((' && close === '))') shape = 'circle';

            nodes.set(id, { id, label, shape });
        }

        const styleMatch = trimmed.match(/^style\s+([a-zA-Z0-9_]+)\s+fill:([#a-fA-F0-9]+)/);
        if (styleMatch) {
            const [_full, id, color] = styleMatch;
            const node = nodes.get(id);
            if (node) {
                node.color = color;
            }
        }
    });

    return {
        nodes: Array.from(nodes.values()),
        edges
    };
}

export function updateNodeLabel(code, nodeId, newLabel) {
    const lines = code.split('\n');
    let found = false;

    const defRegex = new RegExp(`^(${nodeId})\\s*(\\( \\(|\\(|\\[|\\{|>)(.+?)(\\)\\)|\\)|\\]|\\}|])$`);

    const newLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimMatchesId(trimmed, nodeId)) {
            const match = trimmed.match(/^([a-zA-Z0-9_]+)\s*(\(\(|\(|\[|\{|>)(.+?)(\)\)|\)|\]|\}|])(\s*;?.*)$/);
            if (match) {
                found = true;
                const [_full, id, open, oldLabel, close, rest] = match;
                return `${id}${open}${newLabel}${close}${rest}`;
            }
            const matchSimple = trimmed.match(/^([a-zA-Z0-9_]+)\s*(\(\(|\(|\[|\{|>)(.+?)(\)\)|\)|\]|\}|])$/);
            if (matchSimple) {
                found = true;
                const [_full, id, open, oldLabel, close] = matchSimple;
                return `${id}${open}${newLabel}${close}`;
            }
        }
        return line;
    });

    if (!found) {
        newLines.push(`${nodeId}[${newLabel}]`);
    }

    return newLines.join('\n');
}

export function updateNodeColor(code, nodeId, newColor) {
    const lines = code.split('\n');
    let found = false;
    const styleRegex = new RegExp(`^style\\s+${nodeId}\\s+fill:[#a-fA-F0-9]+`);

    let newLines = lines.map(line => {
        if (styleRegex.test(line.trim())) {
            found = true;
            if (!newColor) return null;
            return `style ${nodeId} fill:${newColor}`;
        }
        return line;
    }).filter(line => line !== null);

    if (!found && newColor) {
        newLines.push(`style ${nodeId} fill:${newColor}`);
    }

    return newLines.join('\n');
}

export function updateNodeShape(code, nodeId, newShape) {
    let open = '[', close = ']';
    if (newShape === 'rounded') { open = '('; close = ')'; }
    if (newShape === 'diamond') { open = '{'; close = '}'; }
    if (newShape === 'circle') { open = '(('; close = '))'; }

    const lines = code.split('\n');
    let found = false;

    const newLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimMatchesId(trimmed, nodeId)) {
            const match = trimmed.match(/^([a-zA-Z0-9_]+)\s*(\(\(|\(|\[|\{|>)(.+?)(\)\)|\)|\]|\}|])(\s*;?.*)$/);
            if (match) {
                found = true;
                const [_full, id, _oldOpen, label, _oldClose, rest] = match;
                return `${id}${open}${label}${close}${rest}`;
            }
            const matchSimple = trimmed.match(/^([a-zA-Z0-9_]+)\s*(\(\(|\(|\[|\{|>)(.+?)(\)\)|\)|\]|\}|])$/);
            if (matchSimple) {
                found = true;
                const [_full, id, _oldOpen, label, _oldClose] = matchSimple;
                return `${id}${open}${label}${close}`;
            }
        }
        return line;
    });

    if (!found) {
        newLines.push(`${nodeId}${open}${nodeId}${close}`);
    }

    return newLines.join('\n');
}

export function updateEdgeType(code, fromId, toId, newType) {
    const lines = code.split('\n');
    const edgeRegex = new RegExp(`^(\\s*${fromId}(?:\\[.*?\\]|\\(.*?\\)|\\{.*?\\}|\\( \\(.*?\\) \\)|>.*?\\])?)(\\s*)(.*?)(\\s*)(${toId}(?:\\[.*?\\]|\\(.*?\\)|\\{.*?\\}|\\( \\(.*?\\) \\)|>.*?\\])?.*)$`);

    return lines.map(line => {
        const match = line.match(edgeRegex);
        if (match) {
            const [_full, sourcePart, s1, arrowPart, s2, targetPart] = match;

            let label = "";
            if (arrowPart.includes("|")) {
                const parts = arrowPart.split("|");
                label = (parts[1] || "").trim();
            } else {
                const textMatch = arrowPart.match(/^(--|==|-\.)\s*(.*?)\s*(->|->>|--|==)$/);
                if (textMatch) label = textMatch[2].trim();
            }

            const cleanArrow = newType;
            const newArrowPart = label ? `${cleanArrow}|${label}|` : cleanArrow;

            return `${sourcePart}${s1}${newArrowPart}${s2}${targetPart}`;
        }
        return line;
    }).join('\n');
}

export function invertEdgeDirection(code, fromId, toId) {
    const lines = code.split('\n');
    const edgeRegex = new RegExp(`^(\\s*)(${fromId}(?:\\[.*?\\]|\\(.*?\\)|\\{.*?\\}|\\( \\(.*?\\) \\)|>.*?\\])?)(\\s*)(.*?)(\\s*)(${toId}(?:\\[.*?\\]|\\(.*?\\)|\\{.*?\\}|\\( \\(.*?\\) \\)|>.*?\\])?)(.*)$`);

    return lines.map(line => {
        const match = line.match(edgeRegex);
        if (match) {
            const [_full, s1, sourcePart, s2, arrowPart, s3, targetPart, suffix] = match;
            // Inverte sourcePart e targetPart, mantendo o arrowPart no meio
            return `${s1}${targetPart}${s2}${arrowPart}${s3}${sourcePart}${suffix}`;
        }
        return line;
    }).join('\n');
}

export function updateEdgeText(code, fromId, toId, newText) {
    const lines = code.split('\n');
    const edgeRegex = new RegExp(`^(\\s*${fromId}(?:\\[.*?\\]|\\(.*?\\)|\\{.*?\\}|\\( \\(.*?\\) \\)|>.*?\\])?)(\\s*)(.*?)(\\s*)(${toId}(?:\\[.*?\\]|\\(.*?\\)|\\{.*?\\}|\\( \\(.*?\\) \\)|>.*?\\])?.*)$`);

    return lines.map(line => {
        const match = line.match(edgeRegex);
        if (match) {
            const [_full, sourcePart, s1, arrowPart, s2, targetPart] = match;

            let baseType = arrowPart.trim();
            if (baseType.includes("|")) {
                const parts = baseType.split("|");
                baseType = (parts[0].trim() + (parts[2] || "").trim()).trim();
            } else if (baseType.includes(" ")) {
                const m = baseType.match(/^(--|==|-\.)\s*(.*?)\s*(->|->>|--|==)$/);
                if (m) baseType = m[1] + m[3];
            }

            // Sanitização final do tipo de seta 
            baseType = baseType.replace(/[→⇢⇒─]/g, m => {
                if (m === "→") return "-->";
                if (m === "⇢") return "-.->";
                if (m === "⇒") return "==>";
                if (m === "─") return "---";
                return m;
            });

            if (!newText || newText.trim() === "") {
                return `${sourcePart}${s1}${baseType}${s2}${targetPart}`;
            }

            const sanitizedText = newText.trim().replace(/"/g, "'");
            const newArrowPart = `${baseType}|"${sanitizedText}"|`;

            return `${sourcePart}${s1}${newArrowPart}${s2}${targetPart}`;
        }
        return line;
    }).join('\n');
}

export function addConnection(code, fromId, toId, type = '-->', label = '') {
    const lines = code.split('\n');
    const checkRegex = new RegExp(`${fromId}\\s*-.*?\\s*${toId}`);
    if (lines.some(l => checkRegex.test(l))) return code;

    const arrow = label ? `${type}|"${label.trim().replace(/"/g, "'")}"|` : type;
    return code + `\n    ${fromId}${arrow}${toId};`;
}

export function removeConnection(code, fromId, toId) {
    const lines = code.split('\n');
    const edgeRegex = new RegExp(`^\\s*${fromId}(?:\\[.*?\\]|\\(.*?\\)|\\{.*?\\}|\\( \\(.*?\\) \\)|>.*?\\])?(\\s*)(.*?)(\\s*)${toId}(?:\\[.*?\\]|\\(.*?\\)|\\{.*?\\}|\\( \\(.*?\\) \\)|>.*?\\])?.*$`);
    return lines.filter(line => !edgeRegex.test(line)).join('\n');
}

export function getAvailableNodes(code) {
    const { nodes } = parseMermaid(code);
    return nodes;
}

export function getGraphOrientation(code) {
    const lines = code.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) {
            const match = trimmed.match(/(TD|LR|TB|RL|BT)/);
            if (match) return match[1];
        }
    }
    return 'TD';
}

export function getBackgroundColor(code) {
    const match = code.match(/%% bg: ([#a-fA-F0-9]+) %%/);
    return match ? match[1] : null;
}

export function updateBackgroundColor(code, newColor) {
    const bgRegex = /%% bg: ([#a-fA-F0-9]+) %%\n?/;
    if (bgRegex.test(code)) {
        if (!newColor) return code.replace(bgRegex, "");
        return code.replace(bgRegex, `%% bg: ${newColor} %%\n`);
    }
    if (!newColor) return code;
    return `%% bg: ${newColor} %%\n` + code;
}

export function getContrastColor(hexColor) {
    if (!hexColor) return null;
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

export function updateGraphOrientation(code, newOrientation) {
    const lines = code.split('\n');
    let found = false;

    const newLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) {
            const match = trimmed.match(/(TD|LR|TB|RL|BT)/);
            if (match) {
                found = true;
                return line.replace(match[0], newOrientation);
            } else {
                found = true;
                return line + " " + newOrientation;
            }
        }
        return line;
    });


    return newLines.join('\n');
}

function trimMatchesId(line, id) {
    return new RegExp(`^${id}\\s*(\\(|\\[|\\{|>)`).test(line);
}
