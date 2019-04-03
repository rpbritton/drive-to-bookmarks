
import SyncMapManager from './SyncMapManager.js'

export default class SyncManager {
    constructor(account) {
        this.account = account;
        if (!this.account.get('map')) {
            this.account.set({'map': []});
        }
        this.map = new SyncMapManager(this.account.get('map'));
    }
    
    full() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.account.bookmarks.getAll(),
                this.account.files.getAll()
            ])
            .then(([bookmarks, files]) => {
                for (let bookmarkId of this.map.getFile(this.account.get('rootFolderId'))) {
                    bookmarks.delete(bookmarkId);
                }

                console.log(bookmarks);
                console.log(files);
                // console.log(this.map.getAllFiles());
                // console.log(this.map.getAllBookmarks());

                for (let fileId of this.map.getAllFiles()) {
                    if (files.has(fileId)) {
                        this.account.bookmarks.update(this.map.getFile(fileId), files.get(fileId));

                        files.delete(fileId);
                        for (let bookmarkId of this.map.getFile(fileId)) {
                            bookmarks.delete(bookmarkId);
                        }
                    }
                    else if (fileId != this.account.get('rootFolderId')) {
                        for (let bookmarkId of this.map.getFile(fileId)) {
                            this.account.bookmarks.remove(bookmarkId);
                        }
                        this.map.removeFile(fileId);
                    }
                }

                let createBookmark = (parentId, file) => {
                    return new Promise((resolve, reject) => {
                        console.log(parentId);
                        this.account.bookmarks.create({
                            title: file.name,
                            url: (file.url == 'application/vnd.google-apps.folder') ? null : file.url,
                            parentId: this.map.getFile(parentId)
                        })
                        .then(bookmark => {
                            this.map.set(fileId, bookmark.id);

                            resolve();
                        });
                    });
                }

                let createBookmarks = file => {
                    // if (files.size() == 0) {
                    //     return;
                    // }

                    if (!file) {
                        file = files.values().next().value;
                    }
                    files.delete(file.id);

                    if (!file.parents) {
                        return;
                    }

                    let bookmarksToMake = [];
                    for (let parentId of file.parents) {
                        bookmarksToMake.push(new Promise((resolve, reject) => {
                            if (this.map.hasFile(parentId)) {
                                createBookmark(parentId, file)
                                .then(() => {
                                    resolve();
                                });
                            }
                            else if (files.has(parentId)) {
                                createBookmark(files.get(parentId))
                                .then(() => {
                                    createBookmark(file)
                                    .then(() => {
                                        resolve()
                                    });
                                })
                            }
                            else {
                                resolve();
                            }
                        }));
                    }
                    Promise.all(bookmarksToMake)
                    .then(() => {
                        createBookmarks();
                    });
                }
                createBookmarks();

                for (let [bookmarkId, bookmark] of bookmarks) {
                    this.account.bookmarks.remove(bookmarkId);
                }
            });
        });
    }

    save() {
        this.account.set('map', this.map.save());
    }
}