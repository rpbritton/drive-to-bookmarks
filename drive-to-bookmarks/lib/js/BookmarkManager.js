import BookmarkAPI from './BookmarkAPI.js'
import BookmarkListManager from './BookmarkListManager.js';

export default class BookmarkManager {
    constructor(account) {
        this.account = account;

        this.list = new BookmarkListManager(account);
    }

    start() {
        this.refresh();
    }

    refresh() {
        let rootFileId = this.account.get('rootFileId');
        let rootBookmarks = this.account.sync.list.files.get(rootFileId);
        if (!rootBookmarks) {
            this.list.clear();
            return Promise.resolve();
        }
        let rootBookmarkId = rootBookmarks[0];

        return BookmarkAPI.get(rootBookmarkId)
        .then(tree => {
            let oldBookmarkIds = this.list.getAll();

            let traverseBookmark = bookmark => {
                if (oldBookmarkIds.has(bookmark.id)) {
                    oldBookmarkIds.delete(bookmark.id);
                }
                this.list.set(bookmark.id, DecodeBookmark(bookmark));

                if (bookmark.children) {
                    for (let child of bookmark.children) {
                        traverseBookmark(child);
                    }
                }
            }
            for (let bookmark of tree) {
                traverseBookmark(bookmark);
            }

            for (let oldBookmarkId of oldBookmarkIds) {
                this.list.delete(oldBookmarkId);
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
        let fileIdsToUpdate = fileIds;

        let syncBookmark = fileId => {
            fileIdsToUpdate.delete(fileId);

            let file = this.account.files.list.get(fileId);


            // Gather parent bookmarks (and update them if need be)
            let promisesOfParentBookmarkIds = [];
            for (let parentId of file.parents) {
                if (fileIdsToUpdate.has(parentId)) {
                    promisesOfParentBookmarkIds.push(
                        syncBookmark(parentId)
                        .then(() => {
                            return Promise.resolve(this.account.sync.list.files.get(parentId));
                        })
                    );
                }
                else {
                    promisesOfParentBookmarkIds.push(this.account.sync.list.files.get(parentId));
                }
            }

            return Promise.all(promisesOfParentBookmarkIds)
            .then(arraysOfParentBookmarkIds => {
                let parentBookmarkIds = arraysOfParentBookmarkIds.flat();
                let bookmarkIds = this.account.sync.list.files.get(fileId);

                // Add a 'parent' for the root folder
                if (fileId == this.account.get('rootFileId')) {
                    parentBookmarkIds.push(this.account.get('rootBookmarkParentId'));
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

                console.log(bookmarks);

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
                // Add bookmarks to sync and list I guess

                let bookmarks = arraysOfBookmarks.flat();

                for (let bookmark of bookmarks) {
                    console.log("HERE");
                    this.account.sync.list.bookmarks.set(bookmark.id, fileId);
                }

                console.log(this.account.sync.list.files.get(this.account.get('rootFileId')));

                console.log(bookmarks);
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
        this.account.sync.list.bookmarks.delete(bookmarkId);

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