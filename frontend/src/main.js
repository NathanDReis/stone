import { FileSystemService } from './services/FileSystemService.js';
import { FileTree } from './ui/FileTree.js';
import { EditorController } from './ui/EditorController.js';
import { Toast } from './ui/Toast.js';
import { EmptyState } from './ui/EmptyState.js';
import { SearchController } from './ui/SearchController.js';
import { FileTreeContextMenu } from './ui/FileTreeContextMenu.js';
import { IconPickerModal } from './ui/IconPickerModal.js';
import { DocumentSettingsModal } from './ui/DocumentSettingsModal.js';
import { FolderSettingsModal } from './ui/FolderSettingsModal.js';
import { IconManager } from './services/IconManager.js';

const fileSystem = new FileSystemService();
const iconManager = new IconManager();
let activeFileId = null;

const menuElement = document.querySelector('.site-menu');
const emptyStateContainer = document.querySelector('.site-main .empty-state');
const editorContainer = document.querySelector('.site-main .editor');
const treeContainer = document.createElement('div');
treeContainer.id = 'file-tree-root';
menuElement.appendChild(treeContainer);

const emptyState = new EmptyState(emptyStateContainer);
const iconPicker = new IconPickerModal(iconManager);
const docSettingsModal = new DocumentSettingsModal(fileSystem);
const folderSettingsModal = new FolderSettingsModal(fileSystem);

const searchController = new SearchController(
    document.getElementById('search'),
    fileSystem,
    {
        onSelect: (node) => {
            openFile(node);
        },
        onFilter: (nodes) => {
            if (nodes) {
                const flatNodes = nodes.map(n => ({
                    ...n,
                    parent_id: null
                }));
                fileTree.render(flatNodes);
            } else {
                loadTree();
            }
        }
    }
);

const editor = new EditorController(editorContainer, {
    fileSystem: fileSystem,
    onNavigate: (node) => {
        openFile(node);
    },
    onTagClick: (tag) => {
        if (!searchController) return;

        if (tag) {
            searchController.filterByTag(tag);
        } else {
            searchController.clearFilter();
        }
    },
    onSave: (content) => {
        try {
            fileSystem.updateDocument(activeFileId, content);
        } catch (e) {
            Toast.error(`Erro ao salvar documento: ${e.message ?? e}`, 10000);
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
            Toast.error(e.message);
            loadTree();
        }
    },
    onNodeDelete: (nodeId) => {
        try {
            fileSystem.deleteNode(nodeId);
            if (editor.linkResolver) {
                editor.linkResolver.invalidateCache();
            }
            loadTree();
        } catch (e) {
            Toast.error(e.message);
        }
    }
});

const contextMenu = new FileTreeContextMenu(fileTree, {
    onDelete: (node) => {
        fileTree.dialog.show({
            title: "Excluir Item",
            message: `Tem certeza que deseja excluir "${node.name}"?`,
            confirmText: "Excluir",
            onConfirm: () => {
                try {
                    fileSystem.deleteNode(node.id);
                    if (editor.linkResolver) editor.linkResolver.invalidateCache();
                    loadTree();
                } catch (e) {
                    Toast.error(e.message);
                }
            }
        });
    },
    onRename: (node) => {
        fileTree.startRenaming(node.id);
    },
    onChangeIcon: (node) => {
        iconPicker.show((iconName) => {
            try {
                fileSystem.updateNodeIcon(node.id, iconName);
                loadTree();
            } catch (e) {
                Toast.error(e.message);
            }
        });
    },
    onPermissions: (node) => {
        folderSettingsModal.show(node.id);
    },
    onCreateSeparator: (parentId) => {
        try {
            fileSystem.createSeparator(parentId);
            loadTree();
        } catch (e) {
            Toast.error(e.message);
        }
    }
});

fileTree.contextMenu = contextMenu;

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
        fileSystem.currentOpenFileId = null;
        editor.setContent('');
        emptyState.show();
        editor.hide();
        return;
    }

    emptyState.hide();
    editor.show();
    activeFileId = node.id;
    fileSystem.currentOpenFileId = node.id;
    const doc = fileSystem.getDocument(node.id);

    if (!doc) return editor.setContent('');

    editor.setContent(doc.content);
    fileTree.setActiveNode(node.id);
}

function getActiveParentId() {
    if (!fileTree.activeNodeId) return null;

    const activeNode = fileSystem.getNode(fileTree.activeNodeId);
    if (!activeNode) return null;

    return activeNode.type === 'folder'
        ? activeNode.id
        : activeNode.parent_id;
}

import { ThemeManager } from './services/ThemeManager.js';
import { themes } from './services/themes.js';
import { ThemeModal } from './ui/ThemeModal.js';

const themeManager = new ThemeManager();
const themeModal = new ThemeModal(themeManager);

Object.values(themes).forEach(theme => themeManager.register(theme));

const startTheme = themeManager.loadWait();
themeManager.apply(startTheme);

function openThemeModal() {
    themeModal.show();
}

const btnReadMode = document.getElementById('btn-read-mode');
let isReadOnly = false;

function toggleReadMode() {
    isReadOnly = !isReadOnly;

    const icon = btnReadMode.querySelector('.material-symbols-outlined');
    if (isReadOnly) {
        btnReadMode.classList.add('is-active');
        icon.textContent = 'book';
        Toast.info('Modo de leitura ativado');
    } else {
        btnReadMode.classList.remove('is-active');
        icon.textContent = 'book_ribbon';
        Toast.info('Modo de edição ativado');
    }

    editor.setReadOnly(isReadOnly);
    fileTree.setReadOnly(isReadOnly);

    const creationButtons = [
        document.getElementById('btn-add-file'),
        document.getElementById('btn-add-folder'),
        document.getElementById('btn-add-separator'),
    ];

    creationButtons.forEach(btn => {
        if (btn) {
            btn.style.display = isReadOnly ? 'none' : '';
        }
    });

    const menuActions = document.querySelector('.site-menu-actions');
    if (menuActions) {
        if (isReadOnly) {
            menuActions.classList.add('is-read-only');
        } else {
            menuActions.classList.remove('is-read-only');
        }
    }
}

if (btnReadMode) {
    btnReadMode.addEventListener('click', toggleReadMode);
}

window.addEventListener('openDocumentSettings', (e) => {
    docSettingsModal.show(e.detail.docId);
});

window.addEventListener('documentMetadataUpdated', (e) => {
    editor.refreshMetadata();
});

document.getElementById('btn-add-file').addEventListener('click', () => {
    if (isReadOnly) return;
    fileTree.startCreation('file', getActiveParentId());
});

document.getElementById('btn-add-folder').addEventListener('click', () => {
    if (isReadOnly) return;
    fileTree.startCreation('folder', getActiveParentId());
});

const btnAddSeparator = document.getElementById('btn-add-separator');
if (btnAddSeparator) {
    btnAddSeparator.addEventListener('click', () => {
        if (isReadOnly) return;
        try {
            fileSystem.createSeparator(getActiveParentId());
            loadTree();
        } catch (e) {
            Toast.error(e.message);
        }
    });
}

document.getElementById('btn-theme').addEventListener('click', openThemeModal);

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
            Toast.warning(`Could not close window: ${err.message ?? err}`);
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

const $burgerMenu = document.querySelector("#btn-toggle-menu");
const $menu = document.querySelector(".site-menu");
$burgerMenu.onclick = () => toogleMenu();
function toogleMenu() {
    $menu.classList.toggle("actived");
}
