/* Modules. */
import * as gapi_manager from './lib/gapi_manager.js'
import * as storage_manager from './lib/storage_manager.js'
import * as nametag_manager from './lib/nametag_manager.js'

// chrome.storage.local.clear();

/* Add the popup button event. */
document.getElementById('btn_options').addEventListener('click', ev => {
    chrome.runtime.openOptionsPage();
});

// /* Add the account labels. */
// nametag_manager.update();

/* Add account button. */
document.getElementById('btn_add_account').addEventListener('click', ev => {
    gapi_manager.add_account()
    .then(account_id => {
        // nametag_manager.update();
    });
});

/* List stored accounts button. */
document.getElementById('btn_list_accounts').addEventListener('click', ev => {
    storage_manager.get_all_accounts()
    .then(accounts => {
        console.log(accounts);
    });
});