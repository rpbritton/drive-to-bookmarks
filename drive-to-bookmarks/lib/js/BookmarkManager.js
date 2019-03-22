import BookmarkAPI from './BookmarkAPI.js'

export default class BookmarkManager {
    constructor(account) {
        this.account = account;
    }

    getAll() {
        return new Promise((resolve, reject) => {
            let treeRequests = [];
            for (let bookmarkId of this.account.sync.map.getFile('root')) {
                treeRequests.push(BookmarkAPI.get(bookmarkId));
            }

            Promise.all(treeRequests)
            .then(trees => {
                let bookmarks = new Map();

                let traverseBookmark = bookmark => {
                    bookmarks.set(bookmark.id, SimplifyBookmark(bookmark));

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

    create(fileId, details = {}) {
        return new Promise((resolve, reject) => {
            BookmarkAPI.create(ReadyBookmark(details))
            .then(bookmark => {
                this.account.sync.map.set(fileId, bookmark.id);

                resolve();
            });
        });
    }

    // update()
}

function SimplifyBookmark({title, dateAdded, parentId, index, id, dateGroupModified} = {}) {
    return {
        name: title,
        dateAdded,
        parentId,
        index,
        id,
        dateGroupModified
    };
}
function ReadyBookmark({name, url, index, parentId} = {}) {
    return {
        title: name,
        url,
        index,
        parentId
    };
}