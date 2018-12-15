/*
 * Fetches account information of the given account id.
 */
export function get_account(account_id) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(account_id, storage => {
            let account = storage[account_id];

            if (account != null) {
                resolve(account);
            }
            else {
                reject();
            }
        });
    });
}

/*
 * Returns the IDs of all the stored accounts.
 */
export function get_all_accounts() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(null, storage => {
            let account_ids = [];

            if (storage != null) {
                for (let key in storage) {
                    if (key.use == 'account') {
                        account_ids.push();
                    }
                }
            }

            resolve(account_ids);
        });
    });
}

/*
 * Saves account info based on the ID, overwriting previous options if they
 * already exist.
 */
export function save_account(account_id, account_properties) {
    return new Promise((resolve, reject) => {
        let account;

        get_account(account_id)
        .then(old_account => {
            account = old_account;
        })
        .catch(error => {
            account = {
                'use': 'account'
            };
        })
        .finally(() => {
            Object.assign(account, account_properties);

            chrome.storage.local.set({
                [account_id]: storage[account_id]
            }, () => {
                resolve();
            });
        });
    });
}

/*
 * Removes all information about an account from the storage.
 */
export function remove_account(account_id) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove(account_id, () => {
            resolve();
        });
    });
}