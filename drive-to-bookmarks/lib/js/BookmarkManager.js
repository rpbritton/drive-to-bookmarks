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

            resolve();
        });
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