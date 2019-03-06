import AccountManager from './AccountManager.js'
import Account from './Account.js';
// import AccountOAuth from './AccountOAuth.js'

class SyncManagerBackground {
    constructor() {
    }

    ta() {
        let accounts = AccountManager.get()

        for (let account of accounts) {
            account.fullSync();

            // AccountOAuth.get(account.id, 'drive', '&pageSize=1000&q=root+in+parents')
            // AccountOAuth.get(account.id, 'drive', '&pageSize=1000&q=%271h-K8eUu02cR9TJpJMDIMW46IxwkqAtii%27+in+parents')
            // .then(result => { 
            //     console.log(result);
            // });
        }
    }
}

export function GetSyncManager() {
    let background = chrome.extension.getBackgroundPage();

    if (!background.syncManager) {
        background.syncManager = new SyncManagerBackground();
    }

    return background.syncManager;
}

var SyncManager = GetSyncManager();
export default SyncManager;