export default class BookmarksAPI {
    constructor(account) {
        this.account = account;
    }

    create(bookmark) {
        let {parentId, url, title, index} = EncodeBookmark(bookmark);

        return new Promise((resolve, reject) => {
            chrome.bookmarks.create({parentId, url, title, index}, newBookmark => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    reject(Error(chrome.runtime.lastError));
                    return;
                }

                resolve(DecodeBookmark(newBookmark));
            });
        });
    }

    get(bookmarkId) {
        if (!bookmarkId) {
            return;
            // TODO: Maybe do this
            // bookmarkId = this.account.get('rootFileId');
        }

        return new Promise((resolve, reject) => {
            chrome.bookmarks.getSubTree(bookmarkId, tree => {
                let bookmarks = new Map();

                let traverseBookmark = bookmark => {
                    bookmarks.set(bookmark.id, DecodeBookmark(bookmark));

                    if (Array.isArray(bookmark.children)) {
                        for (let childBookmark of bookmark.children) {
                            traverseBookmark(childBookmark);
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

    remove(bookmarkId) {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.remove(bookmarkId, () => {
                resolve();
            });
        })
    }

    update(bookmark) {
        let {id, title, url, parentId, index} = EncodeBookmark(bookmark);
        if (!id) {
            return;
        }

        let promises = [];
        if (title || url) {
            promises.push(new Promise((resolve, reject) => {
                chrome.bookmarks.update(id, {title, url}, newBookmark => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        reject(Error(chrome.runtime.lastError));
                        return;
                    }

                    bookmark = newBookmark;
                    resolve();
                });
            }));
        }
        if (parentId || index) {
            promises.push(new Promise((resolve, reject) => {
                chrome.bookmarks.move(id, {parentId, index}, newBookmark => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        reject(Error(chrome.runtime.lastError));
                        return;
                    }

                    bookmark = newBookmark;
                    resolve();
                });
            }));
        }

        return Promise.all(promises)
        .then(() => {
            return Promise.resolve(DecodeBookmark(bookmark));
        });
    }
}

function DecodeBookmark(bookmark) {
    return {
        id: bookmark.id,
        isFolder: (!bookmark.url || bookmark.isFolder),
        url: bookmark.url,
        name: (bookmark.name) ? bookmark.name : bookmark.title,
        parent: bookmark.parentId
    }
}

function EncodeBookmark(bookmark) {
    return {
        id: bookmark.id,
        title: bookmark.name,
        url: (bookmark.isFolder) ? null : bookmark.url,
        parentId: bookmark.parentId +"",
        index: bookmark.index
    };
}