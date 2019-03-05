import OAuth from './OAuth.js'
import AccountManager from './AccountManager.js'
import BookmarkAPI from './BookmarkAPI.js'

export default class Account {
    constructor(info = {}) {
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
                    files: {
                        cloud: {},
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
                account.fileMapper({
                    cloudId: 'root',
                    bookmarkId: bookmark.id
                }, false);

                AccountManager.add(account);

                resolve(account);
            });
        });
    }

    get(keys) {
        if (keys) {
            if (keys.constructor === Array) {
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
        else {
            return this._info;
        }
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
            BookmarkAPI.get(this.fileMapper({
                cloudId: 'root'
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

    getAllCloud() {
        return new Promise((resolve, reject) => {
            OAuth.get(this, 'cloud', this.urls.cloud.files)
            .then(result => {
                let cloud = {}

                for (let file of result.files) {
                    cloud[file.id] = {
                        name: file.name,
                        parents: file.parents,
                        webViewLink: file.webViewLink
                    };
                }

                resolve(cloud);
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

    fileMapper({cloudId, bookmarkId} = {}, notifyUpdate = true) {
        let files = this.get('files');

        if (cloudId) {
            if (bookmarkId) {
                files.cloud[cloudId] = bookmarkId;
                files.bookmark[bookmarkId] = cloudId;

                if (notifyUpdate) {
                    AccountManager.refresh(this);
                }
            }
            else {
                return files.cloud[cloudId];
            }
        }
        else {
            if (bookmarkId) {
                return files.bookmark[bookmarkId];
            }
            else {
                return;
            }
        }
    }
};