import AccountManager from './AccountManager.js'
import AccountOAuth from './AccountOAuth.js'

export default class SyncManager {
    constructor() {
    }

    static test() {
        AccountManager.getAll()
        .then(accounts => {
            for (let account of accounts) {
                // AccountOAuth.get(account.id, 'drive', '&pageSize=1000&q=root+in+parents')
                AccountOAuth.get(account.id, 'drive', '&pageSize=1000&q=%271h-K8eUu02cR9TJpJMDIMW46IxwkqAtii%27+in+parents')
                .then(result => { 
                    console.log(result);
                });
            }
        });
    }
}