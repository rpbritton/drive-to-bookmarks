export default class BookmarkAPI {
    static create(options = {}) {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.create(options, bookmark => {
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