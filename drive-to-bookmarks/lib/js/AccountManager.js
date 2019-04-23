import StorageAPI from './StorageAPI.js'
import AccountProviders from './AccountProviders.js'

class AccountManagerBackground {
    constructor() {
        this.accounts = [];
    }

    start() {
        for (let account in this.accounts) {
            this.dispatchEvent('remove', account);
        }
        this.accounts = [];

        return StorageAPI.get('accounts')
        .then(accountsInfo => {
            if (Array.isArray(accountsInfo)) {
                for (let info of accountsInfo) {
                    this.accounts.push(new (AccountProviders.get(info.provider))(info));

                    this.accounts[this.accounts.length - 1].start();

                    this.dispatchEvent('add', this.accounts[this.accounts.length - 1]);
                }
            } 
            else {
                saveAccounts();
            }

            return Promise.resolve();
        });
    }

    addNew(provider) {
        return new Promise((resolve, reject) => {
            AccountProviders.get(provider).add()
            .then(account => {
                resolve(account);
            });
        });
    }

    add(account) {
        let old_account = this.get(account.get('id'));

        if (old_account) {
            old_account.set(account.get());
        }
        else {
            this.accounts.push(account);

            this.dispatchEvent('add', account);

            saveAccounts();
        }
    }

    remove(account) {
        let index = this.accounts.findIndex(testAccount => {
            return account.get('id') == testAccount.get('id');
        });

        this.accounts.splice(index, 1);

        this.dispatchEvent('remove', account);

        saveAccounts();
    }

    refresh(account) {
        this.dispatchEvent('update', account);

        saveAccounts();
    }

    get(accountId) {
        return this.accounts.find(testAccount => {
            return testAccount.get('id') == accountId;
        });
    }

    getAll() {
        return this.accounts;
    }

    get changes() {
        if (!this._changeEmitter) {
            this._changeEmitter = document.createElement('null');
        }

        return this._changeEmitter;
    }

    dispatchEvent(type, account) {
        let event = new CustomEvent(type, {
            detail: account
        });

        this.changes.dispatchEvent(event);
    }
}

function saveAccounts() {
    let accountsInfos = [];

    let accounts = AccountManager.getAll();

    for (let account of accounts) {
        account.save();
        accountsInfos.push(account.getAll());
    }

    return StorageAPI.set({
        accounts: accountsInfos
    });
}

export function GetAccountManager() {
    let background = chrome.extension.getBackgroundPage();

    if (!background.accountManager) {
        background.accountManager = new AccountManagerBackground();
    }

    return background.accountManager;
}

var AccountManager = GetAccountManager();
export default AccountManager;