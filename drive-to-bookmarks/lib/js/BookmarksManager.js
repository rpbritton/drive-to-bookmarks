import BookmarksAPI from './BookmarksAPI.js'
import ListenableMap from './ListenableMap.js'
import BookmarkRegistryManager from './BookmarkRegistryManager.js';

export default class BookmarksManager extends ListenableMap {
    constructor(account) {
        super();

        this.account = account;
        this.registry = new BookmarkRegistryManager(account);
        this.api = new BookmarksAPI(account);
    }

    /*
     * Fully populates the bookmark list based on the physically existing bookmarks.
     */
    refresh() {
        return new Promise((resolve, reject) => {
            let rootFileId = this.account.get('rootFileId');
            let rootBookmarkIds = this.registry.files.get(rootFileId);
            if (!rootBookmarkIds) {
                // TODO: Remove all stored bookmarks
                super.clear();
                resolve();
            }
            // TODO: Something better (support for multiple bookmarks?)
            let rootBookmarkId = rootBookmarkIds[0];

            this.api.get(rootBookmarkId)
            .then(bookmarks => {
                let oldBookmarkIds = this.getAll();

                for (let [bookmarkId, bookmark] of bookmarks) {
                    oldBookmarkIds.delete(bookmarkId);

                    super.set(bookmarkId, bookmark);
                }

                for (let oldBookmarkId of oldBookmarkIds) {
                    super.delete(oldBookmarkId);
                }

                resolve();
            });
        });
    }

    /*
     * Save information to the account storage in preparation
     * of saving to account info to `chrome.storage.local`.
     */
    save() {
        this.registry.save();
    }

    /*
     * Start by populating the bookmark list.
     */
    start() {
        return this.refresh();
        // TODO: Create listeners here?
    }

    /*
     * Update all the given files (by id). If none are given, resync the list.
     */
    update(fileIds) {
        if (fileIds == null) {
            fileIds = new Set([...this.registry.files.getAll(), ...this.account.files.getAll()]);
        }
        else if (typeof fileIds[Symbol.iterator] === 'function') {
            fileIds = new Set(fileIds);
        }
        else {
            fileIds = new Set([fileIds]);
        }

        let updateFile = fileId => {
            fileIds.delete(fileId);

            let file = this.account.files.get(fileId);
            
            if (!file) {
                // TODO: Is this the right place?
                this.registry.files.delete(fileId);
                return;
            }

            let promisesOfParentBookmarkIds = [];
            for (let parentId of file.parents) {
                if (fileIds.has(parentId)) {
                    promisesOfParentBookmarkIds.push(
                        updateFile(parentId)
                        .then(() => {
                            this.registry.files.get(parentId);
                        })
                    );
                }
                else {
                    promisesOfParentBookmarkIds.push(this.registry.files.get(parentId));
                }
            }

            return Promise.all(promisesOfParentBookmarkIds)
            .then(arrayOfParentBookmarkIds => {
                let parentBookmarkIds = arrayOfParentBookmarkIds.flat();

                let bookmarkIds = this.registry.files.get(fileId);
                if (!Array.isArray(bookmarkIds)) {
                    bookmarkIds = [];
                }

                let bookmarks = [];
                let basicBookmarkTemplate = Object.assign({}, file);
                let addBookmarkTemplate = parentBookmarkId => {
                    if (file.isFolder) {
                        bookmarks.push({
                            folder: {
                                ...basicBookmarkTemplate,
                                parentId: parentBookmarkId
                            },
                            link: {
                                ...basicBookmarkTemplate,
                                parentId: null,
                                isFolder: false
                            }
                        });
                    }
                    else {
                        bookmarks.push({
                            link: {
                                ...basicBookmarkTemplate,
                                parentId: parentBookmarkId
                            }
                        });
                    }
                }

                if (fileId == this.account.get('rootFileId')) {
                    addBookmarkTemplate(this.account.get('rootBookmarkParentId'));
                }
                for (let parentBookmarkId of parentBookmarkIds) {
                    if (this.has(parentBookmarkId) && this.get(parentBookmarkId).isFolder) {
                        addBookmarkTemplate(parentBookmarkId);
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
                        bookmark.folder.id = tempBookmarkIds.shift();
                    }
                    bookmark.link.id = tempBookmarkIds.shift();
                }

                // Function that updates or creates the bookmark
                let updateBookmark = bookmark => {
                    if (this.has(bookmark.id)) {
                        return this.api.update(bookmark.id, bookmark)
                        .then(newBookmark => {
                            return Promise.resolve(newBookmark);
                        });
                    }
                    else {
                        return this.api.create(bookmark)
                        .then(newBookmark => {
                            return Promise.resolve(newBookmark);
                        });
                    }
                }

                // Create each bookmark
                let promisesOfBookmarks = [];
                for (let bookmark of bookmarks) {
                    if (bookmark.folder) {
                        promisesOfBookmarks.push(
                            updateBookmark(bookmark.folder)
                            .then(newFolderBookmark => {
                                bookmark.link.parentId = newFolderBookmark.id;
                                return Promise.all([newFolderBookmark, updateBookmark(bookmark.link)]);
                            })
                        );
                    }
                    else {
                        promisesOfBookmarks.push(updateBookmark(bookmark.link));
                    }
                }

                return Promise.all(promisesOfBookmarks);
                // return this.update(fileId);
            })
            .then(arraysOfBookmarks => {
                let bookmarks = arraysOfBookmarks.flat();

                for (let bookmark of bookmarks) {
                    this.registry.bookmarks.set(bookmark.id, fileId);
                    // TODO: Make adding nicer
                    this.set(bookmark.id, bookmark);
                }

                return Promise.resolve();
            });
        }

        return new Promise((resolve, reject) => {
            let updateFiles = () => {
                if (fileIds.size > 0) {
                    updateFile(fileIds.values().next().value)
                    .then(() => {
                        updateFiles();
                    });
                }
                else {
                    resolve();
                }
            }
            updateFiles();
        });

        // SHOULD I DELETE EXCESS BOOKMARKS NOW?
    }
}