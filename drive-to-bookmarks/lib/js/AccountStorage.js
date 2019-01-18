import StorageAPI from './StorageAPI.js'
import { GetAccountManager } from './AccountManager.js'

export default class AccountStorage {
    static add(accountID, accountInfo = {}) {
        return new Promise((resolve, reject) => {
            AccountStorage.getAll()
            .then(accounts => {
                let accountIndex = accounts.findIndex(testAccount => {
                    return testAccount.id == accountID;
                });

                if (accountIndex > -1) {
                    return Promise.reject(Error('Account in storage'));
                }
                else {
                    accountInfo.id = accountID;

                    accounts.push(accountInfo);

                    return Promise.all([
                        accounts[accounts.length - 1],
                        overwriteStorage(accounts)
                    ]);
                }
            })
            .then(([account]) => {
                GetAccountManager().dispatchEvent('add', account);

                resolve(accountInfo);
            })
            .catch(e => {
                console.error(e);
                reject(Error('Could not add account'));
            });
        });
    }

    static update(accountID, newInfo = {}, replace = false) {
        return new Promise((resolve, reject) => {
            AccountStorage.getAll()
            .then(accounts => {
                let accountIndex = accounts.findIndex(testAccount => {
                    return testAccount.id == accountID;
                });

                if (accountIndex > -1) {
                    newInfo.id = accountID;

                    if (replace) {
                        accounts[accountIndex] = newInfo;
                    }
                    else {
                        Object.assign(accounts[accountIndex], newInfo);
                    }

                    return Promise.all([
                        accounts[accountIndex],
                        overwriteStorage(accounts)
                    ]);
                }
                else {
                    return Promise.reject(Error('Accout not found'));
                }
            })
            .then(([account]) => {
                GetAccountManager().dispatchEvent('update', account);

                resolve(account);
            })
            .catch(e => {
                console.error(e)
                reject(Error('Could not update account'));
            });
        });
    }

    static remove(accountID) {
        return new Promise((resolve, reject) => {
            AccountStorage.getAll()
            .then(accounts => {
                let accountIndex = accounts.findIndex(testAccount => {
                    return testAccount.id == accountID;
                });

                if (accountIndex > -1) {
                    let account = accounts[accountIndex];

                    accounts.splice(accountIndex, 1);

                    return Promise.all([
                        account,
                        overwriteStorage(accounts)
                    ]);
                }
            })
            .then(([account]) => {
                GetAccountManager().dispatchEvent('remove', account);

                resolve();
            })
            .catch(e => {
                console.error(e);
                reject(Error('Could not remove account'));
            })
        });
    }

    static get(accountID) {
        return new Promise((resolve, reject) => {
            AccountStorage.getAll()
            .then(accounts => {
                let account = accounts.find(testAccount => {
                    return testAccount.id == accountID;
                })

                if (account) {
                    resolve(account);
                }
                else {
                    reject(Error('Account not found'));
                }
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            StorageAPI.get('accounts')
            .then(accounts => {
                if (!accounts) {
                    accounts = [];
                }

                resolve(accounts);
            })
            .catch(e => {
                console.error(e);
                reject(Error('Could not get all the accounts'));
            })
        });
    }
}

function overwriteStorage(accounts) {
    return new Promise((resolve, reject) => {
        StorageAPI.set({
            'accounts': accounts
        })
        .then(() => {
            resolve(accounts);
        })
        .catch(e => {
            console.error(e);
            reject(Error('Could not overwrite accounts'));
        });
    });
}