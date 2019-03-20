export default class BookmarkManager {
    constructor(account) {
        this.account = account;
    }

    getAll() {
        return new Promise((resolve, reject) => {
            let trees = [];
            for (let bookmarkId of this.account.sync.map.getFile('root')) {
                trees.push(BookmarkAPI.get(bookmarkId));
            }

            Promise.all(trees)
            .then(trees => {
                let bookmarks = new Map();

                let traverseBookmark = bookmark => {
                    bookmarks.set(bookmark.id, {
                        parentId: bookmark.parentId,
                        index: bookmark.index,
                        url: bookmark.url,
                        title: bookmark.title,
                        dateAdded: bookmark.dateAdded,
                        dateGroupModified: bookmark.dateGroupModified
                    });

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
}