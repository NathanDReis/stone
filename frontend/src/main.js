import { FileSystemService } from './services/FileSystemService.js';
import { FileTree } from './ui/FileTree.js';
import { EditorController } from './ui/EditorController.js';

const fileSystem = new FileSystemService();
let activeFileId = null;

const menuElement = document.querySelector('.site-menu');
const editorContainer = document.querySelector('.site-main');
const treeContainer = document.createElement('div');
treeContainer.id = 'file-tree-root';
menuElement.appendChild(treeContainer);

const editor = new EditorController(editorContainer, {
    onSave: (content) => {
        if (!activeFileId) return;
        try {
            fileSystem.updateDocument(activeFileId, content);
            console.log(`Document ${activeFileId} saved.`);
        } catch (e) {
            console.error('Failed to save document:', e);
        }
    }
});

const fileTree = new FileTree(treeContainer, {
    onFileSelect: (node) => {
        openFile(node);
    },
    onNodeCreate: (name, type, parentId) => {
        try {
            let newNode;
            if (type === 'folder') {
                newNode = fileSystem.createFolder(name, parentId);
            } else {
                newNode = fileSystem.createFile(name, parentId);
            }
            loadTree();

            if (newNode.type === 'file') {
                openFile(newNode);
            }
        } catch (e) {
            alert(e.message);
            loadTree();
        }
    },
    onNodeMove: (nodeId, newParentId) => {
        try {
            fileSystem.moveNode(nodeId, newParentId);
            loadTree();
        } catch (e) {
            alert(e.message);
            loadTree();
        }
    },
    onNodeRename: (nodeId, newName) => {
        try {
            fileSystem.updateNodeName(nodeId, newName);
            loadTree();
        } catch (e) {
            alert(e.message);
            loadTree();
        }
    },
    onNodeReorder: (nodeId, targetNodeId, position) => {
        try {
            if (position === 'root-append') {
                fileSystem.moveNode(nodeId, null);
            } else {
                fileSystem.reorderNode(nodeId, targetNodeId, position);
            }
            loadTree();
        } catch (e) {
            console.error(e);
            alert(e.message);
            loadTree();
        }
    }
});

function loadTree() {
    const nodes = fileSystem.getNodes();
    fileTree.render(nodes);

    if (activeFileId) {
        fileTree.setActiveNode(activeFileId);
    }
}

function openFile(node) {
    if (!node) {
        activeFileId = null;
        editor.setContent('');
        return;
    }
    activeFileId = node.id;
    const doc = fileSystem.getDocument(node.id);

    if (doc) {
        editor.setContent(doc.content);
        fileTree.setActiveNode(node.id);
    } else {
        console.error(`Document for node ${node.id} not found.`);
        editor.setContent('');
    }
}

function getActiveParentId() {
    if (fileTree.activeNodeId) {
        const activeNode = fileSystem.getNode(fileTree.activeNodeId);
        if (activeNode) {
            if (activeNode.type === 'folder') {
                return activeNode.id;
            } else {
                return activeNode.parent_id;
            }
        }
    }
    return null;
}

const $html = document.querySelector("html");
const $siteMenu = document.querySelector(".site-menu");

function alterTheme() {
    const mapTheme = {
        "terr": "terr-dark",
        "terr-dark": "light",
        "light": "dark",
        "dark": "terr",
    };
    const current = $html.classList.length > 0 ? $html.classList[0] : "light";
    const next = mapTheme[current] || "light";

    $html.classList.remove(current);
    $html.classList.add(next);
    localStorage.setItem("theme", next);
}

const savedTheme = localStorage.getItem("theme");
$html.classList.add(savedTheme || "light");


let activeSiteMenu = innerWidth >= 1920;
function toggleSiteMenu() {
    activeSiteMenu = !activeSiteMenu;
    updateMenuState();
}

function updateMenuState() {
    if (activeSiteMenu) {
        $siteMenu.classList.add("actived");
    } else {
        $siteMenu.classList.remove("actived");
    }
}

if ($siteMenu.classList.contains('actived')) {
    activeSiteMenu = true;
} else {
    activeSiteMenu = false;
}

document.getElementById('btn-add-file').addEventListener('click', () => {
    fileTree.startCreation('file', getActiveParentId());
});

document.getElementById('btn-add-folder').addEventListener('click', () => {
    fileTree.startCreation('folder', getActiveParentId());
});

document.getElementById('btn-sync').addEventListener('click', () => {
    alert('Sincronização simulada (Mock DB atualizado).');
});

document.getElementById('btn-add-separator').addEventListener('click', () => {
    try {
        fileSystem.createSeparator(getActiveParentId());
        loadTree();
    } catch (e) {
        alert(e.message);
    }
});

document.getElementById('btn-toggle-menu').addEventListener('click', toggleSiteMenu);
document.getElementById('btn-theme').addEventListener('click', alterTheme);

loadTree();
