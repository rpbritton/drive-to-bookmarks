import AccountOAuth from './AccountOAuth.js';
import AccountStorage from './AccountStorage.js';

export default class AccountManager {
    constructor() {
        this.changeEmitter = document.createElement('null');
    }

    add(provider) {
        provider = provider.toLowerCase();

        return new Promise((resolve, reject) => {
            AccountOAuth.add(provider)
            .then(account => {
                return AccountStorage.add(account.id, account);
            })
            .then(account => {
                resolve(account);
            });
        });
    }

    remove(accountID) {
        return new Promise((resolve, reject) => {
            AccountStorage.remove(accountID)
            .then(() => {
                resolve();
            })
        });
    }

    get(accountID) {
        return AccountStorage.get(accountID);
    }

    getAll() {
        return AccountStorage.getAll();
    }

    dispatchEvent(type, account) {
        let event = new CustomEvent(type, {
            'detail': account
        });

        this.changeEmitter.dispatchEvent(event);
    }
}

export function GetAccountManager() {
    return chrome.extension.getBackgroundPage().accountManager;
}