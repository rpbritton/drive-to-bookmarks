/* Modules. */
import { AccountUIManager } from '../lib/js/account_ui_manager.js'

window.account_ui_manager = new AccountUIManager();

// chrome.storage.local.clear();

/* Add the popup button event. */
document.getElementById('btn_options').addEventListener('click', ev => {
    chrome.runtime.openOptionsPage();
});

// /* Add account button. */
// document.getElementById('btn_add_account').addEventListener('click', ev => {
//     chrome.extension.getBackgroundPage().account_manager.add();
// });

/* List stored accounts button. */
document.getElementById('btn_list_accounts').addEventListener('click', ev => {
    chrome.extension.getBackgroundPage().account_manager.get_all()
    .then(accounts => {
        console.log(accounts);
    });
});