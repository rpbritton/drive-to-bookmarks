/* Modules. */
import AccountUIManager from '../lib/js/AccountUIManager.js'
import StorageAPI from '../lib/js/StorageAPI.js'

window.accountUIManager = new AccountUIManager();

/* List stored accounts button. */
document.getElementById('btn_list_accounts').addEventListener('click', ev => {
    chrome.extension.getBackgroundPage().accountManager.getAll()
    .then(accounts => {
        console.log(accounts);
    });
});

/* Clear storage. */
document.getElementById('btn_clear_storage').addEventListener('click', event => {
    StorageAPI.clear()
    .then(() => {
        console.log('cleared');
    });
});