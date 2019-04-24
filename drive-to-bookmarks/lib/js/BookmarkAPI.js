export default class BookmarkAPI {
    static create({parentId, url, title, index} = {}) {
        parentId += "";

        return new Promise((resolve, reject) => {
            chrome.bookmarks.create({parentId, url, title, index}, bookmark => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    reject(Error(chrome.runtime.lastError));
                    return;
                }

                resolve(bookmark);
            });
        });
    }

    static get(bookmarkId) {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.getSubTree(bookmarkId, tree => {
                resolve(tree);
            });
        });
    }

    static update(bookmarkId, {parentId, url, title, index}) {
        parentId += "";

        return new Promise((resolve, reject) => {
            chrome.bookmarks.update(bookmarkId, {
                title: title,
                url: url
            }, bookmark => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    reject(Error(chrome.runtime.lastError));
                    return;
                }

                resolve(bookmark);
            });
        })
        .then(bookmark => {
            return new Promise((resolve, reject) => {
                chrome.bookmarks.move(bookmarkId, {
                    parentId: parentId,
                    index: index
                }, bookmark => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        reject(Error(chrome.runtime.lastError));
                        return;
                    }

                    resolve(bookmark);
                });
            });
        })
        .then(bookmark => {
            resolve(bookmark);
        });
    }

    static remove(bookmarkId) {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.remove(bookmarkId, () => {
                resolve();
            });
        })
    }

    // static getAll() {
    //     return new Promise((resolve, reject) => {

    //     });
    // }
}