import OAuth from './OAuth.js'
import AccountManager from './AccountManager.js'
import BookmarkAPI from './BookmarkAPI.js'

export default class Account {
    constructor(info = {}) {
        // TODO: Add default settings
        this._info = info;
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
                    id: profile.id,
                    map: {
                        file: {},
                        bookmark: {}
                    }
                }, false);

                return BookmarkAPI.create({
                    // 'parentId: ' TODO: Add default place
                    // TODO: Add default name
                    'title': `DriveToBookmarks - ${account.get('profile').email}`
                });
            })
            .then(bookmark => {
                account.mapSet({fileId: 'root', bookmarkId: bookmark.id}, false);

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
            BookmarkAPI.get(this.mapGet({
                fileId: 'root'
            }))
            .then(tree => {
                let bookmarks = {};

                let traverseBookmark = bookmark => {
                    bookmarks[bookmark.id] = {
                        parentId: bookmark.parentId,
                        index: bookmark.index,
                        url: bookmark.url,
                        title: bookmark.title,
                        dateAdded: bookmark.dateAdded,
                        dateGroupModified: bookmark.dateGroupModified
                    };

                    if (bookmark.children) {
                        for (let child of bookmark.children) {
                            traverseBookmark(child);
                        }
                    }
                }
                for (let bookmark of tree) {
                    traverseBookmark(bookmark);
                }
                
                resolve(bookmarks);
            });
        });
    }

    getAllFiles() {
        return new Promise((resolve, reject) => {
            OAuth.get(this, 'cloud', this.urls.cloud.files)
            .then(result => {
                let files = {}

                for (let file of result.files) {
                    files[file.id] = {
                        name: file.name,
                        parents: file.parents,
                        webViewLink: file.webViewLink
                    };
                }

                resolve(files);
            });
        });
    }

    fullSync() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.getAllBookmarks(),
                this.getAllFiles(),
                this.get('map')
            ])
            .then(([bookmarks, files, map]) => {
                console.log(bookmarks);
                console.log(files);
                console.log(map);

                // for (let fileId in map.file) {
                //     if (files.hasOwnProperty(fileId)) {

                //     }
                //     else {
                //         this.mapSet({fileId: fileId}, false);
                //     }
                // }

                // 1. Check map
                //  a. Theoretically there should be no duplicates
                // 2. Check left over bookmarks
                // 3. Check left over files

                // for (let bookmark in bookmarks) {
                    
                // }
            });
        });
    }

    // getFolderTree() {
    //     return new Promise((resolve, reject) => {
    //         OAuth.get(this, 'cloud', this.urls.cloud.folders)
    //         .then(result => {
    //             resolve(result);
    //         });
    //     });
    // }
    // getCloudTree();
    // getBookmarkTree();

    mapGet({fileId, bookmarkId} = {}) {
        let map = this.get('map');

        if (fileId) {
            return map.file[fileId];
        }
        if (bookmarkId) {
            return map.bookmark[bookmarkId];
        }
    }

    mapSet({fileId, bookmarkId} = {}, notifyUpdate = true) {
        let map = this.get('map');

        if (fileId) {
            if (bookmarkId) {
                if (map.file[fileId] == bookmarkId && map.bookmark[bookmarkId] == fileId) {
                    return;
                }

                if (map.file.hasOwnProperty(fileId)) {
                    delete map.bookmark[map.file[fileId]];
                }
                if (map.bookmark.hasOwnProperty(bookmarkId)) {
                    delete map.file[map.bookmark[bookmarkId]];
                }

                map.file[fileId] = bookmarkId;
                map.bookmark[bookmarkId] = fileId;
            }
            else {
                if (!map.file.hasOwnProperty(fileId)) {
                    return;
                }

                delete map.bookmark[map.file[fileId]];
                delete map.file[fileId];
            }
        }
        else {
            if (bookmarkId) {
                if (!map.bookmark.hasOwnProperty(bookmarkId)) {
                    return;
                }

                delete map.file[map.bookmark[bookmarkId]];
                delete map.bookmark[bookmarkId];
            }
            else {
                return;
            }
        }

        if (notifyUpdate) {
            AccountManager.refresh(this);
        }
    }
};