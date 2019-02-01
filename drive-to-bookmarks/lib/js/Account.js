import OAuth from './OAuth.js'
import AccountManager from './AccountManager.js'

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
                    id: profile.id
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

    // getTree();
};