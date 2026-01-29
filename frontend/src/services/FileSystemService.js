import { initialNodes } from '../mock-db/nodes.mock.js';
import { initialDocuments } from '../mock-db/documents.mock.js';
import { initialUsers } from '../mock-db/users.mock.js';
import { initialProfiles } from '../mock-db/profiles.mock.js';

export class FileSystemService {
    constructor() {
        this.nodes = [...initialNodes];
        this.documents = [...initialDocuments];
        this.users = [...initialUsers];
        this.profiles = [...initialProfiles];
        this.currentOpenFileId = null;
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

    getUsers() {
        return this.users;
    }

    getProfiles() {
        return this.profiles;
    }

    getUser(id) {
        return this.users.find(u => u.id === id);
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

    _getNextOrder(parentId) {
        const siblings = this.nodes.filter(n => n.parent_id === parentId);
        if (siblings.length === 0) return 0;
        return Math.max(...siblings.map(n => n.order || 0)) + 1;
    }

    createFolder(name, parentId = null) {
        const id = this._generateId();
        const now = this._generateTimestamp();
        const path = this._generatePath(name, parentId);
        const order = this._getNextOrder(parentId);

        const folderNode = {
            id,
            parent_id: parentId,
            name,
            type: 'folder',
            path,
            order,
            icon: 'folder',
            permissions: [
                { profileId: 'admin', view: true, edit: true, delete: true },
                { profileId: 'editor', view: true, edit: true, delete: false },
                { profileId: 'guest', view: true, edit: false, delete: false }
            ],
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
        const order = this._getNextOrder(parentId);

        const fileNode = {
            id,
            parent_id: parentId,
            name,
            type: 'file',
            path,
            order,
            icon: 'description',
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

    createSeparator(parentId = null) {
        const id = this._generateId();
        const now = this._generateTimestamp();
        const order = this._getNextOrder(parentId);

        const separatorNode = {
            id,
            parent_id: parentId,
            name: 'separator',
            type: 'separator',
            path: '',
            order,
            created_at: now,
            updated_at: now
        };

        this.nodes.push(separatorNode);
        return separatorNode;
    }

    updateNodePermissions(id, permissions) {
        const nodeIndex = this.nodes.findIndex(n => n.id === id);
        if (nodeIndex === -1) {
            throw new Error(`Node with id ${id} not found`);
        }

        this.nodes[nodeIndex].permissions = permissions;
        this.nodes[nodeIndex].updated_at = this._generateTimestamp();
        return this.nodes[nodeIndex];
    }

    updateDocument(id, updates) {
        const docIndex = this.documents.findIndex(d => d.id === id);
        if (docIndex === -1) {
            throw new Error(`Document with id ${id} not found`);
        }

        const now = this._generateTimestamp();
        const doc = this.documents[docIndex];

        if (typeof updates === 'string') {
            doc.content = updates;
        } else {
            Object.assign(doc, updates);
        }

        doc.version += 1;
        doc.updated_at = now;

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
        node.order = this._getNextOrder(newParentId);

        if (node.type !== 'separator') {
            const newPath = this._generatePath(node.name, newParentId);
            this._updatePathsRecursive(node, newPath);
        }

        node.updated_at = this._generateTimestamp();

        return node;
    }

    reorderNode(nodeId, targetNodeId, position) {
        const node = this.getNode(nodeId);
        const targetNode = this.getNode(targetNodeId);

        if (!node || !targetNode) return;

        let newParentId = targetNode.parent_id;

        if (position === 'inside') {
            if (targetNode.type !== 'folder') return;
            newParentId = targetNode.id;
        }

        if (node.type === 'folder' && newParentId) {
            let parent = this.getNode(newParentId);
            while (parent) {
                if (parent.id === nodeId) {
                    return;
                }
                parent = parent.parent_id ? this.getNode(parent.parent_id) : null;
            }
        }

        node.parent_id = newParentId;

        if (node.type !== 'separator') {
            const newPath = this._generatePath(node.name, newParentId);
            this._updatePathsRecursive(node, newPath);
        }

        const siblings = this.nodes.filter(n => n.parent_id === newParentId && n.id !== nodeId);

        siblings.sort((a, b) => (a.order || 0) - (b.order || 0));

        let targetIndex = -1;
        if (position !== 'inside') {
            targetIndex = siblings.findIndex(n => n.id === targetNodeId);
        }

        if (position === 'before') {
            siblings.splice(targetIndex, 0, node);
        } else if (position === 'after') {
            siblings.splice(targetIndex + 1, 0, node);
        } else {
            siblings.push(node);
        }

        siblings.forEach((n, index) => {
            n.order = index;
        });

        return node;
    }

    updateNodeName(id, newName) {
        if (!newName || newName.trim() === '') {
            throw new Error("Name cannot be empty");
        }

        const node = this.getNode(id);
        if (!node) throw new Error(`Node ${id} not found`);

        if (node.name === newName) return node;

        node.name = newName;

        const newPath = this._generatePath(newName, node.parent_id);
        this._updatePathsRecursive(node, newPath);

        node.updated_at = this._generateTimestamp();

        return node;
    }

    updateNodeIcon(id, iconName) {
        const node = this.getNode(id);
        if (!node) throw new Error(`Node ${id} not found`);

        node.icon = iconName;
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

    deleteNode(id) {
        const nodeIndex = this.nodes.findIndex(n => n.id === id);
        if (nodeIndex === -1) {
            throw new Error(`Node ${id} not found`);
        }

        const node = this.nodes[nodeIndex];

        if (node.type === 'folder') {
            const children = this.nodes.filter(n => n.parent_id === id);
            children.forEach(child => this.deleteNode(child.id));
        }

        this.nodes.splice(nodeIndex, 1);

        if (node.type === 'file') {
            const docIndex = this.documents.findIndex(d => d.id === id);
            if (docIndex !== -1) {
                this.documents.splice(docIndex, 1);
            }
        }
    }
}
