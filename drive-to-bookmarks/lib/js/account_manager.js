/* Modules. */
import { GAPIManager } from './gapi_manager.js'
import { StorageManager } from './storage_manager.js'

/*
 * Account manager class.
 */
export class AccountManager {
    /*
     * Simple constructor to initalize storage and gapi managers.
     */
    constructor() {
        this.gapi_manager = new GAPIManager();
        this.storage_manager = new StorageManager();
    }

    /*
    * Add an account, first through gapi then to storage.
    */
    add() {
        return new Promise((resolve, reject) => {
            /* Gets a new token by interacting with the user. */
            this.gapi_manager.get_token({
                'account': null,
                'interactive': true
            })
            .then(empty_account => {
                /* Gets account info. */
                return this.gapi_manager.update_info(empty_account);
            })
            .then(account => {
                /* Saves the account. */
                return Promise.all([
                    account,
                    this.save(account.id, account)
                ]);
            })
            /* Success. */
            .then(result => {
                resolve(result[0]);
            })
            .catch(e => {
                console.error(e);
                /* Error somewhere. */
                reject(Error('Could not add a new account'));
            });
        });
    }

    /*
    * Save account to storage. It will add it if it does not exist.
    */
    save(account_id, account_info = {}, replace = false) {
        return new Promise((resolve, reject) => {
            /* Fetch all accounts. */
            this.get_all()
            .then(accounts => {
                /* Assign the id, just in case. */
                account_info.id = account_id;

                /* Finds the position of the account in the array. */
                let account_i = accounts.findIndex(test_account => {
                    return (test_account.id == account_id);
                });

                if (account_i > -1) {
                    if (replace) {
                        accounts[account_i] = account_info;
                    }
                    else {
                        Object.assign(accounts[account_i], account_info);
                    }
                }
                else {
                    accounts.push(account_info);
                }

                /* Save all the accounts. */
                return this._overwrite(accounts);
            })
            .then(() => {

                /* Success. */
                resolve();
            })
            .catch(error => {
                console.error('Could not save the account');
                reject();
            });
        });
    }

    _overwrite(accounts) {
        return new Promise((resolve, reject) => {
            this.storage_manager.set({
                'accounts': accounts
            })
            .then(result => {
                for (let view of chrome.extension.getViews()) {
                    if (view.account_ui_manager) {
                        view.account_ui_manager.update(accounts);
                    }
                }

                resolve();
            })
            .catch(e => {
                console.error(e);
                reject(Error('Could not save accounts to storage.'));
            })
        });
    }

    /*
    * Refreshes account info and saves it to storage.
    */
    refresh_info(account_id) {
        return new Promise((resolve, reject) => {
            /* Gets the current account information. */
            this.get(account_id)
            .then(account => {
                /* Updates the account information. */
                return this.gapi_manager.update_info(account);
            })
            .then(updated_account => {
                /* Saves the account information. */
                return this.save(account_id, updated_account);
            })
            .then(result => {
                /* Success. */
                resolve();
            });
        });
    }

    /*
    * Get account info based off the account id.
    */
    get(account_id) {
        return new Promise((resolve, reject) => {
            this.storage_manager.get('accounts')
            .then(accounts => {
                /* Find the account in the array. */
                let account = accounts.find(test_account => {
                    return (test_account.id == account_id);
                });

                /* Returns the account if found. */
                if (account) {
                    resolve(account);
                }
                else {
                    reject(Error('Account not found in storage.'));
                }
            })
        });
    }

    /*
    * Get all the stored accounts.
    */
    get_all() {
        return new Promise((resolve, reject) => {
            this.storage_manager.get('accounts')
            .then(accounts => {
                /* Create array if it there are no accounts. */
                if (!accounts) {
                    accounts = [];
                }

                resolve(accounts);
            })
            .catch(e => {
                console.error(e);
                reject(Error('Could not get all the accounts'));
            });
        });
    }

    /*
    * Remove an account from storage and revoke access.
    */
    remove(account_id) {
        return new Promise((resolve, reject) => {
            this.get_all()
            .then(accounts => {
                let account_i = accounts.findIndex(test_account => {
                    return (test_account.id == account_id);
                });

                accounts.splice(account_i, 1);

                return this._overwrite(accounts);
            })
            .then(result => {
                /* Success. */
                resolve();
            })
            .catch(e => {
                console.error(e);
                reject(Error('Could not remove account from storage.'));
            });
        });
    }
}


