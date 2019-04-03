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
                    bookmarks.set(bookmark.id, bookmark);

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

    create({title, url, parentId, index} = {}) {
        return new Promise((resolve, reject) => {
            BookmarkAPI.create({title, url, parentId, index})
            .then(bookmark => {
                resolve(bookmark);
            });
        });
    }

    update(bookmarkId, {title, url, parentId, index} = {}) {
        return BookmarkAPI.update(bookmarkId, {title, url, parentId, index});
    }

    remove(bookmarkId) {
        return BookmarkAPI.remove(bookmarkId);
    }
}

// function SimplifyBookmark({title, dateAdded, parentId, index, id, dateGroupModified} = {}) {
//     return {
//         name: title,
//         dateAdded,
//         parentId,
//         index,
//         id,
//         dateGroupModified
//     };
// }
// function ReadyBookmark({name, url, index, parentId} = {}) {
//     return {
//         title: name,
//         url,
//         index,
//         parentId
//     };
// }