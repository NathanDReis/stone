export class LinkResolver {
    constructor(fileSystemService) {
        this.fs = fileSystemService;
        this.cache = new Map();
    }

    /**
     * Resolve a link by ID or name
     * @param {string} content - Document ID or file name
     * @returns {object} - Resolution result
     */
    resolve(content) {
        if (this.cache.has(content)) {
            return this.cache.get(content);
        }

        // First, try to resolve as an ID
        let node = this.fs.getNode(content);

        // If not found, try to resolve as a file name
        if (!node || node.type !== 'file') {
            const nodes = this.fs.getNodes().filter(n => n.type === 'file');
            node = nodes.find(n => n.name === content);
        }

        const result = {
            valid: node && node.type === 'file',
            uuid: node ? node.id : null,
            displayName: node && node.type === 'file'
                ? node.name
                : content,
            node: node && node.type === 'file' ? node : null
        };

        this.cache.set(content, result);
        return result;
    }

    /**
     * Resolve a link by file name
     * @param {string} name - File name to search for
     * @returns {object} - Resolution result with UUID
     */
    resolveByName(name) {
        // Search for a file node with matching name
        const nodes = this.fs.getNodes().filter(n => n.type === 'file');
        const matchingNode = nodes.find(n => n.name === name);

        if (matchingNode) {
            return this.resolve(matchingNode.id);
        }

        // If not found, return invalid result
        return {
            valid: false,
            uuid: null,
            displayName: name,
            node: null,
            originalName: name
        };
    }

    invalidateCache(uuid = null) {
        if (uuid) {
            this.cache.delete(uuid);
        } else {
            this.cache.clear();
        }
    }

    getBacklinks(uuid) {
        const backlinks = [];
        const allNodes = this.fs.getNodes().filter(n => n.type === 'file');

        // Get the node to find its name
        const targetNode = this.fs.getNode(uuid);
        if (!targetNode) return backlinks;

        for (const node of allNodes) {
            if (node.id === uuid) continue;

            const doc = this.fs.getDocument(node.id);
            if (!doc) continue;

            // Search for both ID-based and name-based links
            const idRegex = new RegExp(`\\[\\[${uuid}\\]\\]`, 'g');
            const nameRegex = new RegExp(`\\[\\[${targetNode.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g');

            const idMatches = (doc.content.match(idRegex) || []).length;
            const nameMatches = (doc.content.match(nameRegex) || []).length;
            const totalMatches = idMatches + nameMatches;

            if (totalMatches > 0) {
                backlinks.push({
                    node,
                    count: totalMatches
                });
            }
        }

        return backlinks;
    }

    /**
     * Future feature: Resolve link with heading anchor
     * Syntax: [[uuid#heading-slug]]
     * @param {string} uuid - Document UUID
     * @param {string} heading - Heading slug to navigate to
     * @returns {object} - Resolution result with heading info
     */
    resolveWithHeading(uuid, heading) {
        const baseResult = this.resolve(uuid);
        return {
            ...baseResult,
            heading,
            anchor: `#${heading}`
        };
    }

    /**
     * Get all internal links found in a specific document
     * @param {string} uuid - Document UUID to analyze
     * @returns {Array} - Array of linked UUIDs found in the document
     */
    getAllLinks(uuid) {
        const doc = this.fs.getDocument(uuid);
        if (!doc) return [];

        const links = [];
        // Match any content inside [[ ]], not just UUIDs
        const regex = /\[\[([^\]]+)\]\]/g;

        let match;
        while ((match = regex.exec(doc.content))) {
            const linkedContent = match[1];
            if (!links.includes(linkedContent)) {
                links.push(linkedContent);
            }
        }

        return links.map(linkedContent => this.resolve(linkedContent));
    }
}
