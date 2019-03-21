export default class BookmarkAPI {
    static create(details = {}) {
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

    // static getAll() {
    //     return new Promise((resolve, reject) => {

    //     });
    // }
}