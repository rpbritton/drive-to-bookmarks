import OAuthManager from './OAuthManager.js'
import AccountManager from './AccountManager.js'
import SyncManager from './SyncManager.js'
// import BookmarkAPI from './BookmarkAPI.js'
// import BookmarkManager from './BookmarkManager.js'

export default class Account {
    constructor(info = {}) {
        // TODO: Add default settings
        this._info = {
            profile: null,
            id: null
        }
        Object.assign(this._info, info);

        this.oauth = new OAuthManager(this);
        this.sync = new SyncManager(this);
    }

    static add() {
        return new Promise((resolve, reject) => {
            let account = new this();

            account.oauth.getNewToken({
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

                // this.bookmarkManager...
                // return BookmarkAPI.create({
                //     // 'parentId: ' TODO: Add default place
                //     // TODO: Add default name
                //     'title': `DriveToBookmarks - ${account.get('profile').email}`
                // });
            })
            .then(bookmark => {
                // account.map.set('root', bookmark.id);

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

    set(newInfo, notifyUpdate = false) {
        Object.assign(this._info, newInfo);

        if (notifyUpdate) {
            AccountManager.refresh(this);
        }
    }

    getNewProfile(updateAccount = true) {
        return new Promise((resolve, reject) => {
            this.oauth.get('profile')
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
        this.sync.save();
    }
};