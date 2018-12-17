/* Modules. */
import * as gapi_manager from './gapi_manager.js'
import * as storage_manager from './storage_manager.js'

/*
 * Add an account, first through gapi then to storage.
 */
export function add() {
    return new Promise((resolve, reject) => {
        /* Gets a new token by interacting with the user. */
        gapi_manager.token({
            'account': null,
            'interactive': true
        })
        .then(empty_account => {
            /* Gets account info. */
            return gapi_manager.update_info(empty_account);
        })
        .then(account => {
            /* Saves the account. */
            return Promise.all([
                account,
                save(account.id, account)
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
 * Saves an account to storage, either overwrites or adds.
 */
export function save(account_id, account_info) {
    return new Promise((resolve, reject) => {
        /* Fetch all accounts. */
        get_all()
        .then(accounts => {
            /* Finds the position of the account in the array. */
            let index = accounts.findIndex(test_account => {
                return (test_account.id == account_id);
            });

            /* Account was found, update it. */
            if (index > -1) {
                Object.assign(accounts[index], account_info);
            }
            /* Account was not found, add it. */
            else {
                account_info.id = account_id;
                accounts.push(account_info);
            }

            /* Save all the accounts. */
            return save_all(accounts);
        })
        .then(() => {
            /* Success. */
            resolve();
        });
    });
}

/*
 * Saves all accounts in the correct storage location.
 */
function save_all(accounts) {
    return new Promise((resolve, reject) => {
        /* Overwrites the account array in storage with new. */
        storage_manager.set({
            'accounts': accounts
        })
        .then(() => {
            /* Success. */
            resolve();
        })
    })
}

/*
 * Refreshes account info and saves it to storage.
 */
export function refresh_info(account_id) {
    return new Promise((resolve, reject) => {
        /* Gets the current account information. */
        get(account_id)
        .then(account => {
            /* Updates the account information. */
            return gapi_manager.update_info(account);
        })
        .then(updated_account => {
            /* Saves the account information. */
            return save(account_id, updated_account);
        })
        .then(() => {
            /* Success. */
            resolve();
        });
    });
}

/*
 * Get account info based off the account id.
 */
export function get(account_id) {
    return new Promise((resolve, reject) => {
        storage_manager.get('accounts')
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
export function get_all() {
    return new Promise((resolve, reject) => {
        storage_manager.get('accounts')
        .then(accounts => {
            /* Create array if it there are no accounts. */
            if (!accounts) {
                accounts = [];
            }

            resolve(accounts);
        })
    });
}

// /*
//  * Remove an account from storage and revoke access.
//  */
// export function remove(account_id) {
//     return new Promise((resolve, reject) => {
//         get_all()
//         .then(accounts => {
//             /* Finds the position of the account in the array. */
//             let index = accounts.findIndex(test_account => {
//                 return (test_account.id == account_id);
//             });

//             /* Account was found, remove it. */
//             if (index > -1) {
//                 accounts.splice(index, 1);
//             }

//             /* Saves the accounts. */
//             save_all(accounts)
//             .then(() => {
//                 resolve();
//             });
//         })
//     });
// }