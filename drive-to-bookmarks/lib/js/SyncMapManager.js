export default class SyncMapManager {
    constructor(account) {
        this.account = account;

        if (!Array.isArray(this.account.get('nodes'))) {
            this.account.set('nodes', []);
        }
        this.nodes = this.account.get('nodes');

        this.file = new FileMap(this.nodes);
        this.bookmark = new BookmarkMap(this.nodes);
    }

    add(nodes) {
        if (!(nodes instanceof Map)) {
            if (nodes.id) {
                nodes = new Map([[nodes.id, nodes]]);
            }
            else {
                return;
            }
        }

        let nodesToCheck = new Map(nodes);

        let checkNode = node => {
            nodesToCheck.delete(node.id);

            if (!Array.isArray(node.parents)) {
                return;
            }

            for (let parentId of node.parents) {
                if (nodesToCheck.has(parentId)) {
                    checkNode(nodesToCheck.get(parentId));
                }

                if (!this.file.has(parentId) && parentId != this.account.get('rootFileId')) {
                    node.parents.splice(node.parents.indexOf(parentId), 1);
                }
            }

            if (node.parents.length > 0) {
                if (this.file.has(node.id)) {
                    update(this.file.get(node.id), node);
                }
                else {
                    this.nodes.push(node);
                    this.file.setNode(node);
                    this.bookmark.setNode(node);
                }
            }
        };

        for (let [nodeId, node] of nodesToCheck) {
            checkNode(node);
        }
    }

    remove(node) {
        if (this.nodes.includes(node)) {
            this.nodes.splice(this.nodes.indexOf(node), 1);
            this.file.deleteNode(node);
            this.bookmark.deleteNode(node);
        }
    }

    update(node, changes = {}) {
        Object.assign(node, changes);
    }

    getAll() {
        return this.nodes;
    }
}

class BetterMap extends Map {
    constructor() {
        super();
    }

    getAll() {
        return new Set([...super.keys()]);
    }
}

class FileMap extends BetterMap {
    constructor(nodes) {
        super();
        this.nodes = nodes;

        for (let node of this.nodes) {
            add(node);
        }
    }

    setNode(node) {
        super.set(node.id, node);
    }

    deleteNode(node) {
        super.delete(node.id);
    }

    set(fileId, node) {
        node.id = fileId;
        super.set(fileId, node);
    }

    delete(fileId) {
        super.delete(fileId);
    }
}

class BookmarkMap extends BetterMap {
    constructor(nodes) {
        super();
        this.nodes = nodes;

        for (let node of this.nodes) {
            add(node);
        }
    }

    setNode(node) {
        if (Array.isArray(node.linkBookmarks)) {
            for (let bookmarkId of node.linkBookmarks) {
                super.set(bookmarkId, node);
            }
        }

        if (node.isFolder && Array.isArray(node.folderBookmarks)) {
            for (let bookmarkId of node.folderBookmarks) {
                super.set(bookmarkId, node);
            }
        }
    }

    deleteNode(node) {
        for (let bookmarkId of node.linkBookmarks) {
            super.delete(bookmarkId);
        }

        if (node.isFolder) {
            for (let bookmarkId of node.folderBookmarkId) {
                super.delete(bookmarkId);
            }
        }
    }

    set(bookmarkId, node, isFolder = false) {
        super.set(bookmarkId, node);
        if (isFolder) {
            if (!Array.isArray(node.folderBookmarks)) {
                node.folderBookmarks = [];
            }

            if (!node.folderBookmarks.includes(bookmarkId)) {
                node.folderBookmarks.push(bookmarkId);
            }
        }
        else {
            if (!Array.isArray(node.linkBookmarks)) {
                node.linkBookmarks = [];
            }

            if (!node.linkBookmarks.includes(bookmarkId)) {
                node.linkBookmarks.push(bookmarkId);
            }
        }
    }

    delete(bookmarkId) {
        if (super.has(bookmarkId)) {
            let node = super.get(bookmarkId);

            if (!node.linkBookmarks.includes(bookmarkId)) {
                node.linkBookmarks.splice(node.linkBookmarks.indexOf(bookmarkId), 1);
            }
            else if (node.isFolder && !node.folderBookmarks.includes(bookmarkId)) {
                node.folderBookmarks.splice(node.folderBookmarks.indexOf(bookmarkId, 1));
            }

            super.delete(bookmarkId);
        }
    }
}