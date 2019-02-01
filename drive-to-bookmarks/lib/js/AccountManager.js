import StorageAPI from './StorageAPI.js'
import AccountProviders from './AccountProviders.js'

class AccountBackgroundManager {
    constructor() {
        this._accounts = [];
    }

    reset() {
        return new Promise((resolve, reject) => {
            for (let account in this._accounts) {
                this.dispatchEvent('remove', account);
            }
            this._accounts = [];

            StorageAPI.get('accounts')
            .then(accountsInfo => {
                if (accountsInfo && accountsInfo.constructor === Array) {
                    for (let info of accountsInfo) {
                        this._accounts.push(new (AccountProviders.get(info.provider))(info));

                        this.dispatchEvent('add', this._accounts[this._accounts.length - 1]);
                    }
                } 
                else {
                    _saveAccounts();
                }

                resolve();
            });
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
            this._accounts.push(account);

            this.dispatchEvent('add', account);

            _saveAccounts();
        }
    }

    remove(account) {
        let index = this._accounts.findIndex(testAccount => {
            return account.get('id') == testAccount.get('id');
        });

        this._accounts.splice(index, 1);

        this.dispatchEvent('remove', account);

        _saveAccounts();
    }

    refresh(account) {
        this.dispatchEvent('update', account);

        _saveAccounts();
    }

    get(accountID) {
        if (accountID) {
            return this._accounts.find(testAccount => {
                return testAccount.get('id') == accountID;
            });
        }
        else {
            return this._accounts;
        }
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

function _saveAccounts() {
    let accountsInfos = [];

    let accounts = AccountManager.get();

    for (let account of accounts) {
        accountsInfos.push(account.get());
    }

    return StorageAPI.set({
        accounts: accountsInfos
    });
}

export function GetAccountManager() {
    let background = chrome.extension.getBackgroundPage();

    if (!background.accountManager) {
        background.accountManager = new AccountBackgroundManager();
    }

    return background.accountManager;
}

var AccountManager = GetAccountManager();
export default AccountManager;