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
                    this.update_storage(account.id, account)
                ]);
            })
            /* Success. */
            .then(result => {
                resolve(result[0]);
            })
            .catch(error => {
                /* Error somewhere. */
                console.error('Could not add a new account');
                reject();
            });
        });
    }

    /*
    * Will remove, update, or add an account to storage.
    */
    update_storage(account_id, account_info) {
        return new Promise((resolve, reject) => {
            /* Fetch all accounts. */
            this.get_all()
            .then(accounts => {
                /* Finds the position of the account in the array. */
                let account_i = accounts.findIndex(test_account => {
                    return (test_account.id == account_id);
                });

                let change = {};

                if (account_i > -1) {
                    if (typeof account_info !== 'undefined') {
                        accounts[account_i] = account_info;

                        change.update = accounts[account_i];
                    }
                    else {
                        change.remove = accounts[account_i];

                        accounts.splice(account_i, 1);
                    }
                }
                else {
                    if (typeof account_info !== 'undefined') {
                        accounts.push(account_info);
                        accounts[accounts.length - 1].id = account_id;

                        change.add = accounts[accounts.length - 1];
                    }
                }

                /* Save all the accounts. */
                return Promise.all([
                    change,
                    this.storage_manager.set({
                        'accounts': accounts
                    })
                ]);
            })
            .then(result => {
                for (let view of chrome.extension.getViews()) {
                    if (view.account_ui_manager) {
                        view.account_ui_manager.update(result[0]);
                    }
                }

                /* Success. */
                resolve();
            })
            .catch(error => {
                console.error('Could not save the account');
                reject();
            });
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
                return Promise.all([
                    updated_account,
                    this.update_storage(account_id, updated_account)
                ]);
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
                    console.error('Account not found in storage.');
                    reject();
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
            .catch(error => {
                console.error('Could not get all the accounts');
                reject();
            });
        });
    }

    /*
    * Remove an account from storage and revoke access.
    */
    remove(account_id) {
        return new Promise((resolve, reject) => {
            this.get(account_id)
            .then(account => {
                return Promise.all([
                    // this.gapi_manager.remove(account),
                    this.update_storage(account_id)
                ]);
            })
            .then(result => {
                /* Success. */
                resolve();
            });
        });
    }
}


