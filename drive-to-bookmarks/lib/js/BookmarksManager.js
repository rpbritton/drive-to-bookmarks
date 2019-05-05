import BookmarksAPI from './BookmarksAPI.js'
import ListenableMap from './ListenableMap.js'

export default class BookmarksManager extends ListenableMap {
    constructor(account) {
        super();

        this.account = account;
        this.registry = account.registry;
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

    refresh() {
        let rootFileId = this.account.get('rootFileId');
        let rootBookmarkIds = this.registry.files.get(rootFileId);
        if (!rootBookmarkIds) {
            super.clear();
            return Promise.resolve();
        }
        // MAYBE DO SOMETHING A WEEEE BIT MORE FANCY??????? ANGRY BOI.
        // ^^^^^ MORE LIKE UNFOCUSED JEEEEZ
        let rootBookmarkId = rootBookmarkIds[0];

        // YA BOI MOVE TO THE API FILE FOR EASY VICTORY ROYAS
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

            console.log(this);

            return Promise.resolve();
        });
    }

    // THIS SHOULD DEFINEITELY BE IN THE API | MAYBE OVERLOAD DELETE TO NOTIFY REGISTRY??
    remove(bookmarkId) {
        // TODO: UPDATE THIS
        this.registry.bookmarks.delete(bookmarkId);

        return Promise.resolve(BookmarksAPI.remove(bookmarkId));
    }

    start() {
        return this.refresh()
        .then(() => {
            return this.sync();
        });
    }

    sync(fileIdsToUpdate) {
        if (!fileIdsToUpdate) {
            fileIdsToUpdate = this.registry.files.getAll();
        }
        else if (Array.isArray(fileIdsToUpdate)) {
            fileIdsToUpdate = new Set(fileIdsToUpdate);
        }
        else {
            fileIdsToUpdate = new Set([fileIdsToUpdate]);
        }

        let syncBookmark = fileId => {
            fileIdsToUpdate.delete(fileId);

            let file = this.account.files.get(fileId);
            
            if (!file) {
                return;
            }

            let promisesOfParentUpdates = [];
            for (let parentId of file.parents) {
                if (fileIdsToUpdate.has(parentId)) {
                    promisesOfParentUpdates.push(syncBookmark(parentId));
                }
            }

            return Promise.all(promisesOfParentUpdates)
            .then(() => {
                return this.update(fileId);
            })
            .then(arraysOfBookmarks => {
                let bookmarks = arraysOfBookmarks.flat();

                for (let bookmark of bookmarks) {
                    this.map.bookmarks.set(bookmark.id, fileId);
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
        // SHOULD I DELETE EXCESS BOOKMARKS NOW?
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