import BookmarkAPI from './BookmarkAPI.js'
import {SimpleFile} from './FileManager.js'

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

    // create(file = new SimpleBookmark()) {
    //     return new Promise((resolve, reject) => {
    //         // BookmarkAPI.create({title: name, url, index, parentId})
    //         // .then(bookmark => {
    //         //     this.account.sync.map.set(fileId, bookmark.id);

    //         //     resolve();
    //         // });
    //     });
    // }

    update()
}

export class SimpleBookmark {
    constructor({
        name, id, url, isFolder, index, dateAdded, dateGroupModified
    } = {}) {
        this.name = name;
        this.id = id;
        this.url = url;
        this.isFolder = isFolder;
        this.index = index;
        this.dateAdded = dateAdded;
        this.dateGroupModified = dateGroupModified;
    }
}