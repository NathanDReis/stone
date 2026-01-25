import { initialNodes } from '../mock-db/nodes.mock.js';
import { initialDocuments } from '../mock-db/documents.mock.js';

export class FileSystemService {
    constructor() {
        this.nodes = [...initialNodes];
        this.documents = [...initialDocuments];
    }

    getNodes() {
        return this.nodes;
    }

    getDocument(id) {
        return this.documents.find(doc => doc.id === id);
    }

    getNode(id) {
        return this.nodes.find(node => node.id === id);
    }

    _generateId() {
        return crypto.randomUUID();
    }

    _generateTimestamp() {
        return new Date().toISOString();
    }

    _generatePath(name, parentId) {
        if (!parentId) {
            return `/${name}`;
        }
        const parent = this.getNode(parentId);
        if (!parent) {
            throw new Error(`Parent node with id ${parentId} not found`);
        }
        return `${parent.path}/${name}`;
    }

    createFolder(name, parentId = null) {
        const id = this._generateId();
        const now = this._generateTimestamp();
        const path = this._generatePath(name, parentId);

        const folderNode = {
            id,
            parent_id: parentId,
            name,
            type: 'folder',
            path,
            created_at: now,
            updated_at: now
        };

        this.nodes.push(folderNode);
        return folderNode;
    }

    createFile(name, parentId = null) {
        const id = this._generateId();
        const now = this._generateTimestamp();
        const path = this._generatePath(name, parentId);

        const fileNode = {
            id,
            parent_id: parentId,
            name,
            type: 'file',
            path,
            created_at: now,
            updated_at: now
        };

        const newDocument = {
            id,
            content: '',
            version: 1,
            updated_at: now
        };

        this.nodes.push(fileNode);
        this.documents.push(newDocument);

        return fileNode;
    }

    updateDocument(id, content) {
        const docIndex = this.documents.findIndex(d => d.id === id);
        if (docIndex === -1) {
            throw new Error(`Document with id ${id} not found`);
        }

        const now = this._generateTimestamp();
        const doc = this.documents[docIndex];

        // Update document
        doc.content = content;
        doc.version += 1;
        doc.updated_at = now;

        // Also update the node's updated_at
        const nodeIndex = this.nodes.findIndex(n => n.id === id);
        if (nodeIndex !== -1) {
            this.nodes[nodeIndex].updated_at = now;
        }

        return doc;
    }

    moveNode(nodeId, newParentId) {
        const node = this.getNode(nodeId);
        if (!node) throw new Error(`Node ${nodeId} not found`);

        if (nodeId === newParentId) throw new Error("Cannot move node into itself");

        if (node.type === 'folder' && newParentId) {
            let parent = this.getNode(newParentId);
            while (parent) {
                if (parent.id === nodeId) {
                    throw new Error("Cannot move folder into its own child");
                }
                parent = parent.parent_id ? this.getNode(parent.parent_id) : null;
            }
        }

        node.parent_id = newParentId;
        const newPath = this._generatePath(node.name, newParentId);
        this._updatePathsRecursive(node, newPath);
        node.updated_at = this._generateTimestamp();

        return node;
    }

    _updatePathsRecursive(node, newPath) {
        node.path = newPath;
        if (node.type === 'folder') {
            const children = this.nodes.filter(n => n.parent_id === node.id);
            children.forEach(child => {
                this._updatePathsRecursive(child, `${newPath}/${child.name}`);
            });
        }
    }
    updateNodeName(id, newName) {
        if (!newName || newName.trim() === '') {
            throw new Error("Name cannot be empty");
        }

        const node = this.getNode(id);
        if (!node) throw new Error(`Node ${id} not found`);

        if (node.name === newName) return node;

        node.name = newName;

        // Regenerate path
        const newPath = this._generatePath(newName, node.parent_id);
        this._updatePathsRecursive(node, newPath);

        node.updated_at = this._generateTimestamp();

        return node;
    }
}
