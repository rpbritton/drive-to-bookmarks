import BookmarkAPI from './BookmarkAPI.js'
// import BookmarkListManager from './BookmarkListManager.js';

export default class BookmarkManager extends Map {
    constructor(syncManager) {
        super();

        this.sync = syncManager;

        // this.list = new BookmarkListManager(account);
    }

    getAll() {
        return new Set([...super.keys()]);
    }

    start() {
        return this.refresh()
        .then(() => {
            return this.sync.fullBookmarkSync();
        });
    }

    refresh() {
        let rootFileId = this.sync.account.get('rootFileId');
        let rootBookmarkIds = this.sync.map.files.get(rootFileId);
        if (!rootBookmarkIds) {
            super.clear();
            return Promise.resolve();
        }
        let rootBookmarkId = rootBookmarkIds[0];

        return BookmarkAPI.get(rootBookmarkId)
        .then(tree => {
            let oldBookmarkIds = this.getAll();

            let traverseBookmark = bookmark => {
                oldBookmarkIds.delete(bookmark.id);

                super.set(bookmark.id, DecodeBookmark(bookmark));

                if (bookmark.children) {
                    for (let childBookmark of bookmark.children) {
                        traverseBookmark(childBookmark);
                    }
                }
            }
            for (let bookmark of tree) {
                traverseBookmark(bookmark);
            }

            for (let oldBookmarkId of oldBookmarkIds) {
                super.delete(oldBookmarkId);
            }

            console.log(this.list);

            return Promise.resolve();
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

    update(fileId) {
        let file = this.files.get(fileId);
        let bookmarkIds  = this.sync.map.files.get(fileId);

        // Gather parent bookmarks
        let parentBookmarkIds = [];
        for (let fileParentId of file.parents) {
            parentBookmarkIds = [...parentBookmarkIds, ...this.sync.map.files.get(fileParentId)];
        }
        if (fileId == this.sync.account.get('rootFileId')) {
            parentBookmarkIds.push(this.sync.account.get('rootBookmarkParentId'));
        }

        // Generate a list of what the bookmarks should be
        let basicBookmark = EncodeBookmark(file);
        let bookmarks = [];
        for (let parentBookmarkId of parentBookmarkIds) {
            let parentBookmark = this.get(parentBookmarkId);

            if (parentBookmark && parentBookmark.isFolder) {
                if (file.isFolder) {
                    bookmarks.push({
                        folder: {
                            ...basicBookmark,
                            parentId: parentBookmarkId,
                            url: null
                        },
                        link: {
                            ...basicBookmark,
                            parentId: null,
                        }
                    });
                }
                else {
                    bookmarks.push({
                        link: {
                            ...basicBookmark,
                            parentId: parentBookmarkId,
                        }
                    });
                }
            }
        }

        // Remove excess bookmarks
        while (bookmarkIds.length > bookmarks.length) {
            remove(bookmarkIds.pop());
        }

        // Assign the previous bookmark ids to the new bookmarks
        let tempBookmarkIds = [...bookmarkIds];
        for (let bookmark of bookmarks) {
            if (bookmark.folder) {
                bookmark.folder.id = tempBookmarkIds.splice(0, 1);
            }
            bookmark.link.id = tempBookmarkIds.splice(0, 1);
        }

        // Function that updates or creates the bookmark
        let checkBookmark = bookmark => {
            if (this.has(bookmark.id)) {
                return BookmarkAPI.update(bookmark.id, bookmark)
                .then(newBookmark => {
                    return Promise.resolve(DecodeBookmark(newBookmark));
                });
            }
            else {
                return BookmarkAPI.create(bookmark)
                .then(newBookmark => {
                    return Promise.resolve(DecodeBookmark(newBookmark));
                });
            }
        }

        // Create each bookmark
        let promisesOfBookmarks = [];
        for (let bookmark of bookmarks) {
            if (bookmark.folder) {
                promisesOfBookmarks.push(
                    checkBookmark(bookmark.folder)
                    .then(newFolderBookmark => {
                        bookmark.link.parentId = newFolderBookmark.id;
                        return Promise.all([newFolderBookmark, checkBookmark(bookmark.link)]);
                    })
                );
            }
            else {
                promisesOfBookmarks.push(checkBookmark(bookmark.link));
            }
        }

        return Promise.all(promises);
    }

    remove(bookmarkId) {
        // TODO: UPDATE THIS
        this.account.sync.map.bookmarks.delete(bookmarkId);

        return Promise.resolve(BookmarkAPI.remove(bookmarkId));
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
        url: (bookmark.isFolder) ? null : bookmark.url,
        parentId: bookmark.parentId,
        index: bookmark.index
    };
}