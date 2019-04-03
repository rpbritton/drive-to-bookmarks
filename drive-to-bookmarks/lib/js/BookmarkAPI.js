export default class BookmarkAPI {
    static create(details) {
        if (!details) {
            return;
        }

        return new Promise((resolve, reject) => {
            chrome.bookmarks.create(details, bookmark => {
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

    static update(bookmarkId, changes) {
        return Promise.all([
            new Promise((resolve, reject) => {
                chrome.bookmarks.update(bookmarkId, {
                    title: changes.title,
                    url: changes.url
                }, bookmark => {
                    resolve();
                });
            }),
            new Promise((resolve, reject) => {
                chrome.bookmarks.move(bookmarkId, {
                    parentId: changes.parentId,
                    index: changes.index
                }, bookmark => {
                    resolve();
                })
            })
        ]);
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