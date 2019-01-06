/* Modules. */
// import * as gapi_manager from './lib/gapi_manager.js'
// import * as storage_manager from './lib/storage_manager.js'
// import * as nametag_manager from './lib/nametag_manager.js'
import { AccountUIManager } from '../lib/js/account_ui_manager.js'

window.account_ui_manager = new AccountUIManager();

// chrome.storage.local.clear();

/* Add the popup button event. */
document.getElementById('btn_options').addEventListener('click', ev => {
    chrome.runtime.openOptionsPage();
});

/* Add account button. */
document.getElementById('btn_add_account').addEventListener('click', ev => {
    chrome.extension.getBackgroundPage().account_manager.add();
});

/* List stored accounts button. */
document.getElementById('btn_list_accounts').addEventListener('click', ev => {
    chrome.extension.getBackgroundPage().account_manager.get_all()
    .then(accounts => {
        console.log(accounts);
    });
});