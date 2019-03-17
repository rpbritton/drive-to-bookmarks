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
                account.mapSet('root', bookmark.id);

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
            BookmarkAPI.get(this.mapGetFile('root'))
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
                        url: file.webViewLink,
                        type: file.mimeType
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
                delete bookmarks[map.file['root']];

                console.log(bookmarks);
                console.log(files);
                console.log(map);

                for (let fileId in map.file) {
                    if (files.hasOwnProperty(fileId)) {
                        updateBookmark(files[fileId]);

                        delete files[fileId];
                        delete bookmarks[map.file[fileId]];
                    }
                    else {
                        if (fileId == 'root') {
                            continue;
                        }

                        BookmarkAPI.remove(map.file[fileId]);
                        this.mapRemoveFile(fileId);
                    }
                }

                for (let fileId in files) {
                    if (files[fileId].parents) {
                        this.createBookmark(fileId, files[fileId])
                        .then(bookmark => {
                            this.mapSet(fileId, bookmark.id);
                            console.log(this._info.map);
                        })
                        // Add bookmark
                        // Update bookmark
                        // Update map
                    }
                }

                for (let bookmarkId in bookmarks) {
                    BookmarkAPI.remove(bookmarkId);
                }
            });
        });
    }

    createBookmark(fileId, properties) {
        return BookmarkAPI.create({
            parentId: this.mapGetFile(properties.parents[0]),
            url: (properties.url == "application/vnd.google-apps.folder") ? null : properties.url,
            title: properties.name
        });
    }

    updateBookmark(fileId, details) {
        // return BookmarkAPI.move({

        // })
        // .then()
    }

    mapGetBookmark(bookmarkId) {
        return this.get('map').bookmark[bookmarkId];
    }

    mapGetFile(fileId) {
        return this.get('map').file[fileId];
    }

    mapGetAllBookmarks() {
        return Object.keys(this.get('map').bookmark);
    }

    mapGetAllFiles() {
        return Object.keys(this.get('map').file);
    }

    mapSet(fileId, bookmarkId, notifyUpdate = false) {
        if (fileId && bookmarkId) {
            let map = this.get('map');

            if (!map.file[fileId]) {
                map.file[fileId] = [];
            }
            map.file[fileId].push(bookmarkId);

            map.bookmark[bookmarkId] = fileId;

            if (notifyUpdate) {
                AccountManager.refresh(this);
            }
        }
    }

    mapRemoveBookmark(bookmarkId, notifyUpdate = false) {
        let map = this.get('map');

        if (bookmarkId && map.bookmark.hasOwnProperty(bookmarkId)) {
            if (map.file[map.bookmarks[bookmarkId]]) {
                
            }

            delete map.file[map.bookmark[bookmarkId]];
            delete map.bookmark[bookmarkId];

            if (notifyUpdate) {
                AccountManager.refresh(this);
            }
        }
    }

    mapRemoveFile(fileId, notifyUpdate = false) {
        let map = this.get('map');

        if (fileId && map.file.hasOwnProperty(fileId)) {
            delete map.bookmark[map.file[fileId]];
            delete map.file[fileId];

            if (notifyUpdate) {
                AccountManager.refresh(this);
            }
        }
    }
};