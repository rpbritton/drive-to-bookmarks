import OAuth from './OAuth.js'
import AccountManager from './AccountManager.js'
import BookmarkAPI from './BookmarkAPI.js'
import FileMapAPI from './FileMapAPI.js'

export default class Account {
    constructor(info = {}) {
        // TODO: Add default settings
        this._info = {
            profile: null,
            id: null,
            map: []
        }
        Object.assign(this._info, info);
        this.map = new FileMapAPI(this._info.map);
    }

    static add() {
        return new Promise((resolve, reject) => {
            let account = new this();

            OAuth.getNewToken(account, {
                interactive: true,
                updateAccount: false
            })
            .then(oauth => {
                account.set({
                    oauth: oauth
                }, false);

                return account.getNewProfile(false);
            })
            .then(profile => {
                account.set({
                    profile: profile,
                    id: profile.id
                }, false);

                return BookmarkAPI.create({
                    // 'parentId: ' TODO: Add default place
                    // TODO: Add default name
                    'title': `DriveToBookmarks - ${account.get('profile').email}`
                });
            })
            .then(bookmark => {
                account.map.set('root', bookmark.id);

                AccountManager.add(account);

                resolve(account);
            });
        });
    }

    get(keys) {
        if (keys && keys.constructor === Array) {
            let result = {};

            for (let key in keys) {
                result[key] = this._info[key];
            }

            return result;
        }
        else {
            return this._info[keys];
        }
    }

    getAll() {
        return this._info;
    }

    set(newInfo, notifyUpdate = true) {
        Object.assign(this._info, newInfo);

        if (notifyUpdate) {
            AccountManager.refresh(this);
        }
    }

    getNewProfile(updateAccount = true) {
        return new Promise((resolve, reject) => {
            OAuth.get(this, 'profile')
            .then(profile => {
                if (updateAccount) {
                    this.set({
                        profile: profile
                    });
                }

                resolve(profile);
            })
            .catch(e => {
                console.error(e);
                reject(Error('Could not get new profile.'));
            })
        });
    }

    remove() {
        return new Promise((resolve, reject) => {
            // OAuth.get(this, 'remove');

            AccountManager.remove(this);
        });
    }

    getAllBookmarks() {
        return new Promise((resolve, reject) => {
            let trees = [];
            for (let bookmarkId of this.map.getFile('root')) {
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

    getAllFiles() {
        return new Promise((resolve, reject) => {
            OAuth.get(this, 'cloud', this.urls.cloud.files)
            .then(result => {
                let files = new Map();

                for (let file of result.files) {
                    files.set(file.id, {
                        name: file.name,
                        parents: file.parents,
                        url: file.webViewLink,
                        type: file.mimeType
                    });
                }

                resolve(files);
            });
        });
    }

    fullSync() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.getAllBookmarks(),
                this.getAllFiles()
            ])
            .then(([bookmarks, files]) => {
                for (let bookmarkId of this.map.getFile('root')) {
                    bookmarks.delete(bookmarkId);
                }

                console.log(bookmarks);
                console.log(files);
                console.log(this.map.getAllFiles());
                console.log(this.map.getAllBookmarks());

                for (let fileId of this.map.getAllFiles()) {
                    if (files.has(fileId)) {
                        // updateBookmark(fileId, files.get(fileId));

                        files.delete(fileId);
                        for (let bookmarkId of this.map.getFile(fileId)) {
                            bookmarks.delete(bookmarkId);
                        }
                    }
                    else if (fileId != 'root') {
                        for (let bookmarkId of this.map.getFile(fileId)) {
                            BookmarkAPI.remove(bookmarkId);
                        }
                        this.map.removeFile(fileId);
                    }
                }

                let addBookmarks = []
                for (let [fileId, file] of files) {
                    if (file.parents) {
                        for (let fileParentId of file.parents) {
                            addBookmarks.push(BookmarkAPI.create({
                                parentId: this.map.getFile(fileParentId),
                                url: (file.url == 'application/vnd.google-apps.folder') ? null : file.url,
                                title: file.name
                            })
                            .then(bookmark => {
                                this.map.set(fileId, bookmark.id);

                                console.log('added');

                                return Promise.resolve();
                            }));
                        }
                    }
                }
                Promise.all(addBookmarks)
                .then(result => {
                    // Save
                    // Reorganize

                    console.log(this.map);
                    AccountManager.refresh(this);
                });

                for (let [bookmarkId, bookmark] of bookmarks) {
                    // BookmarkAPI.remove(bookmarkId);
                }
            });
        });
    }

    // createBookmark(fileId, file) {
    //     return BookmarkAPI.create({
    //         parentId: this.map.getFile(file.parents[0]),
    //         url: (properties.mimeType == "application/vnd.google-apps.folder") ? null : properties.url,
    //         title: properties.name
    //     });
    // }

    // updateBookmark(fileId, details) {
    //     // return BookmarkAPI.move({

    //     // })
    //     // .then()
    // }

    save() {
        this._info.map = this.map.save();
    }
};