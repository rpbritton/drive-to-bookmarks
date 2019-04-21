import BookmarkAPI from './BookmarkAPI.js'

export default class BookmarkManager {
    constructor(account) {
        this.account = account;
    }

    getAll() {
        return new Promise((resolve, reject) => {
            let rootFileId = this.account.get('rootFileId');
            let rootFile = this.account.sync.map.file.get(rootFileId);
            if (!rootFile || !rootFile.bookmarks) {
                resolve(new Map());
                return;
            }
            let rootBookmarkId = rootFile.bookmarks[0];

            BookmarkAPI.get(rootBookmarkId)
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

                resolve(bookmarks);
            });

            // let treeRequests = [];
            // for (let bookmarkId of this.account.sync.map.getFile(this.account.get('rootFileId'))) {
            //     treeRequests.push(BookmarkAPI.get(bookmarkId));
            // }

            // Promise.all(treeRequests)
            // .then(trees => {
            //     let bookmarks = new Map();

            //     let traverseBookmark = bookmark => {
            //         bookmarks.set(bookmark.id, DecodeBookmark(bookmark));

            //         if (bookmark.children) {
            //             for (let child of bookmark.children) {
            //                 traverseBookmark(child);
            //             }
            //         }
            //     }
            //     for (let tree of trees) {
            //         for (let bookmark of tree) {
            //             traverseBookmark(bookmark);
            //         }
            //     }

            //     resolve(bookmarks);
            // });
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

    update(node) {
        return new Promise((resolve, reject) => {
            let bookmark = EncodeBookmark(node);

            let parentIds = [];
            for (let parentFileId of node.parents) {
                let parentNode = this.account.sync.map.file.get(parentFileId);
                for (let parentBookmarkId of parentNode.folderBookmarks) {
                    parentIds.push(parentBookmarkId);
                }
            }

            while (node.linkBookmarks.length > parentIds.length) {
                BookmarkAPI.remove(node.linkBookmarks.pop());
                if (node.isFolder) {
                    BookmarkAPI.remove(node.folderBookmarks.pop());
                }
            }

            for (let index = 0; index < node.linkBookmarks.length; index++) {
                bookmark.parentId = parentIds[index];
                
                BookmarkAPI.update(node.linkBookmarks[index], bookmark);
                if (bookmark.isFolder) {
                    BookmarkAPI.update(node.folderBookmarks[index], {
                        ...bookmark,
                        isFolder: false,
                        parentId: node.linkBookmarks[index]
                    });
                }
            }

            if (node.linkBookmarks.length == parentIds.length) {
                resolve();
            }

            while (node.linkBookmarks.length < parentIds.length) {
                bookmark.parentId = parentIds[node.linkBookmarks.length];

                BookmarkAPI.create(bookmark)
                .then(rawBookmark => {
                    node.linkBookmarks.push(rawBookmark.id);

                    resolve();

                    if (bookmark.isFolder) {
                        BookmarkAPI.create({
                            ...bookmark,
                            isFolder: false,
                            parentId: rawBookmark.id
                        })
                        .then(rawFolderBookmark => {
                            node.folderBookmarks.push(rawFolderBookmark.id);
                        });
                    }
                });
            }
        });

            // if (bookmark.isFolder) {
            //     updateBookmark(node.folderBookmarks[index], bookmark);
            //     updateBookmark(node.linkBookmarks[index], {
            //         ...bookmark,
            //         isFolder: false,
            //         parentId: node.folderBookmarks[index]
            //     });
            // }
            // else {
            //     updateBookmark(node.linkBookmarks[index], bookmark);
            // }

        // let bookmarkIds = node.linkBookmarks;
        // let parentIds = [];
        // let bookmark = EncodeBookmark(node);

        // for (let parentId of node.parents) {
        //     let parentNode = this.account.sync.map.file.get(parentId);

        //     for (let parentBookmarkId of parentNode.folderBookmarks) {
        //         parentIds.push(parentBookmarkId);
        //     }
        // }

        // let offset = bookmarkIds.length - parentIds;

        // for (let index = 0; index < offset; index++) {
        //     BookmarkAPI.update(bookmark.id, bookmark);
        //     if (node.isFolder) {

        //     }
        // }

        // if (offset > 0) {

        // }
        // else if (offset < 0) {

        // }

        // return BookmarkAPI.update(bookmark.bookmarkId, EncodeBookmark(bookmark));
    }

    remove(bookmarkId) {
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