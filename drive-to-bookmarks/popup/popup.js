/* Modules. */
import AccountUIManager from '../lib/js/AccountUIManager.js'

import StorageAPI from '../lib/js/StorageAPI.js'
import AccountManager from '../lib/js/AccountManager.js'

var accountUIManager = new AccountUIManager();
accountUIManager.init();

// /* List stored accounts button. */
// document.getElementById('btn_add_account').addEventListener('click', ev => {
//     AccountProviders.get('Google').add()
//     .then(account => {
//         // console.log(account);
//     });
// });

/* List stored accounts button. */
document.getElementById('btn_list_accounts').addEventListener('click', ev => {
    console.log(AccountManager.getAll());
});

/* Clear storage. */
document.getElementById('btn_clear_storage').addEventListener('click', event => {
    StorageAPI.clear()
    .then(() => {
        console.log('cleared');
    });
});