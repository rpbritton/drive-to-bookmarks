import BookmarkAPI from './BookmarkAPI.js'
import BookmarkListManager from './BookmarkListManager.js';

export default class BookmarkManager {
    constructor(account) {
        this.account = account;

        this.list = new BookmarkListManager(account);
    }

    start() {
        // this.refresh();
    }

    refresh() {
        let rootFileId = this.account.get('rootFileId');
        let rootFile = this.account.sync.map.file.get(rootFileId);
        if (!rootFile || !rootFile.bookmarks) {
            resolve(new Map());
            return;
        }
        let rootBookmarkId = rootFile.bookmarks[0];

        return BookmarkAPI.get(rootBookmarkId)
        .then(tree => {
            let bookmarks = new Map();

            let traverseBookmark = bookmark => {
                bookmarks.set(bookmark.id, DecodeBookmark(bookmark));

                if (bookmark.children) {
                    for (let child of bookmark.children) {
                        traverseBookmark(child);
                    }
                }
            }
            for (let bookmark of tree) {
                traverseBookmark(bookmark);
            }

            return Promise.resolve(bookmarks);
        });
    }

    create(bookmark) {
        return new Promise((resolve, reject) => {
            BookmarkAPI.create(EncodeBookmark(bookmark))
            .then(bookmark => {
                resolve(DecodeBookmark(bookmark));
            });
        });
    }

    update(nodes) {
        let nodesToUpdate = (Array.isArray(nodes)) ? new Set(nodes) : new Set([nodes]);

        let updateBookmark = node => {
            nodesToUpdate.delete(node);

            let promisesOfParentBookmarkIds = [];

            for (let parentId of node.parents) {
                let parentNode = this.account.sync.map.file.get(parentId);

                if (nodesToUpdate.has(parentNode)) {
                    promisesOfParentBookmarkIds.push(
                        updateBookmark(parentNode)
                        .then(() => {
                            return Promise.resolve(parentNode.folderBookmarks);
                        })
                    );
                }
                else {
                    promisesOfParentBookmarkIds.push(parentNode.folderBookmarks);
                }
            }

            return Promise.all(promisesOfParentBookmarkIds)
            .then(arraysOfParentBookmarkIds => {
                let bookmark = EncodeBookmark({...node, isFolder: false});
                let parentBookmarkIds = arraysOfParentBookmarkIds.flat();
                let promises = [];

                if (node.id == this.account.get('rootFileId')) {
                    // parentBookmarkIds.push(this.account.get('rootBookmarkParentId'));
                    parentBookmarkIds.push(1);
                }

                if (!Array.isArray(node.linkBookmarks)) {
                    node.linkBookmarks = [];
                }
                if (node.isFolder && !Array.isArray(node.folderBookmarks)) {
                    node.folderBookmarks = [];
                }

                while (node.linkBookmarks.length > parentBookmarkIds.length) {
                    remove(node.linkBookmarks.pop());
                    if (node.isFolder) {
                        remove(node.folderBookmarks.pop());
                    }
                }

                for (let index = 0; index < node.linkBookmarks; index++) {
                    // Catch update errors just by removing the bookmarks from the index
                    // Problem: Need to smoothly transition down
                    // Maybe parse array for nulls?

                    // Make sure bookmarks are here!!

                    if (node.isFolder) {
                        promises.push(Promise.all([
                            BookmarkAPI.update(node.folderBookmarks[index], {
                                ...bookmark, 
                                parentId: parentBookmarkIds[index],
                                url: null
                            }),
                            BookmarkAPI.update(node.linkBookmarks[index], {
                                ...bookmark,
                                parentId: node.folderBookmarks[index]
                            })
                        ]));
                    }
                    else {
                        promises.push(BookmarkAPI.update(node.linkBookmarks[index], {
                            ...bookmark,
                            parentId: parentBookmarkIds[index]
                        }));
                    }
                }

                for (let index = node.linkBookmarks.length; index < parentBookmarkIds.length; index++) {
                    if (node.isFolder) {
                        promises.push(BookmarkAPI.create({
                            ...bookmark,
                            parentId: parentBookmarkIds[index],
                            url: null
                        })
                        .then(folderBookmark => {
                            this.account.sync.map.bookmark.set(folderBookmark.id, node, true);

                            return BookmarkAPI.create({
                                ...bookmark,
                                parentId: node.folderBookmarks[index]
                            })
                            .then(linkBookmark => {
                                this.account.sync.map.bookmark.set(linkBookmark.id, node);

                                return Promise.resolve();
                            });
                        }));
                    }
                    else {
                        promises.push(BookmarkAPI.create({
                            ...bookmark,
                            parentId: parentBookmarkIds[index]
                        })
                        .then(bookmark => {
                            this.account.sync.map.bookmark.set(bookmark.id, node);
                        }));
                    }
                }

                return Promise.all(promises);
            });
        }

        let updateBookmarks = () => {
            if (nodesToUpdate.size == 0) {
                return Promise.resolve();
            }

            return updateBookmark(nodesToUpdate.values().next().value)
            .then(() => {
                return updateBookmarks();
            });
        }
        return updateBookmarks();
    }

    remove(bookmarkId) {
        this.account.sync.map.bookmark.delete(bookmarkId);

        return BookmarkAPI.remove(bookmarkId);
    }
}

function DecodeBookmark(bookmark) {
    let children = [];
    if (bookmark.children) {
        for (let child of bookmark.children) {
            if (typeof child == 'object') {
                if (child.id) {
                    children.push(child.id);
                }
            }
            else {
                children.push(child);
            }
        }
    }

    return {
        id: bookmark.id,
        isFolder: (!bookmark.url || bookmark.isFolder),
        url: bookmark.url,
        name: (bookmark.name) ? bookmark.name : bookmark.title,
        parent: bookmark.parentId,
        children: children
    }
}

function EncodeBookmark(bookmark) {
    return {
        id: bookmark.id,
        title: bookmark.name,
        url: (!bookmark.isFolder) ? bookmark.url : null,
        parentId: bookmark.parentId,
        index: bookmark.index
    };
}