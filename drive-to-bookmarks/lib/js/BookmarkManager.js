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
        this.refresh();
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

    sync(fileIds) {
        // let fileIdsToUpdate = (Array.isArray(fileIds)) ? new Set(fileIds) : new Set([fileIds]);
        let fileIdsToUpdate = new Set(fileIds);

        let syncBookmark = fileId => {
            fileIdsToUpdate.delete(fileId);

            let file = this.sync.files.list.get(fileId);

            // Gather parent bookmarks (and update them if need be)
            let promisesOfParentBookmarkIds = [];
            for (let parentId of file.parents) {
                if (fileIdsToUpdate.has(parentId)) {
                    promisesOfParentBookmarkIds.push(
                        syncBookmark(parentId)
                        .then(() => {
                            return Promise.resolve(this.sync.map.files.get(parentId));
                        })
                    );
                }
                else {
                    promisesOfParentBookmarkIds.push(this.sync.map.files.get(parentId));
                }
            }

            return Promise.all(promisesOfParentBookmarkIds)
            .then(arraysOfParentBookmarkIds => {
                let parentBookmarkIds = arraysOfParentBookmarkIds.flat();
                for (let index in parentBookmarkIds) {
                    parentBookmarkIds.splice(index + 1, 1);
                }

                let bookmarkIds = this.sync.map.files.get(fileId);

                // Add a 'parent' for the root folder
                if (fileId == this.sync.account.get('rootFileId')) {
                    parentBookmarkIds.push(this.sync.account.get('rootBookmarkParentId'));
                    // parentBookmarkIds.push(1);
                }

                // Create list of faux-bookmarks to be created
                let basicBookmark = EncodeBookmark(file);
                let bookmarks = [];
                for (let parentBookmarkId of parentBookmarkIds) {
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
                                url: file.url
                            }
                        });
                    }
                    else {
                        bookmarks.push({
                            link: {
                                ...basicBookmark,
                                parentId: parentBookmarkId,
                                url: file.url
                            }
                        });
                    }
                }

                // Remove excess bookmarks in the file's name
                while (bookmarkIds.length > bookmarks.length) {
                    remove(bookmarkIds.pop());
                }

                // Assign the previous bookmark ids to the new bookmarks
                let tempBookmarkIds = [...bookmarkIds];
                for (let bookmark of bookmarks) {
                    // TODO: Is there pop for the front?
                    // Also, do I need to bound check?
                    if (!!bookmark.folder) {
                        bookmark.folder.id = tempBookmarkIds.slice(0, 1);
                    }
                    bookmark.link.id = tempBookmarkIds.slice(0, 1);
                }

                // Update bookmark if found, create it if not
                let checkBookmark = bookmark => {
                    if (this.list.has(bookmark.id)) {
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

                // Actually create/update the bookmarks
                let promises = [];
                for (let bookmark of bookmarks) {
                    if (!!bookmark.folder) {
                        promises.push(
                            checkBookmark(bookmark.folder)
                            .then(newFolderBookmark => {
                                bookmark.link.parentId = newFolderBookmark.id;
                                return Promise.all([newFolderBookmark, checkBookmark(bookmark.link)]);
                            })
                        );
                    }
                    else {
                        promises.push(checkBookmark(bookmark.link));
                    }
                }

                return Promise.all(promises);
            })
            .then(arraysOfBookmarks => {
                let bookmarks = arraysOfBookmarks.flat();

                for (let bookmark of bookmarks) {
                    this.sync.map.bookmarks.set(bookmark.id, fileId);
                }

                return Promise.resolve();
            });
        }

        let syncBookmarks = () => {
            if (fileIdsToUpdate.size == 0) {
                return Promise.resolve();
            }

            return syncBookmark(fileIdsToUpdate.values().next().value)
            .then(() => {
                return syncBookmarks();
            });
        }
        return syncBookmarks();
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