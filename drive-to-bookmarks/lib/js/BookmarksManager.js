import BookmarksAPI from './BookmarksAPI.js'
import ListenableMap from './ListenableMap.js'
import BookmarkRegistryManager from './BookmarkRegistryManager.js';

export default class BookmarksManager extends ListenableMap {
    constructor(account) {
        super();

        this.account = account;
        this.registry = new BookmarkRegistryManager(account);
        // this.api = new BookmarksAPI(account);
    }

    // THIS SHOULD DEFINEITELY BE IN THE API | MAYBE OVERLOAD SET?
    create(bookmark) {
        return new Promise((resolve, reject) => {
            BookmarksAPI.create(EncodeBookmark(bookmark))
            .then(bookmark => {
                resolve(DecodeBookmark(bookmark));
            });
        });
    }

    /*
     * Fully populates the bookmark list based on the physically existing bookmarks.
     */
    refresh() {
        let rootFileId = this.account.get('rootFileId');
        let rootBookmarkIds = this.registry.files.get(rootFileId);
        if (!rootBookmarkIds) {
            // TODO: Remove all stored bookmarks
            super.clear();
            return Promise.resolve();
        }
        // TODO: Something better (support for multiple bookmarks?)
        let rootBookmarkId = rootBookmarkIds[0];

        // TODO: Move the API out (make it more abstracted);
        return BookmarksAPI.get(rootBookmarkId)
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

            return Promise.resolve();
        });
    }

    // THIS SHOULD DEFINEITELY BE IN THE API | MAYBE OVERLOAD DELETE TO NOTIFY REGISTRY??
    remove(bookmarkId) {
        // TODO: UPDATE THIS
        this.registry.bookmarks.delete(bookmarkId);

        return Promise.resolve(BookmarksAPI.remove(bookmarkId));
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
        // .then(() => {
        //     return this.sync();
        // });
    }

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
            
            if (file == null) {
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
                let basicBookmarkTemplate = EncodeBookmark(file);
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
                                url: file.url
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
                        return BookmarksAPI.update(bookmark.id, bookmark)
                        .then(newBookmark => {
                            return Promise.resolve(DecodeBookmark(newBookmark));
                        });
                    }
                    else {
                        return BookmarksAPI.create(bookmark)
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

        let updateFiles = () => {
            if (fileIds.size == 0) {
                return Promise.resolve();
            }

            return updateFile(fileIds.values().next().value)
            .then(() => {
                return updateFiles();
            });
        }
        return updateFiles();
        // SHOULD I DELETE EXCESS BOOKMARKS NOW?
    }
}

// TODO:: THIS STUFF SHOULD GO IN `BookmarksAPI.js`

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