/*
 * Fetches account information of the given account id.
 */
export function get_account(account_id) {
    return new Promise((resolve, reject) => {
        /* Retrieve all the accounts. */
        get_all_accounts()
        .then(accounts => {
            /* Find the account of the given id. */
            let account = accounts.find(test_account => {
                return (test_account.id == account_id)
            });

            /* Resolve if found. */
            if (account) {
                resolve(account);
            }
            else {
                reject();
            }
        });
    });
}

/*
 * Returns all of the stored accounts.
 */
export function get_all_accounts() {
    return new Promise((resolve, reject) => {
        /* Get all the accounts from storage. */
        chrome.storage.local.get('accounts', storage => {
            /* Returns the accounts or an empty array. */
            if (storage.accounts) {
                resolve(storage.accounts);
            }
            else {
                resolve([]);
            }
        });
    });
}

/*
 * Saves account info based on the ID, overwriting previous options if they
 * already exist.
 */
export function save_account(account_id, account_properties) {
    return new Promise((resolve, reject) => {
        /* Retrieve all the accounts. */
        get_all_accounts()
        .then(accounts => {
            /* Finds the position of the previously saved account. */
            let index = accounts.findIndex(test_account => {
                return (test_account.id == account_id);
            })

            /* If the account was found, update it. */
            if (index > -1) {
                Object.assign(accounts[index], account_properties);
            }
            /* If the account was not found, add it. */
            else {
                account_properties.id = account_id;
                accounts.push(account_properties);
            }

            /* Save the new account array. */
            chrome.storage.local.set({
                'accounts': accounts
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
        /* Retrieve all the accounts. */
        get_all_accounts()
        .then(accounts => {
            /* Find the index of the account to remove. */
            let index = findIndex(accounts, test_account => {
                return (test_account.id == account_id);
            })

            /* If found, remove it. */
            if (index) {
                accounts[index].splice(index, 1);
            }

            /* Save the new array. */
            chrome.storage.local.set({
                'accounts': accounts
            }, () => {
                resolve();
            });
        });
    });
}