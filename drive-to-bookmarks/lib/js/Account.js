import OAuthManager from './OAuthManager.js'
import AccountManager from './AccountManager.js'
import SyncManager from './SyncManager.js'
import FileManager from './FileManager.js'
import BookmarkManager from './BookmarkManager.js'

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
        this.files = new FileManager(this);
        this.bookmarks = new BookmarkManager(this);
    }

    static add() {
        return new Promise((resolve, reject) => {
            let account = new this();

            account.oauth.getNewToken({
                interactive: true,
                updateAccount: false
            })
            .then(oauth => {
                account.set('oauth', oauth);

                return Promise.all([
                    account.getNewProfile(false),
                    account.oauth.get('cloud', {append: '/root'})
                ]);
            })
            .then(([profile, rootFolder]) => {
                account.set('profile', profile);
                account.set('id', profile.id);
                account.set('rootFolderId', rootFolder.id);

                return account.bookmarks.create({
                    // TODO: ADD DEFAULT PARENT
                    title: `DriveToBookmarks - ${account.get('profile').email}`
                })
            })
            .then(bookmark => {
                account.sync.map.set(account.get('rootFolderId'), bookmark.id);

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

    set(key, value, notifyUpdate = false) {
        this._info[key] = value;

        if (notifyUpdate) {
            AccountManager.refresh(this);
        }
    }

    getNewProfile(updateAccount = true) {
        return new Promise((resolve, reject) => {
            this.oauth.get('profile')
            .then(profile => {
                if (updateAccount) {
                    this.set('profile', profile, true)
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

    save() {
        this.sync.save();
    }
};