import { FileSystemService } from './services/FileSystemService.js';
import { FileTree } from './ui/FileTree.js';
import { EditorController } from './ui/EditorController.js';
import { Toast } from './ui/Toast.js';
import { EmptyState } from './ui/EmptyState.js';

const fileSystem = new FileSystemService();
let activeFileId = null;

const menuElement = document.querySelector('.site-menu');
const emptyStateContainer = document.querySelector('.site-main .empty-state');
const editorContainer = document.querySelector('.site-main .editor');
const treeContainer = document.createElement('div');
treeContainer.id = 'file-tree-root';
menuElement.appendChild(treeContainer);

const emptyState = new EmptyState(emptyStateContainer);

const editor = new EditorController(editorContainer, {
    fileSystem: fileSystem,
    onNavigate: (node) => {
        openFile(node);
    },
    onSave: (content) => {
        try {
            fileSystem.updateDocument(activeFileId, content);
        } catch (e) {
            console.error('Failed to save document:', e);
            Toast.error('Erro ao salvar documento', e);
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
            Toast.error(e.message);
            loadTree();
        }
    },
    onNodeMove: (nodeId, newParentId) => {
        try {
            fileSystem.moveNode(nodeId, newParentId);
            // Invalidate cache for this UUID in case path affects display
            if (editor.linkResolver) {
                editor.linkResolver.invalidateCache(nodeId);
            }
            loadTree();
        } catch (e) {
            Toast.error(e.message);
            loadTree();
        }
    },
    onNodeRename: (nodeId, newName) => {
        try {
            fileSystem.updateNodeName(nodeId, newName);
            // Invalidate cache for this UUID so link display names update
            if (editor.linkResolver) {
                editor.linkResolver.invalidateCache(nodeId);
            }
            loadTree();
        } catch (e) {
            Toast.error(e.message);
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
            Toast.error(e.message);
            loadTree();
        }
    },
    onNodeDelete: (nodeId) => {
        try {
            fileSystem.deleteNode(nodeId);
            // Clear entire cache so broken links become invalid
            if (editor.linkResolver) {
                editor.linkResolver.invalidateCache();
            }
            loadTree();
        } catch (e) {
            Toast.error(e.message);
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
    if (!node || node.type === 'folder') {
        activeFileId = null;
        editor.setContent('');
        emptyState.show();
        editor.hide();
        return;
    }

    emptyState.hide();
    editor.show();
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
    Toast.success('Sincronização realizada com sucesso!');
});

document.getElementById('btn-add-separator').addEventListener('click', () => {
    try {
        fileSystem.createSeparator(getActiveParentId());
        loadTree();
    } catch (e) {
        Toast.error(e.message);
    }
});

document.getElementById('btn-toggle-menu').addEventListener('click', toggleSiteMenu);
document.getElementById('btn-theme').addEventListener('click', alterTheme);

function handleClose() {
    if (activeFileId) {
        fileTree.setActiveNode(null);
        openFile(null);
    } else {
        try {
            window.close();
            setTimeout(() => {
                Toast.info('O navegador bloqueou o fechamento automático. Use Ctrl+W.');
            }, 100);
        } catch (err) {
            console.warn("Could not close window", err);
        }
    }
}

window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'n' || e.key === 'N' || e.code === 'KeyN')) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('btn-add-file').click();
        return;
    }
    if (e.altKey && (e.key === 'o' || e.key === 'O' || e.code === 'KeyO')) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('search').focus();
        return;
    }
}, true);

document.addEventListener('app-close', () => {
    handleClose();
});

loadTree();
openFile(null);
