import BookmarkAPI from './BookmarkAPI.js'

export default class BookmarkManager {
    constructor(account) {
        this.account = account;
    }

    getAll() {
        return new Promise((resolve, reject) => {
            let treeRequests = [];
            for (let bookmarkId of this.account.sync.map.getFile(this.account.get('rootFolderId'))) {
                treeRequests.push(BookmarkAPI.get(bookmarkId));
            }

            Promise.all(treeRequests)
            .then(trees => {
                let bookmarks = new Map();

                let traverseBookmark = bookmark => {
                    bookmarks.set(bookmark.id, DecodeBookmark(bookmark));

                    if (bookmark.children) {
                        for (let child of bookmark.children) {
                            traverseBookmark(child);
                        }
                    }
                }
                for (let tree of trees) {
                    for (let bookmark of tree) {
                        traverseBookmark(bookmark);
                    }
                }

                resolve(bookmarks);
            });
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

    update(bookmark) {
        return BookmarkAPI.update(bookmark.bookmarkId, EncodeBookmark(bookmark));
    }

    remove(bookmarkId) {
        return BookmarkAPI.remove(bookmarkId);
    }
}

function DecodeBookmark(bookmark) {
    return {
        bookmarkId: bookmark.id,
        isFolder: (!bookmark.url),
        url: bookmark.url,
        name: bookmark.title,
        bookmarkParentId: bookmark.parentId
    }
}

function EncodeBookmark(bookmark) {
    return {
        title: bookmark.name,
        url: (bookmark.isFolder) ? null : bookmark.url,
        parentId: bookmark.bookmarkParentId,
        index: bookmark.index
    };
}