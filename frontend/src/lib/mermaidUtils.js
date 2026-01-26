export function parseMermaid(code) {
    const nodes = new Map();
    const edges = [];

    const lines = code.split('\n');

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) return;

        const edgeRegex = /^([a-zA-Z0-9_]+)\s*(-*\.?-*=*>?)\s*([a-zA-Z0-9_]+)/;
        const edgeMatch = trimmed.match(edgeRegex);

        if (edgeMatch) {
            const [_full, from, arrow, to] = edgeMatch;
            edges.push({ from, to, type: arrow, line: index });

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

    const customRegex = new RegExp(`^(\\s*${fromId}\\s*)(.*?)(\\s*${toId}.*)$`);

    return lines.map(line => {
        if (customRegex.test(line)) {
            return line.replace(customRegex, `$1${newType}$3`);
        }
        return line;
    }).join('\n');
}

export function invertEdgeDirection(code, fromId, toId) {
    const lines = code.split('\n');

    const customRegex = new RegExp(`^(\\s*)(${fromId})(\\s*)(.*?)(\\s*)(${toId})(.*)$`);

    return lines.map(line => {
        if (customRegex.test(line)) {
            return line.replace(customRegex, `$1$6$3$4$5$2$7`);
        }
        return line;
    }).join('\n');
}

export function addConnection(code, fromId, toId, type = '-->') {
    const lines = code.split('\n');
    const checkRegex = new RegExp(`${fromId}\\s*-.*>\\s*${toId}`);
    if (lines.some(l => checkRegex.test(l))) return code;

    return code + `\n    ${fromId}${type}${toId};`;
}

export function removeConnection(code, fromId, toId) {
    const lines = code.split('\n');
    const checkRegex = new RegExp(`^\\s*${fromId}\\s*[-.=]+>??\\s*${toId}`);
    return lines.filter(line => !checkRegex.test(line)).join('\n');
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
            const match = trimmed.match(/(TD|LR|TB|RL)/);
            if (match) return match[1];
        }
    }
    return 'TD';
}

export function updateGraphOrientation(code, newOrientation) {
    const lines = code.split('\n');
    let found = false;

    const newLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) {
            const match = trimmed.match(/(TD|LR|TB|RL)/);
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
